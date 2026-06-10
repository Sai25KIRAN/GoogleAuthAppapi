import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

interface RouteContext {
  params: Promise<{
    claimId: string;
  }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { claimId } = await context.params;

    if (!claimId) {
      return NextResponse.json({ error: 'Missing claimId parameter' }, { status: 400 });
    }

    // 1. Fetch the claim details
    const { data: claim, error: claimError } = await supabaseAdmin
      .from('founder_claims')
      .select('country_id, founder_number')
      .eq('id', claimId)
      .maybeSingle();

    if (claimError) {
      console.error('Database error fetching claim for download:', claimError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    // 2. Generate a signed URL for the card image
    // Expiry: 5 minutes (300 seconds)
    const storagePath = `cards/${claim.country_id}/${claim.founder_number}.png`;
    console.log(`Generating signed URL for Supabase storage file: ${storagePath}...`);

    const { data, error: storageError } = await supabaseAdmin.storage
      .from('founder-cards')
      .createSignedUrl(storagePath, 300);

    if (storageError || !data || !data.signedUrl) {
      console.error('Supabase storage error generating signed URL:', storageError);
      return NextResponse.json({ error: 'Failed to generate signed download URL' }, { status: 500 });
    }

    // 3. Redirect user to the private signed URL
    return NextResponse.redirect(data.signedUrl);
  } catch (err) {
    console.error('Error in download API route:', err);
    const errMsg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
