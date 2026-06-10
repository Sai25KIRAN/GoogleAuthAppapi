import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { Webhook } from 'standardwebhooks';
import { supabaseAdmin } from '@/lib/supabase';
import { generateCardImage } from '@/lib/card-generator';
import { sendFounderEmails } from '@/lib/resend';

const webhookSecret = process.env.DODO_WEBHOOK_SECRET || '';

export async function POST(req: NextRequest) {
  console.log('Webhook request received');
  let bodyText = '';
  
  try {
    bodyText = await req.text();
  } catch (err) {
    console.error('Error reading request body text:', err);
    return new NextResponse('Error reading request body', { status: 400 });
  }

  // 1. Verify Webhook Signature if secret is configured
  if (webhookSecret) {
    const headers = {
      'webhook-id': req.headers.get('webhook-id') || '',
      'webhook-signature': req.headers.get('webhook-signature') || '',
      'webhook-timestamp': req.headers.get('webhook-timestamp') || '',
    };

    if (!headers['webhook-id'] || !headers['webhook-signature'] || !headers['webhook-timestamp']) {
      console.error('Missing required webhook verification headers');
      return new NextResponse('Missing signature headers', { status: 401 });
    }

    try {
      const wh = new Webhook(webhookSecret);
      wh.verify(bodyText, headers);
      console.log('Webhook signature verified successfully.');
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown verification error';
      console.error('Webhook verification failed:', errMsg);
      return new NextResponse('Invalid webhook signature', { status: 401 });
    }
  } else {
    console.warn('Warning: DODO_WEBHOOK_SECRET is not set. Skipping signature verification in development.');
  }

  interface DodoWebhookData {
    payment_id: string;
    metadata: {
      email: string;
      country_id: string;
      founder_number: string;
      world_cup_winner: string;
      golden_boot: string;
      dark_horse: string;
      biggest_flop: string;
      hot_take: string;
      reservation_id: string;
    };
  }

  interface DodoWebhookEvent {
    type: string;
    data: DodoWebhookData;
  }

  // 2. Parse Webhook Event Data
  let event: DodoWebhookEvent;
  try {
    event = JSON.parse(bodyText) as DodoWebhookEvent;
  } catch {
    console.error('Failed to parse webhook JSON body');
    return new NextResponse('Invalid JSON body', { status: 400 });
  }

  const { type, data } = event;
  console.log(`Processing event type: ${type}`);

  if (type === 'payment.succeeded') {
    const paymentId = data.payment_id;
    const metadata = data.metadata || {};

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

    if (!email || !countryId || !founderNumberStr || !paymentId) {
      console.error('Missing vital metadata in payment.succeeded event:', metadata);
      return NextResponse.json({ error: 'Missing metadata in webhook event' }, { status: 400 });
    }

    const founderNumber = parseInt(founderNumberStr, 10);

    // Check if the claim already exists (Idempotency)
    const { data: existingClaim } = await supabaseAdmin
      .from('founder_claims')
      .select('id')
      .eq('dodo_payment_id', paymentId)
      .maybeSingle();

    if (existingClaim) {
      console.log(`Claim already processed for payment ID: ${paymentId}. Returning 200 OK.`);
      return NextResponse.json({ success: true, message: 'Already processed' });
    }

    // Fetch country details to render card and retrieve country name/flag
    const { data: country, error: countryError } = await supabaseAdmin
      .from('countries')
      .select('*')
      .eq('id', countryId)
      .single();

    if (countryError || !country) {
      console.error('Error fetching country inside webhook:', countryError);
      return NextResponse.json({ error: 'Country not found' }, { status: 500 });
    }

    // Generate secure claim hash: SHA256(country_id + founder_number + payment_id + server_secret)
    const serverSecret = process.env.FOUNDER_SECRET || 'default_secret';
    const claimHashSource = `${countryId}${founderNumber}${paymentId}${serverSecret}`;
    const claimHash = crypto.createHash('sha256').update(claimHashSource).digest('hex');

    console.log(`Generated Claim Hash: ${claimHash}`);

    // Generate the final card image buffer
    let imageBuffer: Buffer;
    try {
      imageBuffer = await generateCardImage({
        countryName: country.name,
        flag: country.flag,
        founderNumber,
        worldCupWinner,
        goldenBoot,
        darkHorse,
        biggestFlop,
        hotTake,
        claimHash,
        isClaimed: true,
      });
      console.log('Card image generated successfully.');
    } catch (err) {
      console.error('Error generating card image inside webhook:', err);
      return NextResponse.json({ error: 'Failed to generate card image' }, { status: 500 });
    }

    // Upload image to Supabase private storage
    // Bucket: 'founder-cards', File path: 'cards/[countryId]/[founderNumber].png'
    const storagePath = `cards/${countryId}/${founderNumber}.png`;
    console.log(`Uploading card image to Supabase Storage: founder-cards/${storagePath}...`);
    
    const { error: uploadError } = await supabaseAdmin.storage
      .from('founder-cards')
      .upload(storagePath, imageBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      // Let's create the bucket in case it doesn't exist, and retry once.
      console.log('Attempting to check/create bucket founder-cards...');
      await supabaseAdmin.storage.createBucket('founder-cards', { public: false });
      
      const { error: retryError } = await supabaseAdmin.storage
        .from('founder-cards')
        .upload(storagePath, imageBuffer, {
          contentType: 'image/png',
          upsert: true,
        });
        
      if (retryError) {
        console.error('Supabase storage upload retry failed:', retryError);
        return NextResponse.json({ error: 'Failed to upload card to storage' }, { status: 500 });
      }
    }

    // Insert founder claim record
    console.log('Creating founder claim record in database...');
    const { data: claim, error: claimError } = await supabaseAdmin
      .from('founder_claims')
      .insert({
        email,
        country_id: countryId,
        founder_number: founderNumber,
        world_cup_winner: worldCupWinner,
        golden_boot: goldenBoot,
        dark_horse: darkHorse,
        biggest_flop: biggestFlop,
        hot_take: hotTake,
        payment_status: 'succeeded',
        dodo_payment_id: paymentId,
        claim_hash: claimHash,
        claimed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (claimError) {
      console.error('Error inserting founder claim:', claimError);
      return NextResponse.json({ error: 'Failed to save founder claim' }, { status: 500 });
    }

    console.log(`Claim recorded successfully with id: ${claim.id}`);

    // Delete active reservation to free memory
    if (reservationId) {
      console.log(`Deleting reservation ID: ${reservationId}`);
      await supabaseAdmin.from('reservations').delete().eq('id', reservationId);
    }

    // Dispatch emails via Resend
    console.log('Dispatching emails...');
    await sendFounderEmails({
      email,
      countryName: country.name,
      flag: country.flag,
      founderNumber,
      hotTake,
      claimId: claim.id,
    });

    console.log('Webhook payment.succeeded processing complete.');
    return NextResponse.json({ success: true, claimId: claim.id });
  } else if (type === 'payment.failed') {
    console.log(`Payment failed for event: ${data.payment_id}. Skipping database claim insertion.`);
    return NextResponse.json({ success: true, message: 'Payment failure logged' });
  }

  return NextResponse.json({ success: true, message: 'Event ignored' });
}
