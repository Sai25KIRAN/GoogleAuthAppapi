import React from 'react';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import FounderClient from './founder-client';

interface FounderPageProps {
  params: Promise<{
    country: string;
    number: string;
  }>;
}

export const revalidate = 60; // Cache page for 60 seconds (ISG style)

export default async function FounderPage({ params }: FounderPageProps) {
  const { country: countrySlug, number: founderNumberStr } = await params;

  if (!countrySlug || !founderNumberStr) {
    notFound();
  }

  const founderNumber = parseInt(founderNumberStr, 10);
  if (isNaN(founderNumber)) {
    notFound();
  }

  // 1. Resolve country details from slug
  const countryName = countrySlug.replace(/-/g, ' ');
  const { data: country, error: countryError } = await supabaseAdmin
    .from('countries')
    .select('*')
    .ilike('name', countryName)
    .maybeSingle();

  if (countryError || !country) {
    console.error('Error fetching country:', countryError);
    notFound();
  }

  // 2. Fetch the corresponding verified claim
  const { data: claim, error: claimError } = await supabaseAdmin
    .from('founder_claims')
    .select('*')
    .eq('country_id', country.id)
    .eq('founder_number', founderNumber)
    .eq('payment_status', 'succeeded')
    .maybeSingle();

  if (claimError || !claim) {
    console.error('Error fetching claim:', claimError);
    notFound();
  }

  return (
    <>
      {/* Visual representation */}
      <FounderClient country={country} claim={claim} />
    </>
  );
}
