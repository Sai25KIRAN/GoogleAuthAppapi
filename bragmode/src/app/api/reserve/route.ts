import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { countryId, sessionId } = await req.json();

    if (!countryId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing countryId or sessionId' },
        { status: 400 }
      );
    }

    // Call stored procedure to safely find and lock the next available number
    const { data, error } = await supabaseAdmin.rpc('reserve_founder_number', {
      p_country_id: countryId,
      p_session_id: sessionId,
    });

    if (error) {
      console.error('RPC Error reserving founder number:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to reserve number' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No founder numbers available for this country' },
        { status: 409 }
      );
    }

    // Since RPC returns a table, we take the first record
    const { reserved_number, expires_at } = data[0];

    return NextResponse.json({
      reservedNumber: reserved_number,
      expiresAt: expires_at,
    });
  } catch (err) {
    console.error('Error in reserve API route:', err);
    const errMsg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    );
  }
}
