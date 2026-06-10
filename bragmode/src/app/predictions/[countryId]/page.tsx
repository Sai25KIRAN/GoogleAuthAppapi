import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import PredictionsClient from './predictions-client';
import { Trophy } from 'lucide-react';
import Link from 'next/link';

interface PredictionsPageProps {
  params: Promise<{
    countryId: string;
  }>;
}

export const revalidate = 0; // Live fetching

export default async function PredictionsPage({ params }: PredictionsPageProps) {
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

  return (
    <div className="relative min-h-screen flex flex-col bg-[#050505] text-white">
      {/* Background Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#fbbf24] opacity-5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex justify-between items-center border-b border-gray-900">
        <Link href="/" className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-gold" />
          <span className="text-xl font-black tracking-widest text-glow-gold">BRAGMODE</span>
        </Link>
        <span className="text-xs text-gray-400">Step 2 of 4: Predictions</span>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-2xl mx-auto w-full px-6 py-12 flex flex-col justify-center">
        <PredictionsClient country={country} />
      </main>
    </div>
  );
}
