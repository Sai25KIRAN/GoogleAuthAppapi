import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import PaymentClient from './payment-client';

interface PaymentPageProps {
  params: Promise<{
    countryId: string;
  }>;
}

export const revalidate = 0; // Live check

export default async function PaymentPage({ params }: PaymentPageProps) {
  const { countryId } = await params;

  if (!countryId) {
    redirect('/select');
  }

  // Fetch the selected country details
  const { data: country, error } = await supabaseAdmin
    .from('countries')
    .select('*')
    .eq('id', countryId)
    .maybeSingle();

  if (error || !country) {
    console.error('Country not found:', error);
    notFound();
  }

  return <PaymentClient country={country} />;
}
