'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Country } from '@/lib/countries';
import { getSessionId } from '@/lib/session';
import { supabase } from '@/lib/supabase';

interface RevealClientProps {
  country: Country;
}

export default function RevealClient({ country }: RevealClientProps) {
  const router = useRouter();

  // Loading sequence states
  const [loadingScreenActive, setLoadingScreenActive] = useState(true);
  const [loadingScreenFadeOut, setLoadingScreenFadeOut] = useState(false);
  const [progressOffset, setProgressOffset] = useState(552.92); // full circumference
  const [loadingText, setLoadingText] = useState('Finding available founder numbers...');
  const [flashActive, setFlashActive] = useState(false);
  const [shakeActive, setShakeActive] = useState(false);
  const [revealContentActive, setRevealContentActive] = useState(false);

  // Stagger animations states
  const [textHeaderActive, setTextHeaderActive] = useState(false);
  const [cardWrapperActive, setCardWrapperActive] = useState(false);
  const [actionClusterActive, setActionClusterActive] = useState(false);

  // Reservation states
  const [reservedNumber, setReservedNumber] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [timerExpired, setTimerExpired] = useState(false);
  const [reservationError, setReservationError] = useState<string | null>(null);



  // Refs
  const emberContainerRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {


    const verifySetup = async () => {
      const sessionId = getSessionId();
      const now = new Date().toISOString();

      try {
        // Fetch active reservation
        const { data: reservation, error: resError } = await supabase
          .from('reservations')
          .select('id, reserved_number, expires_at')
          .eq('country_id', country.id)
          .eq('session_id', sessionId)
          .gte('expires_at', now)
          .maybeSingle();

        if (resError) throw resError;

        if (!reservation) {
          setReservationError('Your reservation has expired or is invalid. Please select your nation again.');
          return;
        }

        setReservedNumber(reservation.reserved_number);

        // Calculate initial remaining seconds
        const diffMs = new Date(reservation.expires_at).getTime() - new Date().getTime();
        const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
        setTimeLeft(diffSecs);

        if (diffSecs <= 0) {
          setTimerExpired(true);
        }

        // Load predictions from sessionStorage
        const cached = sessionStorage.getItem(`bragmode_predictions_${country.id}`);
        if (!cached) {
          setReservationError('Could not find your predictions. Please return and submit them.');
          return;
        }

      } catch (err) {
        console.error('Error during verification setup:', err);
        setReservationError('Could not verify reservation details.');
      }
    };

    verifySetup();

    // 2. Ember particle loop (silky smooth direct DOM updates)
    const container = emberContainerRef.current;
    let emberTimer: NodeJS.Timeout | null = null;
    
    if (container) {
      const createEmber = () => {
        const ember = document.createElement('div');
        ember.className = 'ember';
        
        const size = Math.random() * 3 + 1;
        const left = Math.random() * 100;
        const duration = Math.random() * 3 + 2;
        const delay = Math.random() * 2;
        
        ember.style.width = `${size}px`;
        ember.style.height = `${size}px`;
        ember.style.left = `${left}%`;
        ember.style.bottom = `-10px`;
        ember.style.animationDuration = `${duration}s`;
        ember.style.animationDelay = `${delay}s`;
        
        container.appendChild(ember);
        
        setTimeout(() => {
          ember.remove();
        }, (duration + delay) * 1000);
      };

      // Create initial embers
      for (let i = 0; i < 40; i++) {
        createEmber();
      }

      emberTimer = setInterval(createEmber, 100);
    }

    return () => {
      if (emberTimer) clearInterval(emberTimer);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [country.id, country.name]);

  // Loading Sequence Phase Animation
  useEffect(() => {
    const phrases = [
      'Scanning supporter registry...',
      'Finding available founder numbers...',
      'Calculating rarity...',
      'Generating collectible...'
    ];

    let phraseIdx = 0;
    const phraseInterval = setInterval(() => {
      phraseIdx = (phraseIdx + 1) % phrases.length;
      setLoadingText(phrases[phraseIdx]);
    }, 600);

    // Animate progress circle to 0 offset (complete) over 2.5s
    setTimeout(() => {
      setProgressOffset(0);
    }, 100);

    // Loading overlay completion sequence (after 2.5s)
    const completionTimeout = setTimeout(() => {
      clearInterval(phraseInterval);
      
      // 1. Trigger screen flash and shake
      setFlashActive(true);
      setShakeActive(true);

      setTimeout(() => {
        // 2. Fade out loading screen and display main wrapper
        setLoadingScreenFadeOut(true);
        setRevealContentActive(true);

        // 3. Fade out white flash overlay
        setFlashActive(false);

        // 4. Staggered Entrance Animations
        setTextHeaderActive(true);
        
        setTimeout(() => {
          setCardWrapperActive(true);
        }, 400);

        setTimeout(() => {
          setActionClusterActive(true);
        }, 800);

        // 5. Remove screen shaking
        setTimeout(() => {
          setShakeActive(false);
        }, 500);

        // 6. Completely unmount loading screen after animations complete
        setTimeout(() => {
          setLoadingScreenActive(false);
        }, 700);

      }, 100);

    }, 2500);

    return () => {
      clearInterval(phraseInterval);
      clearTimeout(completionTimeout);
    };
  }, []);

  // Countdown timer thread
  useEffect(() => {
    if (timeLeft <= 0 || loadingScreenActive) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setTimerExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft, loadingScreenActive]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };



  // Top percentile calculation based on founder number
  const percentileValue = reservedNumber ? ((reservedNumber / 1000) * 0.1).toFixed(3) : '0.018';

  if (reservationError) {
    return (
      <div className="min-h-screen bg-background text-on-background flex items-center justify-center p-6">
        <div className="glass-card p-10 rounded-2xl text-center space-y-6 max-w-lg w-full relative z-20">
          <span className="material-symbols-outlined text-red-500 text-5xl">warning</span>
          <h2 className="text-2xl font-extrabold font-display-lg uppercase text-primary">Session Issue</h2>
          <p className="text-gray-400 text-sm leading-relaxed">{reservationError}</p>
          <button
            onClick={() => router.push('/select')}
            className="w-full bg-primary text-on-primary font-label-caps text-label-caps py-4 rounded-xl inner-glow hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            Return to Nation Selection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full min-h-screen flex flex-col justify-between overflow-hidden bg-background text-on-background selection:bg-primary selection:text-on-primary ${
      shakeActive ? 'shake-active' : ''
    }`}>
      
      {/* Fixed Header */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-outline-variant/30 flex justify-between items-center px-16 h-20">
        <div className="font-display-lg text-2xl tracking-tighter text-primary">FIFA HERITAGE</div>
        <div className="hidden md:flex space-x-8"></div>
        <button
          onClick={() => router.push(`/payment/${country.id}`)}
          className="bg-primary px-6 py-2 text-on-primary font-label-caps text-xs uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 cursor-pointer"
        >
          Claim Card
        </button>
      </header>

      {/* Background Embers Layer */}
      <div ref={emberContainerRef} className="fixed inset-0 pointer-events-none z-0" id="ember-container" />

      {/* Loading Sequence Overlay */}
      {loadingScreenActive && !reservationError && (
        <div 
          className={`fixed inset-0 z-[60] bg-background flex flex-col items-center justify-center transition-opacity duration-700 ${
            loadingScreenFadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`} 
          id="loading-screen"
        >
          <div className="relative w-48 h-48 mb-12">
            <svg className="w-full h-full transform -rotate-90">
              <circle 
                className="text-surface-variant" 
                cx="96" 
                cy="96" 
                fill="transparent" 
                r="88" 
                stroke="currentColor" 
                strokeWidth="2"
              />
              <circle 
                className="text-primary" 
                cx="96" 
                cy="96" 
                fill="transparent" 
                id="progress-circle" 
                r="88" 
                stroke="currentColor" 
                strokeDasharray="552.92" 
                strokeDashoffset={progressOffset} 
                strokeWidth="3" 
                style={{ transition: 'stroke-dashoffset 2.5s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-5xl animate-pulse">
                auto_awesome
              </span>
            </div>
          </div>
          <div 
            className="font-label-caps text-label-caps text-primary tracking-[0.3em] uppercase h-6 text-center px-4" 
            id="loading-text"
          >
            {loadingText}
          </div>
        </div>
      )}

      {/* Reveal Flash Overlay */}
      <div 
        className="fixed inset-0 z-[70] pointer-events-none" 
        id="flash-overlay" 
        style={{
          background: 'radial-gradient(circle, rgb(255, 255, 255) 0%, rgb(242, 202, 80) 50%, rgb(19, 19, 19) 100%)',
          opacity: flashActive ? 1 : 0,
          transition: flashActive ? 'opacity 0.05s ease-in' : 'opacity 1.5s ease-out',
        }}
      />

      {/* Main Content (Result Card) */}
      <main className="relative min-h-screen w-full flex items-center justify-center overflow-hidden pt-20 pb-20 z-10" id="main-container">
        {revealContentActive && (
          <div className={`transition-opacity duration-700 relative z-30 w-full max-w-container-max px-margin-desktop flex flex-col items-center ${
            textHeaderActive ? 'opacity-100' : 'opacity-0'
          }`} id="reveal-content">
            
            {/* Header Description */}
            <div className={`text-center mb-8 opacity-0 ${textHeaderActive ? 'animate-reveal-text' : ''}`} id="text-header">
              <h2 className="font-label-caps text-label-caps text-on-surface-variant tracking-[0.4em] mb-4">
                YOU UNLOCKED
              </h2>
              <h1 className="font-display-lg text-display-lg text-primary italic font-bold uppercase">
                {country.name} Founder #{reservedNumber}
              </h1>
              <p className="font-label-caps text-label-caps text-secondary mt-2">
                TOP {percentileValue}% OF {country.name.toUpperCase()} SUPPORTERS
              </p>
            </div>

            {/* The Card Display */}
            <div className={`relative group cursor-pointer mb-12 opacity-0 ${cardWrapperActive ? 'animate-reveal-card' : ''}`} id="card-wrapper">
              <div className="w-[340px] h-[480px] glass-card inner-glow relative overflow-hidden transition-transform duration-500 hover:scale-[1.02] active:scale-[0.98]">
                {/* Artifact Backdrop desaturated */}
                <div className="absolute inset-0 z-0">
                  <img 
                    alt="Legendary football artifact" 
                    className="w-full h-full object-cover desaturate brightness-[0.3]" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQ1UIwDD06HU0buGCTXSUOzG9o2YDVqnSGLPlALQp5O9hElObqdL1wjIQfriYcTjrXF3Z1Baqn3VCKSxiZKm3Yrmh8DADxwXbXhDkjVYv1SyPLquyW8Kk7HZkys5uaSm1dnYvAhSh3SqMGA5KAnZTGJWDHqt8jheooXeKc5kPxsYbVZtyPkQyHj6GJwzygIxMroWeck_cBWqFxDmcU1OZDMcSZUWiifVgc3KNztpLbZVVZ4sP-vbjPVB29-dALPHMs4mvdmTXLUUJV"
                  />
                </div>

                {/* Shimmer overlay */}
                <div className="shimmer-effect absolute inset-0 z-10 opacity-40 pointer-events-none"></div>

                {/* Card Context */}
                <div className="relative z-20 h-full p-8 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className="border border-primary/50 px-3 py-1 bg-black/40">
                      <span className="font-label-caps text-[10px] text-primary tracking-widest uppercase">Legacy</span>
                    </div>
                    <span className="material-symbols-outlined text-primary/70">
                      military_tech
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="w-12 h-1 bg-primary/40"></div>
                    <h3 className="font-display-lg text-headline-md leading-none text-white uppercase font-bold tracking-wider">
                      {country.name}
                    </h3>
                    <p className="font-label-caps text-[10px] text-on-surface-variant tracking-tighter">
                      AUTHENTICATED HERITAGE #{reservedNumber}/{country.max_founders}
                    </p>
                  </div>
                </div>
                <div className="absolute inset-0 border-[8px] border-primary/5 pointer-events-none"></div>
              </div>

              {/* Rarity Badge */}
              <div className="absolute -top-4 -right-4 bg-primary px-4 py-2 shadow-2xl z-30">
                <span className="font-label-caps text-[10px] text-on-primary font-bold tracking-widest uppercase">
                  LEGENDARY
                </span>
              </div>
            </div>

            {/* Action and Form Cluster */}
            <div className={`flex flex-col items-center gap-8 w-full max-w-md opacity-0 ${actionClusterActive ? 'animate-reveal-text' : ''}`} id="action-cluster">
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-3 bg-surface-container-low px-4 py-2 border border-outline-variant/30 inner-glow">
                  <span className="material-symbols-outlined text-error text-sm animate-pulse">
                    timer
                  </span>
                  <span className="font-label-caps text-label-caps text-error tracking-[0.2em] font-bold">
                    RESERVED FOR: <span id="timer">{timerExpired ? '00:00' : formatTime(timeLeft)}</span>
                  </span>
                </div>
                <p className="font-body-md text-[13px] text-on-surface-variant/60 text-center italic">
                  After expiry, this token returns to the global registry pool.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full mt-2">
                <button
                  onClick={() => router.push(`/payment/${country.id}`)}
                  className="flex-1 gold-gradient-bg h-14 font-label-caps text-label-caps text-on-primary uppercase tracking-[0.2em] font-bold shadow-[0_0_30px_rgba(242,202,80,0.2)] hover:shadow-[0_0_50px_rgba(242,202,80,0.4)] transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer text-center"
                >
                  Claim Forever $1.99
                  <span className="material-symbols-outlined text-sm">
                    workspace_premium
                  </span>
                </button>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Global Footer */}
      <footer className="fixed bottom-0 left-0 w-full py-8 px-margin-desktop flex items-center justify-center border-t border-outline-variant/10 z-10 pointer-events-none bg-background/30 backdrop-blur-sm">
        <p className="font-label-caps text-[10px] text-on-surface-variant/40 tracking-[0.3em] uppercase">
          © 2024 WORLD CUP HERITAGE. ALL RIGHTS RESERVED. SOVEREIGN STATUS GRANTED.
        </p>
      </footer>
    </div>
  );
}

