'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Country, getCountryFlagUrl } from '@/lib/countries';
import { getSessionId } from '@/lib/session';
import { supabase } from '@/lib/supabase';

interface PredictionsClientProps {
  country: Country;
}

interface StepData {
  step: number;
  icon: string;
  question: string;
  placeholder: string;
  field: 'worldCupWinner' | 'goldenBoot' | 'darkHorse' | 'biggestFlop' | 'hotTake';
  suggestions: string[];
}

export default function PredictionsClient({ country }: PredictionsClientProps) {
  const router = useRouter();
  
  // Verification states
  const [checkingReservation, setCheckingReservation] = useState(true);
  const [reservedNumber, setReservedNumber] = useState<number | null>(null);
  const [reservationError, setReservationError] = useState<string | null>(null);

  // Flow states
  const [currentStep, setCurrentStep] = useState(1);
  const [inputValue, setInputValue] = useState('');
  const [answers, setAnswers] = useState({
    worldCupWinner: '',
    goldenBoot: '',
    darkHorse: '',
    biggestFlop: '',
    hotTake: '',
  });

  // Parallax tilt offset
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [submitting, setSubmitting] = useState(false);

  // Setup the multi-step pages configuration
  const stepsConfig: StepData[] = [
    {
      step: 1,
      icon: 'trophy',
      question: 'Who wins FIFA 2026?',
      placeholder: 'Search your champion...',
      field: 'worldCupWinner',
      suggestions: ['France', 'Argentina', 'Brazil', 'England'],
    },
    {
      step: 2,
      icon: 'sports_soccer',
      question: 'Who wins the Golden Boot?',
      placeholder: 'Top scorer name...',
      field: 'goldenBoot',
      suggestions: ['Kylian Mbappé', 'Vinicius Jr', 'Erling Haaland', 'Lionel Messi'],
    },
    {
      step: 3,
      icon: 'explore',
      question: 'Who is the Dark Horse?',
      placeholder: 'Dark horse country...',
      field: 'darkHorse',
      suggestions: ['Japan', 'Morocco', 'Canada', 'United States'],
    },
    {
      step: 4,
      icon: 'trending_down',
      question: 'Who is the Biggest Flop?',
      placeholder: 'Flop country/player...',
      field: 'biggestFlop',
      suggestions: ['England', 'Argentina', 'France', 'Germany'],
    },
    {
      step: 5,
      icon: 'local_fire_department',
      question: 'What is your Hot Take?',
      placeholder: 'Your bold prediction...',
      field: 'hotTake',
      suggestions: ['Group stage exit!', 'Upset in quarter finals!', 'Penalty shootout drama!'],
    },
  ];

  const currentStepConfig = stepsConfig[currentStep - 1];

  useEffect(() => {
    const checkReservation = async () => {
      const sessionId = getSessionId();
      const now = new Date().toISOString();

      try {
        const { data, error } = await supabase
          .from('reservations')
          .select('reserved_number, expires_at')
          .eq('country_id', country.id)
          .eq('session_id', sessionId)
          .gte('expires_at', now)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          setReservationError('No active reservation found. Please select your nation to hold a number.');
        } else {
          setReservedNumber(data.reserved_number);
          
          // Prefill answers from sessionStorage if available
          const cached = sessionStorage.getItem(`bragmode_predictions_${country.id}`);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              setAnswers({
                worldCupWinner: '',
                goldenBoot: '',
                darkHorse: '',
                biggestFlop: '',
                hotTake: '',
                ...parsed
              });
              // Set initial value for first step
              setInputValue(parsed.worldCupWinner || '');
            } catch {
              console.error('Failed to parse cached predictions');
            }
          }
        }
      } catch (err) {
        console.error('Error checking reservation:', err);
        setReservationError('Could not verify reservation status.');
      } finally {
        setCheckingReservation(false);
      }
    };

    checkReservation();
  }, [country.id]);

  // Card Mouse Move Parallax calculation
  const handleMouseMove = (e: React.MouseEvent) => {
    const x = (window.innerWidth / 2 - e.pageX) / 40;
    const y = (window.innerHeight / 2 - e.pageY) / 40;
    setTilt({ x, y });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const handleSuggestionClick = (value: string) => {
    setInputValue(value);
  };

  const handleNext = () => {
    if (!inputValue.trim()) return;

    // Update current answer state
    const field = currentStepConfig.field;
    const updatedAnswers = { ...answers, [field]: inputValue };
    setAnswers(updatedAnswers);

    if (currentStep < 5) {
      // Advance to next step
      const nextStep = currentStep + 1;
      const nextField = stepsConfig[nextStep - 1].field;
      setCurrentStep(nextStep);
      setInputValue(updatedAnswers[nextField] || '');
    } else {
      // Final step complete, lock and proceed
      setSubmitting(true);

      // Store in sessionStorage
      sessionStorage.setItem(`bragmode_predictions_${country.id}`, JSON.stringify(updatedAnswers));



      // Redirect to Reveal
      router.push(`/reveal/${country.id}`);
    }
  };

  if (checkingReservation) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4 h-screen w-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-gray-400 text-sm font-label-caps text-label-caps">Verifying reservation hold...</p>
      </div>
    );
  }

  if (reservationError) {
    return (
      <div className="glass-card p-10 rounded-3xl text-center space-y-6 max-w-lg mx-auto">
        <span className="material-symbols-outlined text-red-500 text-5xl">warning</span>
        <h2 className="text-2xl font-extrabold font-display-lg uppercase text-primary">Reservation Error</h2>
        <p className="text-gray-400 text-sm leading-relaxed">{reservationError}</p>
        <button
          onClick={() => router.push('/select')}
          className="w-full bg-primary text-on-primary font-label-caps text-label-caps py-4 rounded-xl inner-glow-btn hover:brightness-110 active:scale-95 transition-all"
        >
          Return to Nation Selection
        </button>
      </div>
    );
  }

  // Calculate progress percent based on current step
  const progressPercent = `${currentStep * 20}%`;

  return (
    <div className="relative w-full min-h-screen flex flex-col justify-between" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      
      {/* Global Progress Bar */}
      <div className="fixed top-0 left-0 w-full z-50">
        <div className="progress-indicator">
          <div className="progress-fill" style={{ width: progressPercent }}></div>
        </div>
        <div className="flex justify-center pt-6">
          <span className="font-label-caps text-label-caps text-primary tracking-[0.3em]">
            Step {currentStep} of 5
          </span>
        </div>
      </div>

      {/* Identity Anchor (Top Right) */}
      <div className="fixed top-8 right-margin-mobile md:right-margin-desktop z-50 flex items-center gap-4">
        <div className="flex flex-col items-end">
          <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest opacity-60">Identity</span>
          <span className="font-nav-item text-nav-item text-primary uppercase font-bold">{country.name}</span>
        </div>
        <div className="w-12 h-12 rounded-full overflow-hidden flag-anchor">
          <img
            alt={country.name}
            className="w-full h-full object-cover"
            src={getCountryFlagUrl(country.name)}
          />
        </div>
      </div>

      {/* Navigation Shell Branding */}
      <header className="fixed top-0 left-0 w-full z-40 flex justify-between items-center px-margin-mobile md:px-margin-desktop py-8 pointer-events-none">
        <div className="pointer-events-auto">
          <h1 className="font-headline-md text-headline-md tracking-tighter text-primary">BRAGMODE</h1>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 w-full flex items-center justify-center px-margin-mobile relative overflow-hidden pt-24">
        
        {/* Ambient Background Element */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px]"></div>
        </div>

        {/* Central Question Card with 3D Parallax Tilt */}
        <div
          className="glass-card w-full max-w-2xl px-12 py-16 flex flex-col items-center text-center relative z-10 transition-transform duration-200 ease-out"
          style={{
            transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
          }}
        >
          <div className="mb-4">
            <span
              className="material-symbols-outlined text-primary text-4xl mb-4"
              style={{ fontVariationSetting: "'FILL' 0" } as React.CSSProperties}
            >
              {currentStepConfig.icon}
            </span>
          </div>

          <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-12 max-w-lg mx-auto">
            {currentStepConfig.question}
          </h2>

          {/* Search / Selection Input */}
          <div className="w-full max-w-md relative group">
            <input
              className="w-full bg-transparent border-t-0 border-x-0 border-b border-outline-variant/50 py-4 font-body-lg text-body-lg text-center placeholder:text-on-surface-variant/40 placeholder:font-body-lg transition-all input-gold-focus"
              placeholder={currentStepConfig.placeholder}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              required
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNext();
              }}
            />
            <div className="absolute right-0 bottom-4 text-primary/40 group-focus-within:text-primary transition-colors">
              <span className="material-symbols-outlined text-base">search</span>
            </div>
          </div>

          {/* Suggestions / Quick Picks */}
          <div className="flex flex-wrap justify-center gap-3 mt-10">
            {currentStepConfig.suggestions.map((suggestion) => {
              const isSelected = inputValue === suggestion;
              return (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`px-4 py-2 border transition-all font-label-caps text-[10px] tracking-widest uppercase cursor-pointer ${
                    isSelected
                      ? 'border-primary/40 text-primary bg-primary/5'
                      : 'border-outline-variant/30 hover:border-primary/60 text-on-surface-variant'
                  }`}
                >
                  {suggestion}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer / Navigation Action */}
        <div className="fixed bottom-12 left-0 w-full flex justify-center z-20">
          <button
            onClick={handleNext}
            disabled={!inputValue.trim() || submitting}
            className="gold-gradient text-on-primary font-label-caps text-label-caps px-16 py-5 tracking-[0.25em] inner-glow transition-all active:scale-95 duration-200 group flex items-center gap-3 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                RECORDING...
                <Loader2 className="h-4 w-4 animate-spin text-on-primary" />
              </>
            ) : (
              <>
                {currentStep === 5 ? 'LOCK & REVEAL' : 'LOCK & NEXT'}
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </>
            )}
          </button>
        </div>
      </main>

      {/* Global Footer */}
      <footer className="fixed bottom-0 left-0 w-full py-4 px-margin-mobile md:px-margin-desktop flex justify-between items-center opacity-40 pointer-events-none">
        <span className="font-label-caps text-[10px] tracking-widest text-on-surface-variant">
          © 2026 SOVEREIGN COLLECTIVE. ALL RIGHTS RESERVED.
        </span>
        <div className="flex gap-6 pointer-events-auto">
          <a className="font-label-caps text-[10px] tracking-widest text-tertiary-fixed-dim hover:text-primary transition-colors" href="#">
            TERMS
          </a>
          <a className="font-label-caps text-[10px] tracking-widest text-tertiary-fixed-dim hover:text-primary transition-colors" href="#">
            PRIVACY
          </a>
        </div>
      </footer>
    </div>
  );
}
