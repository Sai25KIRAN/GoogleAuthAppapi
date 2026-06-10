'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Intersection observer reveal state
  const [revealedElements, setRevealedElements] = useState<Record<string, boolean>>({
    hero: true, // Show hero instantly
    scarcity: false,
    social: false,
    cta: false,
  });

  // 3D Card Tilt Mouse Interactions
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 10;
    const rotateY = -(x - centerX) / 20;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    
    const glintX = (x / rect.width) * 100;
    const glintY = (y / rect.height) * 100;
    card.style.setProperty('--mouse-x', `${glintX}%`);
    card.style.setProperty('--mouse-y', `${glintY}%`);
  };

  const handleCardMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
  };

  useEffect(() => {
    // 1. Scroll Reveal Intersection Observer
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.getAttribute('data-section-id');
          if (sectionId) {
            setRevealedElements(prev => ({ ...prev, [sectionId]: true }));
          }
        }
      });
    }, observerOptions);

    const revealables = document.querySelectorAll('[data-revealable]');
    revealables.forEach(el => observer.observe(el));

    // 3. Particle System logic
    const canvas = particleCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    const particleCount = 80;
    let animationFrameId: number;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    class Particle {
      x = 0;
      y = 0;
      size = 0;
      speedX = 0;
      speedY = 0;
      opacity = 0;
      life = 0;

      constructor() {
        this.init();
      }

      init() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3 - 0.2; // Upward drift
        this.opacity = Math.random() * 0.5 + 0.2;
        this.life = Math.random() * 100 + 100;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life--;
        if (this.life <= 0 || this.y < -10) this.init();
      }

      draw() {
        ctx!.fillStyle = `rgba(233, 195, 73, ${this.opacity})`;
        ctx!.beginPath();
        ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    const createParticles = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    const animateParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      animationFrameId = requestAnimationFrame(animateParticles);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    createParticles();
    animateParticles();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  }, []);

  const handleClaimClick = () => {
    router.push('/select');
  };

  return (
    <div className="bg-background text-on-surface selection:bg-primary selection:text-on-primary min-h-screen flex flex-col font-sans">
      
      {/* 1. Sticky FOMO Top Bar */}
      <div className="fixed top-0 left-0 w-full z-[100] bg-surface-container-lowest border-b border-outline-variant/30 overflow-hidden h-10 flex items-center">
        <div className="animate-ticker whitespace-nowrap flex gap-12 items-center px-4">
          <span className="flex items-center gap-2 font-label-caps text-label-caps text-primary">
            <span className="material-symbols-outlined text-[14px]">local_fire_department</span> Brazil Founder #184 just claimed
          </span>
          <span className="flex items-center gap-2 font-label-caps text-label-caps text-primary">
            <span className="material-symbols-outlined text-[14px]">local_fire_department</span> Argentina Founder #842 just claimed
          </span>
          <span className="flex items-center gap-2 font-label-caps text-label-caps text-primary">
            <span className="material-symbols-outlined text-[14px]">local_fire_department</span> France Founder #012 just claimed
          </span>
          <span className="flex items-center gap-2 font-label-caps text-label-caps text-primary">
            <span className="material-symbols-outlined text-[14px]">local_fire_department</span> Germany Founder #551 just claimed
          </span>
          <span className="flex items-center gap-2 font-label-caps text-label-caps text-primary">
            <span className="material-symbols-outlined text-[14px]">local_fire_department</span> Uruguay Founder #298 just claimed
          </span>
          {/* Duplicate for infinite effect */}
          <span className="flex items-center gap-2 font-label-caps text-label-caps text-primary">
            <span className="material-symbols-outlined text-[14px]">local_fire_department</span> Brazil Founder #184 just claimed
          </span>
          <span className="flex items-center gap-2 font-label-caps text-label-caps text-primary">
            <span className="material-symbols-outlined text-[14px]">local_fire_department</span> Argentina Founder #842 just claimed
          </span>
          <span className="flex items-center gap-2 font-label-caps text-label-caps text-primary">
            <span className="material-symbols-outlined text-[14px]">local_fire_department</span> France Founder #012 just claimed
          </span>
        </div>
      </div>

      {/* TopNavBar Shell */}
      <header className="fixed top-10 left-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-outline-variant/30">
        <div className="flex justify-between items-center px-margin-desktop h-20 w-full max-w-container-max mx-auto">
          <div className="font-display-lg text-headline-md tracking-tighter text-primary">BRAGMODE</div>
          <button 
            onClick={handleClaimClick}
            className="bg-primary text-on-primary px-6 py-2 font-label-caps text-label-caps inner-glow-btn hover:scale-95 transition-transform duration-200 cursor-pointer"
          >
            Claim Card
          </button>
        </div>
      </header>

      <main className="pt-32 flex-1">
        {/* 2. Hero Section */}
        <section className="relative min-h-[921px] flex flex-col items-center justify-center text-center px-margin-mobile md:px-margin-desktop overflow-hidden">
          {/* Gold Particle System */}
          <canvas id="particleCanvas" ref={particleCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-1"></canvas>
          
          {/* Animated Map Background */}
          <div className="absolute inset-0 z-0 opacity-40">
            <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background z-10"></div>
            <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"></div>
            <img 
              className="w-full h-full object-cover grayscale mix-blend-overlay opacity-30 animate-map" 
              alt="sophisticated world map"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDzfe5VbyCDQnyepElfF5J9WDtebiH9_i2VjvwSH5wUwTQ8nreHH-XpMpDFBQY2vBfC2hYQEL1y-K96n9RQJ0Wj1cfYs_ilRgOBSV4jJ7c34rw2e9woCHohrvaLn1Mu6ylaS-a9WC05XAsfQXxB4aiO3skXgMF_OsMmvkySOrT_Yg2f6PkdKqJ8UN_yZe0kh0U5MBKXXXqtMC8tRDVbCFUFUrK6gWzcaM-v79rDjbir2bmPqR2UXQmGKtNIxNk7PdzoAkd4WKy7mBIC"
            />
          </div>

          {/* Floating Cards Decor */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden hidden lg:block">
            <div className="absolute top-[20%] left-[10%] w-32 h-48 border border-primary/40 glass-card rotate-[-12deg] rounded-lg opacity-40"></div>
            <div className="absolute bottom-[30%] right-[15%] w-32 h-48 border border-primary/40 glass-card rotate-[15deg] rounded-lg opacity-40"></div>
          </div>

          <div className={`relative z-10 max-w-4xl transition-all duration-1000 ${revealedElements.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg mb-6 text-on-surface uppercase">
              CLAIM YOUR PLACE IN <br/><span className="text-primary italic">WORLD CUP HISTORY</span>
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-2xl mx-auto">
              Lock your football takes. Secure your supporter number. <br className="hidden md:block" />Earn bragging rights forever in the Sovereign Vault.
            </p>
            <div className="flex flex-col md:flex-row gap-gutter justify-center items-center">
              <button 
                onClick={handleClaimClick}
                className="bg-primary text-on-primary px-10 py-4 font-label-caps text-label-caps text-lg inner-glow-btn hover:brightness-110 transition-all w-full md:w-auto cta-pulse cursor-pointer"
              >
                Claim Founder Card
              </button>
              <button 
                onClick={handleClaimClick}
                className="border border-primary/50 text-primary px-10 py-4 font-label-caps text-label-caps text-lg hover:bg-primary/10 transition-all w-full md:w-auto cursor-pointer"
              >
                View Live Founder Registry
              </button>
            </div>
          </div>
        </section>

        {/* 3. Nation Scarcity Grid */}
        <section 
          data-revealable 
          data-section-id="scarcity"
          className={`py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto transition-all duration-1000 reveal ${revealedElements.scarcity ? 'active' : ''}`}
        >
          <div className="text-center mb-16">
            <span className="font-label-caps text-label-caps text-primary tracking-[0.3em]">AVAILABLE SEATS</span>
            <h2 className="font-headline-md text-headline-md mt-4">Registry Scarcity Report</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Brazil */}
            <div 
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              onClick={handleClaimClick}
              className="glass-card p-8 flex flex-col border-primary/60 border-2 group transition-all duration-300 cursor-pointer h-[320px] justify-between"
              data-tilt
            >
              <div className="flex justify-between items-start mb-4 pointer-events-none">
                <img 
                  className="w-16 h-10 object-cover rounded-sm border border-outline-variant" 
                  alt="Brazil Flag desaturated texture"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCPoeMLBwjHFdIHFY4QbYtwvm7vZBMyHGdFD1tONepJJEQSZXAN3o8AHXAxPLHc2bmWICPBoL4uJEauKw_oki-i1FLMOTO4mejYuHDTWu65qMip28iBRzUUw0ht0LIQg8BDqO_ytS-5gGIJiLMRClIvrVYFYFcFD1s5wnrMi15czn-usjiD_2OonOdiqvyo9jjAHFRsoUKVkae_cNVRchwTrKkW2veFDaM8wNyWke0OES0QxpfYYi3ilIqGUbFmyu1e8niVRo8yflqR"
                />
                <span className="font-label-caps text-[10px] text-primary bg-primary/10 px-2 py-1 border border-primary/30">CRITICAL LOW</span>
              </div>
              <h3 className="font-display-lg text-headline-md mb-2 pointer-events-none">Brazil</h3>
              <div className="mt-auto pointer-events-none">
                <div className="flex justify-between items-end mb-2">
                  <span className="font-body-md text-on-surface-variant">Authenticated Founders</span>
                  <span className="font-label-caps text-primary">816 / 1000</span>
                </div>
                <div className="w-full h-1 bg-surface-variant overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: '81.6%' }}></div>
                </div>
                <p className="font-label-caps text-[10px] mt-4 text-on-surface-variant/60 tracking-widest">UNDER 200 SLOTS LEFT</p>
              </div>
            </div>

            {/* Argentina */}
            <div 
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              onClick={handleClaimClick}
              className="glass-card p-8 flex flex-col border-primary/20 group hover:border-primary/60 transition-all duration-300 cursor-pointer h-[320px] justify-between"
              data-tilt
            >
              <div className="flex justify-between items-start mb-4 pointer-events-none">
                <img 
                  className="w-16 h-10 object-cover rounded-sm border border-outline-variant" 
                  alt="Argentina Flag desaturated texture"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGivhuvdM_M9eyH2rVBqSXw3LKkKquvIbzs5aw6Zv4wLj_h1OkjTc5jNFEz0hWvGwcly9JqA_m0FjOR0RfVSUHoCJAbfZqXah3Kim_1G6Ih38E4W_UFP_ql8ZTIC_yy85VLzawwisZumW8oi8xgoPXfJf6l6TG4-gAWAzFHQhLm_uaYmjRHaEtg0lPvJ8b2di8ms-v49GjGsxLtNrz6zOrzmdJjzvK8Jn6BMpwbmtZW1yAZ41MjFUdw2tgdKjPGH1VH3UMWYoWmNbD"
                />
                <span className="font-label-caps text-[10px] text-on-surface-variant border border-outline-variant/30 px-2 py-1">FILLING FAST</span>
              </div>
              <h3 className="font-display-lg text-headline-md mb-2 pointer-events-none">Argentina</h3>
              <div className="mt-auto pointer-events-none">
                <div className="flex justify-between items-end mb-2">
                  <span className="font-body-md text-on-surface-variant">Authenticated Founders</span>
                  <span className="font-label-caps text-primary">452 / 1000</span>
                </div>
                <div className="w-full h-1 bg-surface-variant overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: '45.2%' }}></div>
                </div>
                <p className="font-label-caps text-[10px] mt-4 text-on-surface-variant/60 tracking-widest">PHASE 2 OPEN</p>
              </div>
            </div>

            {/* France */}
            <div 
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              onClick={handleClaimClick}
              className="glass-card p-8 flex flex-col border-red-500/60 border-2 group transition-all duration-300 cursor-pointer h-[320px] justify-between"
              data-tilt
            >
              <div className="flex justify-between items-start mb-4 pointer-events-none">
                <img 
                  className="w-16 h-10 object-cover rounded-sm border border-outline-variant" 
                  alt="France Flag desaturated texture"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDf-5Knwn0Ufr2rYjz-_z3hY9b0upXJU1QoYtHZE0nU2_9PUrPQGHvzkRnDjVMoHq6Ba1q2yi7d8JrgFrWNXy1BDaW3EQJQjA64iYY9ofBB0iE8HgFJTHiuvIBbD56FDMZB3pzLeI9Tr3Fm4zY_teWRjh_yvZsSx0jVks7ELUiby-2kkbwh7rlQZpSiRkfR1X4HfoCIE2_zSLmfbe5tP-lrAm6U6XgnmuYSs7DrYWiAUmG_lSwyonDoQpyi9icu_2ADL3Cwpa2ge6cS"
                />
                <span className="font-label-caps text-[10px] text-red-500 bg-red-500/10 px-2 py-1 border border-red-500/30">IMMINENT SELLOUT</span>
              </div>
              <h3 className="font-display-lg text-headline-md mb-2 pointer-events-none">France</h3>
              <div className="mt-auto pointer-events-none">
                <div className="flex justify-between items-end mb-2">
                  <span className="font-body-md text-on-surface-variant">Authenticated Founders</span>
                  <span className="font-label-caps text-primary text-red-500">952 / 1000</span>
                </div>
                <div className="w-full h-1 bg-surface-variant overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: '95.2%' }}></div>
                </div>
                <p className="font-label-caps text-[10px] mt-4 text-red-500/80 tracking-widest">UNDER 50 SLOTS LEFT</p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Social Proof Section */}
        <section 
          data-revealable 
          data-section-id="social"
          className={`py-24 border-y border-outline-variant/20 bg-surface-container-lowest transition-all duration-1000 reveal ${revealedElements.social ? 'active' : ''}`}
        >
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop flex flex-col items-center">
            <div className="flex -space-x-4 mb-8">
              <img 
                className="w-16 h-16 rounded-full border-2 border-background object-cover" 
                alt="Founder Portrait 1"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDT0FxyQL9W9ZkHJP0GZFf8SU53nq6u06cey11rOGJkwKIb1wv3GJBfhCpEsxlSItiSqkYfCO6nZxu-oMc1GYtGm-04WMpkcElctRMCb9Y3SQwizT8qW-s_bwJx5kQ7DAXVW7_5i_MJE4ptqNZ1zEpSUK5VssP_0KF0L2XWGU2DQmEheO0MFUeayEyRvELhYmz6hTvYoah5yEkEtS_LB4_y7L9KrcLtsn9h6lBd8_r246zmM_jj4XTuLKTaY8fCIu0ZIKaeW_QplxX4"
              />
              <img 
                className="w-16 h-16 rounded-full border-2 border-background object-cover" 
                alt="Founder Portrait 2"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCFF8QOqY12ELcP4YEbVJHWkTv2czze_8h62Kcej4c60a5y0D2SQaHohrZ5uzlF_-_wCqrY_5WOcN-iWrWkioJUZvU7vb-ikkijEZL0qebsxfIbwZlWTKpfmmqzkdjLZ2Bv0Mq05MGHkJbvjoaRkjtN4ijgcsIqNqh3p2C1mkqan2ljWtmarwUvrw8pJISQEISw3A6sjaJ72a4TXI-GXsT1gBfQiktavBA8KsFJL-QRJdpyoLGz_iOioqxWBOPphbLBrJ2T2WVH1sFz"
              />
              <img 
                className="w-16 h-16 rounded-full border-2 border-background object-cover" 
                alt="Founder Portrait 3"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBMeo2tc6s-_vqddVGFZlc-c3YGiQdhKcA1q7gQQhTI22uRJhyNREQom5skMr6OOzbHrkSl0tHZTasDDL4soDQEfaqYCO_3n7z1RjRvi_j6PKMBIBnPqYtmJRhnaLrek41Almk47SeEestNSHoL_sssa3XWOX4GUiozgCsb6bgxKo1iXEacCBtz4nNVm7K8G3jnOX_EcjyjjjCcFEzsmkWWYEG8CttlhIPk4fZ-fWjaA0QlyVpItHjp5tBbBBzIaiNuO84gRKksjIgN"
              />
              <div className="w-16 h-16 rounded-full border-2 border-background bg-primary-container flex items-center justify-center font-label-caps text-on-primary-container text-xs font-extrabold">
                +12k
              </div>
            </div>
            
            <h2 className="font-display-lg text-headline-md md:text-display-lg text-center mb-6 max-w-3xl">
              12,483 Supporters Already Locked Their Takes
            </h2>
            
            <div className="flex flex-wrap justify-center gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
              <span className="flex items-center gap-2 font-label-caps text-label-caps"><span className="material-symbols-outlined text-[16px]">stars</span> LEGENDARY STATUS</span>
              <span className="flex items-center gap-2 font-label-caps text-label-caps"><span className="material-symbols-outlined text-[16px]">shield</span> SECURE REGISTRY</span>
              <span className="flex items-center gap-2 font-label-caps text-label-caps"><span className="material-symbols-outlined text-[16px]">trophy</span> HISTORIC PROOF</span>
            </div>
          </div>
        </section>

        {/* 5. CTA Footer Section */}
        <section 
          data-revealable 
          data-section-id="cta"
          className={`py-32 px-margin-mobile md:px-margin-desktop bg-black relative overflow-hidden transition-all duration-1000 reveal ${revealedElements.cta ? 'active' : ''}`}
        >
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg mb-12 tracking-tight">
              Only founders will own the <br/><span className="text-primary">original supporter numbers.</span>
            </h2>
            <button 
              onClick={handleClaimClick}
              className="inline-flex items-center gap-4 text-primary font-display-lg text-headline-md hover:gap-8 transition-all duration-300 group cursor-pointer"
            >
              Claim Yours <span className="material-symbols-outlined text-4xl group-hover:translate-x-2 transition-transform">arrow_right_alt</span>
            </button>
          </div>
          {/* Atmospheric Glow */}
          <div className="absolute -bottom-48 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 blur-[120px] rounded-full"></div>
        </section>
      </main>

      {/* Footer Shell */}
      <footer className="w-full py-16 border-t border-outline-variant/30 bg-background">
        <div className="flex flex-col items-center justify-center space-y-gutter px-margin-desktop w-full max-w-container-max mx-auto">
          <div className="font-display-lg text-primary text-headline-md">BRAGMODE</div>
          <div className="flex flex-wrap justify-center gap-gutter">
            <a className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors text-xs" href="#">Privacy</a>
            <a className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors text-xs" href="#">Terms</a>
            <a className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors text-xs" href="#">Discord</a>
            <a className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors text-xs" href="#">Institutional</a>
            <a className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors text-xs" href="#">Contact</a>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant/50 text-center max-w-md text-xs">
            © 2024 WORLD CUP HERITAGE. ALL RIGHTS RESERVED. SOVEREIGN STATUS GRANTED.
          </p>
        </div>
      </footer>
    </div>
  );
}
