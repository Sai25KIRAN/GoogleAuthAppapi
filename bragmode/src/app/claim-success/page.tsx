import React from 'react';
import SuccessClient from './success-client';

interface SuccessPageProps {
  searchParams: Promise<{
    payment_id?: string;
    paymentId?: string;
  }>;
}

export const revalidate = 0; // Live check

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const resolvedParams = await searchParams;
  const paymentId = resolvedParams.payment_id || resolvedParams.paymentId || '';

  return <SuccessClient paymentId={paymentId} />;
}
