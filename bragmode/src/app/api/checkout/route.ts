import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { dodo } from '@/lib/dodo';

export async function POST(req: NextRequest) {
  try {
    const {
      email,
      countryId,
      sessionId,
      worldCupWinner,
      goldenBoot,
      darkHorse,
      biggestFlop,
      hotTake,
    } = await req.json();

    if (!email || !countryId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required parameters (email, countryId, or sessionId)' },
        { status: 400 }
      );
    }

    // 1. Look up the active reservation
    const nowStr = new Date().toISOString();
    const { data: reservation, error: resError } = await supabaseAdmin
      .from('reservations')
      .select('*')
      .eq('country_id', countryId)
      .eq('session_id', sessionId)
      .gte('expires_at', nowStr)
      .maybeSingle();

    if (resError) {
      console.error('Database error fetching reservation:', resError);
      return NextResponse.json({ error: 'Database error fetching reservation' }, { status: 500 });
    }

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation has expired or is invalid. Please select your nation again.' },
        { status: 400 }
      );
    }

    // 2. Update the reservation with the collected email
    const { error: updateError } = await supabaseAdmin
      .from('reservations')
      .update({ email })
      .eq('id', reservation.id);

    if (updateError) {
      console.error('Error updating reservation email:', updateError);
      return NextResponse.json({ error: 'Failed to record email' }, { status: 500 });
    }

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const productId = process.env.DODO_PRODUCT_ID || 'prod_test_bragmode';

    // 3. Create checkout session via Dodo Payments
    console.log(`Creating Dodo Payments checkout session for product ${productId} and email ${email}...`);
    
    // We pass predictions as metadata to reconstruct the claims record upon payment success webhook.
    const checkoutSession = await dodo.checkoutSessions.create({
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],
      customer: {
        email: email,
      },
      return_url: `${appUrl}/claim-success`,
      metadata: {
        email: email,
        country_id: countryId,
        founder_number: String(reservation.reserved_number),
        world_cup_winner: worldCupWinner || '',
        golden_boot: goldenBoot || '',
        dark_horse: darkHorse || '',
        biggest_flop: biggestFlop || '',
        hot_take: hotTake || '',
        reservation_id: reservation.id,
      },
    });

    if (!checkoutSession || !checkoutSession.checkout_url) {
      console.error('Dodo did not return a checkout_url:', checkoutSession);
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      checkoutUrl: checkoutSession.checkout_url,
    });
  } catch (err) {
    console.error('Error in checkout API route:', err);
    const errMsg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    );
  }
}
