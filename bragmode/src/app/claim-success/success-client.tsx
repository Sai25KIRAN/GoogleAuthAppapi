'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Loader2, CheckCircle2, Download, AlertTriangle, Trophy } from 'lucide-react';

function getCountryCode(name: string): string {
  const custom: Record<string, string> = {
    'Argentina': 'ARG',
    'Brazil': 'BRA',
    'France': 'FRA',
    'Germany': 'GER',
    'Spain': 'ESP',
    'England': 'ENG',
    'Italy': 'ITA',
    'Portugal': 'POR',
    'Netherlands': 'NED',
    'Belgium': 'BEL',
    'Croatia': 'CRO',
    'Uruguay': 'URU',
    'United States': 'USA',
    'Mexico': 'MEX',
    'Canada': 'CAN',
    'Japan': 'JPN',
    'Morocco': 'MAR',
    'South Korea': 'KOR',
    'Colombia': 'COL',
    'Senegal': 'SEN',
    'Australia': 'AUS',
    'Saudi Arabia': 'KSA',
    'Iran': 'IRN',
    'Nigeria': 'NGA',
    'Egypt': 'EGY',
    'Ivory Coast': 'CIV',
    'Algeria': 'ALG',
    'Norway': 'NOR',
    'Sweden': 'SWE',
    'Switzerland': 'SUI',
    'Denmark': 'DEN',
    'Türkiye': 'TUR',
    'Austria': 'AUT',
    'Ecuador': 'ECU',
    'Chile': 'CHI',
    'Peru': 'PER',
    'Panama': 'PAN',
    'Jamaica': 'JAM',
    'Haiti': 'HAI',
    'South Africa': 'RSA',
    'Qatar': 'QAT',
    'Jordan': 'JOR',
    'Cape Verde': 'CPV',
    'Curaçao': 'CUW',
    'Uzbekistan': 'UZB'
  };
  return custom[name] || name.substring(0, 3).toUpperCase();
}

interface SuccessClientProps {
  paymentId: string;
}

// Wrapper for standard loading/error template layouts
const WrapperLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="relative min-h-screen flex flex-col bg-[#050505] text-white">
    {/* Background Glow */}
    <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#fbbf24] opacity-5 blur-[120px] pointer-events-none" />

    {/* Header */}
    <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex justify-between items-center border-b border-gray-900">
      <Link href="/" className="flex items-center gap-2">
        <Trophy className="h-6 w-6 text-gold" />
        <span className="text-xl font-black tracking-widest text-glow-gold">BRAGMODE</span>
      </Link>
      <span className="text-xs text-gray-400">Step 4 of 4: Claim Confirmation</span>
    </header>

    {/* Main Content */}
    <main className="relative z-10 flex-1 max-w-2xl mx-auto w-full px-6 py-12 flex flex-col justify-center">
      {children}
    </main>

    {/* Footer */}
    <footer className="relative z-10 py-6 text-center text-xs text-gray-700 border-t border-gray-950">
      <p>&copy; {new Date().getFullYear()} BragMode. For real fans only.</p>
    </footer>
  </div>
);

