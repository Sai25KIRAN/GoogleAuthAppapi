'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Country, getCountryFlagUrl } from '@/lib/countries';
import { getSessionId } from '@/lib/session';

interface SelectClientProps {
  initialCountries: Country[];
}

export default function SelectClient({ initialCountries }: SelectClientProps) {
  const router = useRouter();
  
  // Parallax background offset
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  
  interface Particle {
    id: number;
    size: number;
    left: number;
    delay: number;
    duration: number;
  }

  // Selection states
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [overlayActive, setOverlayActive] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Particles state
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate particles locally on mount to avoid hydration mismatch
    const generated: Particle[] = [];
    const count = 40;
    for (let i = 0; i < count; i++) {
      generated.push({
        id: i,
        size: Math.random() * 2 + 1,
        left: Math.random() * 100,
        delay: Math.random() * 10,
        duration: Math.random() * 10 + 5,
      });
    }
    
    // Defer the setParticles call to avoid synchronous setState inside useEffect lint error
    const timer = setTimeout(() => {
      setParticles(generated);
    }, 0);

    // Mouse Move Parallax listener
    const handleMouseMove = (e: MouseEvent) => {
      const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
      const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
      setParallaxOffset({ x: moveX, y: moveY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleSelectCountry = async (country: Country) => {
    if (loadingId) return;
    setLoadingId(country.id);
    setError(null);
    const sessionId = getSessionId();

    try {
      const response = await fetch('/api/reserve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          countryId: country.id,
          sessionId: sessionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reserve number');
      }



      // Set selection details and activate the transition overlay
      setSelectedCountry(country);
      setOverlayActive(true);
    } catch (err) {
      console.error('Error selecting country:', err);
      const errMsg = err instanceof Error ? err.message : 'An error occurred. Please try again.';
      setError(errMsg);
      setLoadingId(null);
    }
  };

  const handleContinue = () => {
    if (selectedCountry) {
      router.push(`/predictions/${selectedCountry.id}`);
    }
  };

  return (
    <div className="relative w-full min-h-screen">
      {/* Particles Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" id="particle-container">
        {particles.map((p) => (
          <div
            key={p.id}
            className="particle"
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              left: `${p.left}vw`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>

      {/* World Map Background with Parallax Translation */}
      <div 
        className="fixed inset-0 z-0 world-map-bg pointer-events-none transition-transform duration-100 ease-out" 
        style={{
          transform: `translate(${parallaxOffset.x}px, ${parallaxOffset.y}px)`
        }}
      />

      {/* UI Canvas */}
      <div 
        className="relative z-10 transition-all duration-700 flex flex-col items-center"
        style={{
          opacity: overlayActive ? 0 : 1,
          transform: overlayActive ? 'scale(0.9)' : 'scale(1)',
          pointerEvents: overlayActive ? 'none' : 'auto'
        }}
      >
        {/* Header Title */}
        <div className="text-center mb-16 max-w-2xl">
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary mb-4">
            Choose Your Nation
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant opacity-80 uppercase tracking-widest text-xs">
            Your nation determines your supporter identity forever.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl text-center max-w-lg mx-auto mb-8">
            {error}
          </div>
        )}

        {/* Nation Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-container-max px-4 pb-28">
          {initialCountries.map((country, idx) => {
            const isFull = country.claimed_founders >= country.max_founders;
            const slotsLeft = Math.max(0, country.max_founders - country.claimed_founders);
            const isLoading = loadingId === country.id;
            
            // Generate a dynamic animation delay (from 0s to 1.5s based on list position)
            const delayValue = `${(idx % 4) * 0.5}s`;

            return (
              <div
                key={country.id}
                onClick={() => !isFull && !isLoading && handleSelectCountry(country)}
                className={`glass-card flex flex-col items-center p-12 cursor-pointer group floating-anim ${
                  isFull ? 'opacity-40 cursor-not-allowed border-dashed' : ''
                }`}
                style={{ animationDelay: delayValue }}
              >
                {/* Flag Container */}
                <div className="relative w-32 h-32 mb-8">
                  <div className="absolute inset-0 rounded-full border border-primary/30 group-hover:border-primary transition-colors duration-500"></div>
                  <img
                    alt={country.name}
                    className="w-full h-full object-cover rounded-full border-4 border-surface transition-all duration-500 filter grayscale brightness-90 group-hover:grayscale-0 group-hover:brightness-110"
                    src={getCountryFlagUrl(country.name)}
                  />
                  {isLoading && (
                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )}
                </div>

                <h3 className="font-headline-md text-headline-md text-primary tracking-widest mb-2 uppercase">
                  {country.name}
                </h3>
                
                <p className="font-body-md text-xs text-on-surface-variant mb-6">
                  {isFull ? 'ALL SLOTS CLAIMED' : `${slotsLeft} Founder Slots Left`}
                </p>

                <div className="glowing-badge bg-primary/10 border border-primary/50 px-4 py-1">
                  <span className="font-label-caps text-[10px] text-primary">
                    {isFull ? 'CLOSED' : 'FOUNDER STATUS AVAILABLE'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selection Overlay Confirm Dialog */}
      <div 
        className={`fixed inset-0 flex flex-col items-center justify-center bg-background/95 backdrop-blur-3xl px-margin-mobile transition-all duration-700 ${
          overlayActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        id="selection-overlay"
      >
        <div className="relative mb-12">
          <div className="w-48 h-48 md:w-64 md:h-64 rounded-full border-2 border-primary overflow-hidden shadow-[0_0_100px_rgba(242,202,80,0.3)]">
            {selectedCountry && (
              <img
                alt="Selected Nation"
                className="w-full h-full object-cover"
                id="overlay-flag"
                src={getCountryFlagUrl(selectedCountry.name)}
              />
            )}
          </div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-background/40 to-transparent"></div>
        </div>

        <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-background text-center mb-10 uppercase">
          YOU NOW REPRESENT <br />
          <span className="text-primary italic">
            {selectedCountry ? selectedCountry.name : 'NATION'}
          </span>
        </h2>

        <button
          onClick={handleContinue}
          className="bg-primary hover:bg-primary-fixed-dim text-on-primary font-label-caps text-label-caps py-4 px-12 transition-all duration-300 inner-glow-btn flex items-center gap-2 group cursor-pointer"
        >
          CONTINUE{' '}
          <span className="material-symbols-outlined transition-transform duration-300 group-hover:translate-x-2 text-base">
            arrow_forward
          </span>
        </button>
      </div>

      {/* Sticky Selection Footer */}
      <footer className="fixed bottom-0 left-0 w-full z-40 py-8 px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-4 border-t border-outline-variant/10 bg-background/50 backdrop-blur-sm">
        <div className="font-label-caps text-label-caps text-tertiary-fixed-dim text-xs">
          © 2026 SOVEREIGN COLLECTIVE. ALL RIGHTS RESERVED.
        </div>
        <div className="flex gap-8">
          <a className="font-label-caps text-label-caps text-tertiary-fixed-dim hover:text-primary transition-opacity opacity-80 hover:opacity-100 text-xs" href="#">
            TERMS OF SERVICE
          </a>
          <a className="font-label-caps text-label-caps text-tertiary-fixed-dim hover:text-primary transition-opacity opacity-80 hover:opacity-100 text-xs" href="#">
            PRIVACY POLICY
          </a>
        </div>
      </footer>
    </div>
  );
}
