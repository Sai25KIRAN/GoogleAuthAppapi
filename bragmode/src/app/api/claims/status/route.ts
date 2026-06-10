import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';
import { dodo } from '@/lib/dodo';
import { generateCardImage } from '@/lib/card-generator';
import { sendFounderEmails } from '@/lib/resend';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get('payment_id');

    if (!paymentId) {
      return NextResponse.json({ error: 'Missing payment_id parameter' }, { status: 400 });
    }

    // Check if a claim has been recorded for this payment ID
    const { data: claim, error } = await supabaseAdmin
      .from('founder_claims')
      .select('id, founder_number, country_id, hot_take, claimed_at, countries(name, flag, max_founders)')
      .eq('dodo_payment_id', paymentId)
      .maybeSingle();

    if (error) {
      console.error('Database error checking claim status:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!claim) {
      // Fallback: Check Dodo Payments directly
      // This solves issues where webhook is delayed or fails to reach development/localhost servers.
      console.log(`No claim found in DB for payment ID: ${paymentId}. Querying Dodo Payments directly...`);
      try {
        const payment = await dodo.payments.retrieve(paymentId);
        if (payment && payment.status === 'succeeded') {
          console.log(`Dodo Payment status is succeeded. Generating claim on-the-fly...`);
          const metadata = payment.metadata || {};
          const {
            email,
            country_id: countryId,
            founder_number: founderNumberStr,
            world_cup_winner: worldCupWinner,
            golden_boot: goldenBoot,
            dark_horse: darkHorse,
            biggest_flop: biggestFlop,
            hot_take: hotTake,
            reservation_id: reservationId,
          } = metadata;

          if (email && countryId && founderNumberStr) {
            const founderNumber = parseInt(founderNumberStr, 10);

            // Double check inside database to avoid race conditions
            const { data: doubleCheckClaim } = await supabaseAdmin
              .from('founder_claims')
              .select('id, founder_number, country_id, hot_take, claimed_at, countries(name, flag, max_founders)')
              .eq('dodo_payment_id', paymentId)
              .maybeSingle();

            if (doubleCheckClaim) {
              const countriesInfo = doubleCheckClaim.countries as unknown as { name: string; flag: string; max_founders: number } | null;
              return NextResponse.json({
                status: 'succeeded',
                claimId: doubleCheckClaim.id,
                founderNumber: doubleCheckClaim.founder_number,
                countryName: countriesInfo?.name || '',
                flag: countriesInfo?.flag || '',
                hotTake: doubleCheckClaim.hot_take || '',
                claimedAt: doubleCheckClaim.claimed_at || '',
                maxFounders: countriesInfo?.max_founders || 1000,
              });
            }

            // Fetch country details
            const { data: country, error: countryError } = await supabaseAdmin
              .from('countries')
              .select('*')
              .eq('id', countryId)
              .single();

            if (countryError || !country) {
              console.error('Error fetching country inside status fallback:', countryError);
              return NextResponse.json({ error: 'Country not found for this payment' }, { status: 500 });
            }

            // Generate claim hash
            const serverSecret = process.env.FOUNDER_SECRET || 'default_secret';
            const claimHashSource = `${countryId}${founderNumber}${paymentId}${serverSecret}`;
            const claimHash = crypto.createHash('sha256').update(claimHashSource).digest('hex');

            // Generate card image
            let imageBuffer: Buffer;
            try {
              imageBuffer = await generateCardImage({
                countryName: country.name,
                flag: country.flag,
                founderNumber,
                worldCupWinner: worldCupWinner || '',
                goldenBoot: goldenBoot || '',
                darkHorse: darkHorse || '',
                biggestFlop: biggestFlop || '',
                hotTake: hotTake || '',
                claimHash,
                isClaimed: true,
              });
            } catch (err) {
              console.error('Error generating card image in status fallback:', err);
              return NextResponse.json({ error: 'Failed to generate card image' }, { status: 500 });
            }

            // Upload image to Supabase Storage
            const storagePath = `cards/${countryId}/${founderNumber}.png`;
            const { error: uploadError } = await supabaseAdmin.storage
              .from('founder-cards')
              .upload(storagePath, imageBuffer, {
                contentType: 'image/png',
                upsert: true,
              });

            if (uploadError) {
              console.error('Supabase storage upload error in status fallback, checking bucket...');
              await supabaseAdmin.storage.createBucket('founder-cards', { public: false });
              const { error: retryError } = await supabaseAdmin.storage
                .from('founder-cards')
                .upload(storagePath, imageBuffer, {
                  contentType: 'image/png',
                  upsert: true,
                });
              if (retryError) {
                console.error('Retry failed:', retryError);
                return NextResponse.json({ error: 'Failed to upload card to storage' }, { status: 500 });
              }
            }

            // Insert claim
            const { data: newClaim, error: claimError } = await supabaseAdmin
              .from('founder_claims')
              .insert({
                email,
                country_id: countryId,
                founder_number: founderNumber,
                world_cup_winner: worldCupWinner || '',
                golden_boot: goldenBoot || '',
                dark_horse: darkHorse || '',
                biggest_flop: biggestFlop || '',
                hot_take: hotTake || '',
                payment_status: 'succeeded',
                dodo_payment_id: paymentId,
                claim_hash: claimHash,
                claimed_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
              })
              .select()
              .single();

            if (claimError) {
              console.error('Error inserting founder claim in status fallback:', claimError);
              return NextResponse.json({ error: 'Failed to save founder claim' }, { status: 500 });
            }

            // Delete reservation
            if (reservationId) {
              await supabaseAdmin.from('reservations').delete().eq('id', reservationId);
            }

            // Send emails
            try {
              await sendFounderEmails({
                email,
                countryName: country.name,
                flag: country.flag,
                founderNumber,
                hotTake: hotTake || '',
                claimId: newClaim.id,
              });
            } catch (emailErr) {
              console.error('Failed to send email in status fallback:', emailErr);
            }

            return NextResponse.json({
              status: 'succeeded',
              claimId: newClaim.id,
              founderNumber: newClaim.founder_number,
              countryName: country.name,
              flag: country.flag,
              hotTake: newClaim.hot_take || '',
              claimedAt: newClaim.claimed_at || '',
              maxFounders: country.max_founders || 1000,
            });
          }
        }
      } catch (dodoErr) {
        console.error('Error fetching/processing payment from Dodo Payments:', dodoErr);
      }

      return NextResponse.json({ status: 'pending' });
    }

    const countriesInfo = claim.countries as unknown as { name: string; flag: string; max_founders: number } | null;

    return NextResponse.json({
      status: 'succeeded',
      claimId: claim.id,
      founderNumber: claim.founder_number,
      countryName: countriesInfo?.name || '',
      flag: countriesInfo?.flag || '',
      hotTake: claim.hot_take || '',
      claimedAt: claim.claimed_at || '',
      maxFounders: countriesInfo?.max_founders || 1000,
    });
  } catch (err) {
    console.error('Error in status API route:', err);
    const errMsg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
