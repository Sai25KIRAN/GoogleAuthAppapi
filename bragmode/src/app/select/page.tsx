import React from 'react';
import { getOrSeedCountries } from '@/lib/countries';
import SelectClient from './select-client';
import { Trophy } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0; // Disable caching to fetch live claim counts

export default async function SelectPage() {
  const countries = await getOrSeedCountries();

  return (
    <div className="relative min-h-screen flex flex-col bg-[#050505] text-white">
      {/* Background Glows */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#fbbf24] opacity-5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500 opacity-5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex justify-between items-center border-b border-gray-900">
        <Link href="/" className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-gold" />
          <span className="text-xl font-black tracking-widest text-glow-gold">BRAGMODE</span>
        </Link>
        <span className="text-xs text-gray-400">Step 1 of 4: Select Nation</span>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-6 py-12">
        <SelectClient initialCountries={countries} />
      </main>
    </div>
  );
}
