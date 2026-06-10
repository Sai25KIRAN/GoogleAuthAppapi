'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Country } from '@/lib/countries';
import { getSessionId } from '@/lib/session';
import { supabase } from '@/lib/supabase';

interface PaymentClientProps {
  country: Country;
}

interface UserPredictions {
  worldCupWinner: string;
  goldenBoot: string;
  darkHorse: string;
  biggestFlop: string;
  hotTake: string;
}

export default function PaymentClient({ country }: PaymentClientProps) {
  const router = useRouter();

  // Reservation & Setup states
  const [loadingSetup, setLoadingSetup] = useState(true);
  const [reservedNumber, setReservedNumber] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [timerExpired, setTimerExpired] = useState(false);
  const [reservationError, setReservationError] = useState<string | null>(null);

  // Predictions state (loaded from sessionStorage)
  const [predictions, setPredictions] = useState<UserPredictions | null>(null);

  // Form input and layout states
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'apple' | 'card'>('card');
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Refs
  const cardRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {


    const verifySetup = async () => {
      const sessionId = getSessionId();
      const now = new Date().toISOString();

      try {
        // Fetch active reservation details
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
          setLoadingSetup(false);
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
          setLoadingSetup(false);
          return;
        }
        setPredictions(JSON.parse(cached));
      } catch (err) {
        console.error('Error during verification setup:', err);
        setReservationError('Could not verify reservation details.');
      } finally {
        setLoadingSetup(false);
      }
    };

    verifySetup();

    // 2. Magnetic card rotation effect on mouse move
    const handleMouseMove = (e: MouseEvent) => {
      const x = (window.innerWidth / 2 - e.pageX) / 40;
      const y = (window.innerHeight / 2 - e.pageY) / 40;
      if (cardRef.current) {
        cardRef.current.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [country.id, country.name]);

  // Countdown timer thread
  useEffect(() => {
    if (timeLeft <= 0 || loadingSetup) return;

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
  }, [timeLeft, loadingSetup]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (timerExpired || submitting || !predictions || !email) return;

    setSubmitting(true);
    setCheckoutError(null);

    const sessionId = getSessionId();



    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          countryId: country.id,
          sessionId,
          ...predictions,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize checkout');
      }

      // Redirect user to Dodo hosted checkout page
      window.location.href = data.checkoutUrl;
    } catch (err) {
      console.error('Checkout error:', err);
      const errMsg = err instanceof Error ? err.message : 'Payment initialization failed. Please try again.';
      setCheckoutError(errMsg);
      setSubmitting(false);
    }
  };

  if (loadingSetup) {
    return (
      <div className="min-h-screen bg-[#050505] text-on-background flex flex-col items-center justify-center p-6">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="font-label-caps text-xs text-secondary tracking-widest">LOADING VAULT STATUS...</p>
      </div>
    );
  }

  if (reservationError) {
    return (
      <div className="min-h-screen bg-[#050505] text-on-background flex items-center justify-center p-6">
        <div className="glass-panel p-10 rounded-2xl text-center space-y-6 max-w-lg w-full relative z-20">
          <span className="material-symbols-outlined text-red-500 text-5xl">warning</span>
          <h2 className="text-2xl font-extrabold font-display-lg uppercase text-primary">Session Issue</h2>
          <p className="text-gray-400 text-sm leading-relaxed">{reservationError}</p>
          <button
            onClick={() => router.push('/select')}
            className="w-full bg-primary text-on-secondary font-label-caps text-label-caps py-4 rounded hover:brightness-110 active:scale-95 transition-all cursor-pointer font-bold"
          >
            Return to Nation Selection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-[#e2e2e2] selection:bg-primary selection:text-on-primary">
      
      {/* TOP NAVIGATION */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-16 h-20 bg-background/80 backdrop-blur-xl border-b border-outline-variant/30">
        <div 
          onClick={() => router.push('/')} 
          className="font-headline-md text-2xl text-primary tracking-tighter cursor-pointer"
        >
          BragMode
        </div>
        <div className="hidden md:flex gap-8"></div>
      </nav>

      {/* MAIN CANVAS */}
      <main className="flex-grow pt-20 relative overflow-hidden flex items-center justify-center min-h-[calc(100vh-80px)]">
        
        {/* Golden Particle Shader Background Blur Elements */}
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2 pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[150px] rounded-full translate-x-1/3 -translate-y-1/2 pointer-events-none" />

        <div className="relative z-10 max-w-container-max w-full px-16 py-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* LEFT COLUMN: PRODUCT PREVIEW */}
          <div className="flex justify-center items-center perspective-[1000px]">
            <div ref={cardRef} className="card-float relative group transition-transform duration-200 ease-out">
              {/* The Card Body */}
              <div className="relative w-[400px] h-[560px] glass-panel rounded-2xl overflow-hidden border-2 border-primary/30 flex flex-col items-center justify-center p-12">
                <div className="absolute inset-0 gold-shimmer opacity-20 group-hover:opacity-40 transition-opacity"></div>
                
                {/* Top Detail */}
                <div className="absolute top-10 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full border border-primary/50 flex items-center justify-center bg-black mb-4">
                    <span className="material-symbols-outlined text-primary text-3xl">
                      sports_soccer
                    </span>
                  </div>
                  <span className="font-label-caps text-[12px] text-secondary tracking-[0.3em]">
                    SOVEREIGN ASSET
                  </span>
                </div>

                {/* Main ID */}
                <div className="text-center mt-8">
                  <h1 className="font-display-lg text-[80px] text-primary leading-none mb-2 tracking-tighter font-bold">
                    #{reservedNumber}
                  </h1>
                  <p className="font-headline-md text-2xl text-on-surface-variant uppercase tracking-[0.2em] font-light">
                    {country.name} Founder
                  </p>
                </div>

                {/* Footer Detail */}
                <div className="absolute bottom-12 w-full flex justify-between px-12 items-end">
                  <div className="text-left">
                    <p className="font-label-caps text-[10px] text-on-surface-variant/60 mb-1">
                      MINT SERIES
                    </p>
                    <p className="font-body-md text-base text-primary/80">
                      {reservedNumber} / {country.max_founders}
                    </p>
                  </div>
                  <div className="w-12 h-12 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary/30 text-4xl">
                      verified
                    </span>
                  </div>
                </div>

                {/* Subtle Inner Shadow/Edge Light */}
                <div className="absolute inset-0 pointer-events-none inner-glow rounded-2xl"></div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: ACQUISITION PANEL */}
          <div className="max-w-lg lg:ml-auto w-full">
            <div className="flex flex-col gap-8">
              
              {/* Header Titles */}
              <div>
                <h2 className="font-display-lg text-4xl text-primary uppercase tracking-wider mb-2 font-bold">
                  SECURE YOUR LEGACY
                </h2>
                <div className="flex items-center gap-3">
                  <div className="h-[1px] w-12 bg-primary"></div>
                  <p className="font-headline-md text-base text-on-surface/90">
                    Founder #{reservedNumber} / {country.max_founders} - {country.name} Heritage
                  </p>
                </div>
              </div>

              {/* Reservation Timer banner */}
              <div className="bg-primary/5 border border-primary/20 py-3 px-4 rounded flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-xl animate-pulse">
                  timer
                </span>
                <p className="font-label-caps text-[12px] text-primary tracking-widest uppercase font-bold">
                  RESERVATION EXPIRES IN {timerExpired ? '00:00' : formatTime(timeLeft)}
                </p>
              </div>

              {/* Price Row */}
              <div className="flex items-baseline gap-4 py-4 border-b border-outline-variant/30">
                <span className="font-display-lg text-5xl text-white font-bold">$1.99</span>
                <span className="font-label-caps text-[12px] text-on-surface-variant tracking-wider uppercase font-semibold">
                  ONE-TIME ACQUISITION
                </span>
              </div>

              {/* Error checkout banner */}
              {checkoutError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded">
                  {checkoutError}
                </div>
              )}

              {/* Payment Form */}
              <form onSubmit={handleCheckout} className="flex flex-col gap-6">
                
                {/* Method selector buttons */}
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod('apple')}
                    className={`flex items-center justify-center gap-2 py-4 transition-all cursor-pointer ${
                      paymentMethod === 'apple' 
                        ? 'border border-primary bg-primary/10 text-primary' 
                        : 'border border-outline-variant/50 hover:border-primary bg-surface-container-low group'
                    }`}
                  >
                    <span className="material-symbols-outlined group-hover:text-primary">
                      apps
                    </span>
                    <span className="font-label-caps text-[12px] uppercase">
                      Apple Pay
                    </span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`flex items-center justify-center gap-2 py-4 transition-all cursor-pointer ${
                      paymentMethod === 'card' 
                        ? 'border border-primary bg-primary/10 text-primary' 
                        : 'border border-outline-variant/50 hover:border-primary bg-surface-container-low group'
                    }`}
                  >
                    <span className="material-symbols-outlined text-primary">
                      credit_card
                    </span>
                    <span className="font-label-caps text-[12px] uppercase">
                      Credit Card
                    </span>
                  </button>
                </div>

                {/* Email input field */}
                <div className="relative">
                  <input 
                    type="email"
                    required
                    disabled={timerExpired || submitting}
                    placeholder="Email for Certificate"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent border-0 border-b border-outline-variant/50 py-4 font-body-lg text-lg focus:ring-0 focus:outline-none focus:border-primary transition-all placeholder:text-on-surface-variant/40 hover:border-primary/50 placeholder:font-label-caps placeholder:tracking-wider placeholder:text-xs"
                  />
                  <span className="absolute right-0 bottom-4 material-symbols-outlined text-primary/60">
                    mail
                  </span>
                </div>

                {/* Submit button */}
                <button 
                  type="submit"
                  disabled={timerExpired || submitting || !email}
                  className="w-full bg-primary-container text-on-primary-container py-6 font-label-caps text-sm tracking-[0.25em] font-bold uppercase transition-all hover:brightness-110 active:scale-[0.98] inner-glow flex items-center justify-center gap-4 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      ACQUIRING VAULT PASS...
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </>
                  ) : (
                    <>
                      CLAIM FOUNDER STATUS
                      <span className="material-symbols-outlined text-2xl">
                        arrow_right_alt
                      </span>
                    </>
                  )}
                </button>
              </form>

              {/* Sub-benefits row */}
              <div className="flex items-center justify-center gap-8 pt-4">
                <div className="flex items-center gap-2 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
                  <span className="material-symbols-outlined text-primary">
                    workspace_premium
                  </span>
                  <span className="font-label-caps text-[10px] tracking-wider uppercase">
                    AUTHENTICATED ASSET
                  </span>
                </div>
                <div className="flex items-center gap-2 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
                  <span className="material-symbols-outlined text-primary">
                    encrypted
                  </span>
                  <span className="font-label-caps text-[10px] tracking-wider uppercase">
                    SECURE VAULTING
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full py-12 px-16 flex flex-col md:flex-row justify-between items-center gap-8 bg-surface-container-lowest border-t border-outline-variant/20 z-20">
        <div className="font-headline-md text-2xl text-primary tracking-tighter">
          BragMode
        </div>
        <div className="flex gap-12 my-6 md:my-0">
          <a className="font-label-caps text-xs text-on-surface-variant hover:text-primary-fixed transition-colors" href="#">
            Privacy
          </a>
          <a className="font-label-caps text-xs text-on-surface-variant hover:text-primary-fixed transition-colors" href="#">
            Terms
          </a>
          <a className="font-label-caps text-xs text-on-surface-variant hover:text-primary-fixed transition-colors" href="#">
            Authenticity
          </a>
          <a className="font-label-caps text-xs text-on-surface-variant hover:text-primary-fixed transition-colors" href="#">
            Contact
          </a>
        </div>
        <div className="font-label-caps text-xs text-on-surface-variant text-center md:text-right">
          © 2024 BragMode Sovereign Collectibles. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}