export default function SuccessClient({ paymentId }: SuccessClientProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Claim success details
  const [claimId, setClaimId] = useState<string | null>(null);
  const [founderNumber, setFounderNumber] = useState<number | null>(null);
  const [countryName, setCountryName] = useState<string>('');
  const [flag, setFlag] = useState<string>('');
  const [hotTake, setHotTake] = useState<string>('');
  const [claimedAt, setClaimedAt] = useState<string>('');
  const [maxFounders, setMaxFounders] = useState<number>(1000);

  const cardRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!paymentId) return;

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/claims/status?payment_id=${paymentId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to check status');
        }

        if (data.status === 'succeeded') {
          setClaimId(data.claimId);
          setFounderNumber(data.founderNumber);
          setCountryName(data.countryName);
          setFlag(data.flag);
          setHotTake(data.hotTake || '');
          setClaimedAt(data.claimedAt || '');
          setMaxFounders(data.maxFounders || 1000);
          setLoading(false);

          clearInterval(intervalId);
        }
      } catch (err) {
        console.error('Polling status error:', err);
      }
    };

    pollStatus();
    const intervalId = setInterval(pollStatus, 2500);

    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      if (loading) {
        setError('Verification is taking longer than expected. Please check your email or refresh this page.');
        setLoading(false);
      }
    }, 120000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [paymentId, loading]);

  // Visual Effects: Parallax Tilt and WebGL Background (only active after loading finishes successfully)
  useEffect(() => {
    if (loading || error || !claimId) return;

    // Parallax Tilt Effect
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const xAxis = (window.innerWidth / 2 - e.pageX) / 40;
      const yAxis = (window.innerHeight / 2 - e.pageY) / 40;
      card.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
    };

    const handleMouseLeave = () => {
      card.style.transform = `rotateY(0deg) rotateX(0deg)`;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    // WebGL Background
    const canvas = canvasRef.current;
    if (!canvas) {
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseleave', handleMouseLeave);
      };
    }

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseleave', handleMouseLeave);
      };
    }

    const vertexShaderSrc = `
        attribute vec2 position;
        varying vec2 v_texCoord;
        void main() {
            v_texCoord = position * 0.5 + 0.5;
            v_texCoord.y = 1.0 - v_texCoord.y;
            gl_Position = vec4(position, 0.0, 1.0);
        }
    `;

    const fragmentShaderSrc = `
        precision highp float;
        uniform float u_time;
        uniform vec2 u_resolution;
        varying vec2 v_texCoord;

        float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }

        void main() {
            vec2 uv = v_texCoord;
            vec3 color = vec3(0.019, 0.019, 0.019); 
            float particleDensity = 40.0;
            vec2 grid = uv * particleDensity;
            vec2 ipos = floor(grid);
            vec2 fpos = fract(grid);
            float rnd = random(ipos);
            float t = u_time * 0.2;
            vec2 offset = vec2(sin(t + rnd * 6.28), cos(t + rnd * 6.28)) * 0.2;
            float dist = distance(fpos + offset, vec2(0.5));
            float particle = smoothstep(0.02, 0.0, dist);
            particle *= rnd;
            particle *= (0.5 + 0.5 * sin(t + rnd * 10.0));
            vec3 gold = vec3(0.83, 0.69, 0.22); 
            color += gold * particle * 0.15; 
            gl_FragColor = vec4(color, 1.0);
        }
    `;

    function createShader(gl: WebGLRenderingContext, type: number, source: string) {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, vertexShaderSrc);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program linking error:', gl.getProgramInfoLog(program));
      return;
    }

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'position');
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const resLocation = gl.getUniformLocation(program, 'u_resolution');

    let animationId: number;

    function render(time: number) {
      if (!canvas || !gl) return;
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      gl.useProgram(program);
      gl.enableVertexAttribArray(positionLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      gl.uniform1f(timeLocation, time * 0.001);
      if (resLocation) {
        gl.uniform2f(resLocation, canvas.width, canvas.height);
      }

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationId = requestAnimationFrame(render);
    }
    animationId = requestAnimationFrame(render);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationId);
    };
  }, [loading, error, claimId]);

  // 1. Missing payment id
  if (!paymentId) {
    return (
      <WrapperLayout>
        <div className="glass-card p-8 rounded-3xl text-center space-y-6 max-w-lg mx-auto">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-2xl font-extrabold">Verification Delay</h2>
          <p className="text-gray-400 text-sm">No payment identifier detected. If you completed checkout, please check your email.</p>
          <Link
            href="/"
            className="w-full bg-[#0d0d0f] border border-gray-800 font-extrabold py-3 px-6 rounded-xl hover:bg-gray-900 transition-all text-center flex items-center justify-center"
          >
            Go to Home
          </Link>
        </div>
      </WrapperLayout>
    );
  }

  // 2. Loading state
  if (loading) {
    return (
      <WrapperLayout>
        <div className="glass-card p-10 rounded-3xl text-center space-y-6 max-w-lg mx-auto">
          <Loader2 className="h-12 w-12 animate-spin text-gold mx-auto" />
          <h2 className="text-2xl font-black uppercase">Verifying Payment</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            We are verifying the payment confirmation from Dodo Payments. Your verified founder status and downloadable card are being created now...
          </p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest animate-pulse">
            Do not close this window
          </p>
        </div>
      </WrapperLayout>
    );
  }

  // 3. Error state
  if (error) {
    return (
      <WrapperLayout>
        <div className="glass-card p-8 rounded-3xl text-center space-y-6 max-w-lg mx-auto">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-2xl font-extrabold">Verification Delay</h2>
          <p className="text-gray-400 text-sm">{error}</p>
          <div className="flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-gold text-black font-extrabold py-3 px-6 rounded-xl hover:shadow-lg active:scale-98 transition-all"
            >
              Retry Verification
            </button>
            <Link
              href="/"
              className="flex-1 bg-[#0d0d0f] border border-gray-800 font-extrabold py-3 px-6 rounded-xl hover:bg-gray-900 transition-all text-center flex items-center justify-center"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </WrapperLayout>
    );
  }

  // 4. Success State (Render the dedicated interactive collectible card)
  const percentage = maxFounders ? ((founderNumber || 1) / maxFounders) * 100 : 0;
  const percentageStr = percentage < 1 ? percentage.toFixed(2) + '%' : percentage.toFixed(1) + '%';

  const claimDate = claimedAt ? new Date(claimedAt) : new Date();
  const monthNames = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
  ];
  const claimDateStr = `CLAIMED ${monthNames[claimDate.getMonth()]} ${claimDate.getFullYear()}`;

  const regCode = `BM-${getCountryCode(countryName)}-${founderNumber}-${claimDate.getFullYear()}`;

  const countrySlug = countryName.toLowerCase().trim().replace(/\s+/g, '-');
  const publicUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/founder/${countrySlug}/${founderNumber}`
    : `/founder/${countrySlug}/${founderNumber}`;

  const shareText = `I just unlocked verified Founder Status for ${flag} ${countryName} (Founder #${founderNumber}) on BragMode! Check out my 2026 World Cup predictions here:`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(publicUrl)}`;

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden bg-[#050505] text-on-surface">
      {/* Background WebGL Canvas */}
      <canvas ref={canvasRef} id="bg-canvas" className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none" />

      {/* Main Container */}
      <main className="relative z-10 flex-grow flex items-center justify-center w-full pb-48 pt-24">
        
        {/* Collectible Card Wrapper */}
        <div 
          ref={cardRef} 
          id="bragCard" 
          className="collectible-card parallax-container" 
          style={{ width: '450px', aspectRatio: '9 / 16', height: 'auto', maxHeight: '800px', transform: 'rotateY(0deg) rotateX(0deg)' }}
        >
          <div className="gold-sweep"></div>
          
          {/* HEADER */}
          <div className="flex justify-between items-start w-full relative z-20 pt-8">
            <div className="font-nav-item text-primary tracking-[0.4em] uppercase text-[10px] font-semibold">
              BRAGMODE
            </div>
            <div className="font-label-caps text-secondary tracking-[0.2em] text-[10px] font-medium">
              {founderNumber} / {maxFounders}
            </div>
          </div>

          {/* HERO SECTION */}
          <div className="flex flex-col items-center justify-center flex-grow relative z-20 space-y-8">
            
            {/* Main Number */}
            <div className="flex items-center justify-center mb-4 h-[35%]">
              <h1 
                className="gold-foil-text font-display-lg text-[130px] font-black leading-none tracking-tighter" 
                data-text={`#${founderNumber}`}
              >
                #{founderNumber}
              </h1>
            </div>

            {/* Identity */}
            <div className="text-center mb-8">
              <h2 className="font-headline-md text-primary uppercase tracking-[0.15em] font-bold mb-1 text-[26px]">
                {countryName} FOUNDER
              </h2>
              <p className="font-label-caps text-secondary text-[11px] tracking-[0.3em] font-medium">
                FIRST {percentageStr}
              </p>
            </div>

            {/* Status Badge */}
            <div className="status-badge mb-10">
              ORIGINAL FOUNDER
            </div>

            {/* Divider */}
            <div className="thin-gold-line mb-10"></div>

            {/* Hot Take */}
            <div className="w-full text-center px-2 py-4">
              <span className="font-label-caps text-secondary text-[9px] tracking-[0.4em] uppercase mb-4 block font-semibold">
                HOT TAKE
              </span>
              <h3 className="font-display-lg text-on-surface font-black leading-tight uppercase tracking-tight italic text-[28px]">
                {hotTake}
              </h3>
            </div>
          </div>

          {/* FOOTER INFO */}
          <div className="w-full mt-auto flex flex-col items-center space-y-6 relative z-20 pb-8">
            <div className="flex justify-between w-full font-label-caps text-secondary text-[8px] tracking-[0.2em] font-bold">
              <span>{claimDateStr}</span>
              <span>LOCKED BEFORE KICKOFF</span>
            </div>
            
            <div className="registry-seal">
              <span className="material-symbols-outlined text-background text-[16px] select-none">
                verified
              </span>
            </div>
            
            <div className="font-body-md text-secondary/30 text-[8px] tracking-[0.5em] font-medium">
              {regCode}
            </div>
          </div>
        </div>

        {/* FIXED ACTIONS PANEL */}
        <div className="fixed bottom-12 left-0 right-0 flex flex-col items-center space-y-8 z-30">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            
            {/* Download Card button */}
            <a 
              href={`/api/claims/${claimId}/download`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-background font-label-caps px-8 py-3 rounded-full font-bold tracking-[0.2em] hover:bg-primary/90 transition-colors flex items-center gap-2 text-xs uppercase"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              DOWNLOAD CARD
            </a>

            {/* Share to X button */}
            <a 
              href={twitterShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-primary/30 bg-primary/5 text-primary font-label-caps px-8 py-3 rounded-full font-bold tracking-[0.2em] hover:bg-primary/10 transition-colors flex items-center gap-2 text-xs uppercase"
            >
              <span className="material-symbols-outlined text-[18px]">share</span>
              SHARE TO X
            </a>
          </div>

          {/* Bottom Branding */}
          <div className="flex flex-col items-center">
            <div className="thin-gold-line w-24 mb-4 opacity-30"></div>
            <div className="font-nav-item text-primary/40 tracking-[0.5em] uppercase text-[10px] font-semibold">
              BRAGMODE
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
