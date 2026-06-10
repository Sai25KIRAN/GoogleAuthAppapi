'use client';

import React, { useEffect, useRef } from 'react';

interface FounderClientProps {
  country: {
    id: string;
    name: string;
    flag: string;
    max_founders: number;
  };
  claim: {
    id: string;
    founder_number: number;
    hot_take: string;
    claim_hash: string;
    claimed_at: string;
  };
}

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

export default function FounderClient({ country, claim }: FounderClientProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
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
  }, []);





  // Percentile calculation
  const percentage = (claim.founder_number / country.max_founders) * 100;
  const percentageStr = percentage < 1 ? percentage.toFixed(2) + '%' : percentage.toFixed(1) + '%';

  // Claim Date formatting (e.g. CLAIMED JUNE 2026)
  const claimDate = new Date(claim.claimed_at);
  const monthNames = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
  ];
  const claimDateStr = `CLAIMED ${monthNames[claimDate.getMonth()]} ${claimDate.getFullYear()}`;

  // Unique Registry ID
  const regCode = `BM-${getCountryCode(country.name)}-${claim.founder_number}-${claimDate.getFullYear()}`;

  // Public Sharing URLs
  const publicUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `I just unlocked verified Founder Status for ${country.flag} ${country.name} (Founder #${claim.founder_number}) on BragMode! Check out my 2026 World Cup predictions here:`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(publicUrl)}`;

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden bg-background text-on-surface">
      
      {/* Background canvas */}
      <canvas ref={canvasRef} id="bg-canvas" className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none" />

      {/* Main Container */}
      <main className="relative z-10 flex-grow flex items-center justify-center w-full pb-48 pt-24">
        
        {/* Collectible Card wrapper */}
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
              {claim.founder_number} / {country.max_founders}
            </div>
          </div>

          {/* HERO SECTION */}
          <div className="flex flex-col items-center justify-center flex-grow relative z-20 space-y-8">
            
            {/* Main Number */}
            <div className="flex items-center justify-center mb-4 h-[35%]">
              <h1 
                className="gold-foil-text font-display-lg text-[130px] font-black leading-none tracking-tighter" 
                data-text={`#${claim.founder_number}`}
              >
                #{claim.founder_number}
              </h1>
            </div>

            {/* Identity */}
            <div className="text-center mb-8">
              <h2 className="font-headline-md text-primary uppercase tracking-[0.15em] font-bold mb-1 text-[26px]">
                {country.name} FOUNDER
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
                {claim.hot_take}
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
              href={`/api/claims/${claim.id}/download`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-background font-label-caps px-8 py-3 rounded-full font-bold tracking-[0.2em] hover:bg-primary/90 transition-colors flex items-center gap-2 text-xs uppercase"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              DOWNLOAD CARD
            </a>

            {/* Share button */}
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
