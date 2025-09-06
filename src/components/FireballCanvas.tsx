import React, { useEffect, useRef } from "react";

const FireballCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Sizing
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const resize = () => {
      const { innerWidth: w, innerHeight: h } = window;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // Motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Dynamic color system
    const fireColor = { hue: 220, sat: 95, light: 60 }; // Blue fire

    // Enhanced emitter state
    const state = {
      time: 0,
      pointerX: window.innerWidth / 2,
      pointerY: window.innerHeight / 2,
      targetX: window.innerWidth / 2,
      targetY: window.innerHeight / 2,
      lastMove: performance.now(),
      emitterX: window.innerWidth / 2,
      emitterY: window.innerHeight / 2,
      vx: 0,
      vy: 0,
      idleThreshold: 380,
      intensity: 1,
      trailParticles: [] as Array<{x: number, y: number, life: number, size: number}>,
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      isTouch: 'ontouchstart' in window,
    };

    // Mobile-specific scaling
    const mobileScale = state.isMobile ? 0.6 : 1;
    const particleScale = state.isMobile ? 0.7 : 1;

    const onMove = (e: MouseEvent) => {
      state.pointerX = e.clientX;
      state.pointerY = e.clientY;
      state.lastMove = performance.now();
      
      // Add trail particles
      const maxTrailParticles = state.isMobile ? 10 : 20;
      if (state.trailParticles.length < maxTrailParticles) {
        state.trailParticles.push({
          x: state.emitterX,
          y: state.emitterY,
          life: 0,
          size: (3 + Math.random() * 4) * particleScale
        });
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        state.pointerX = touch.clientX;
        state.pointerY = touch.clientY;
        state.lastMove = performance.now();
        
        // Add trail particles for touch
        const maxTrailParticles = 10;
        if (state.trailParticles.length < maxTrailParticles) {
          state.trailParticles.push({
            x: state.emitterX,
            y: state.emitterY,
            life: 0,
            size: (2 + Math.random() * 3) * particleScale
          });
        }
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        state.pointerX = touch.clientX;
        state.pointerY = touch.clientY;
        state.lastMove = performance.now();
      }
    };

    const onClick = () => {
      // Burst effect on click
      state.intensity = state.isMobile ? 2 : 3;
      setTimeout(() => { state.intensity = 1; }, state.isMobile ? 300 : 500);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: false });
    window.addEventListener("click", onClick);
    window.addEventListener("resize", resize);

    type Particle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      size: number;
      seed: number;
      type: 'fire' | 'spark' | 'ember';
      hue: number;
    };

    const particles: Particle[] = [];

    const spawnParticles = (count: number, idle: boolean) => {
      const adjustedCount = Math.floor(count * state.intensity * particleScale);
      
      for (let i = 0; i < adjustedCount; i++) {
        const angleBase = Math.atan2(state.vy, state.vx);
        const spd = Math.hypot(state.vx, state.vy);
        const speedFactor = Math.min(1, spd / 10);
        const jitterRange = idle ? 0.2 : 0.4 - 0.3 * speedFactor;
        const jitter = (Math.random() - 0.5) * jitterRange;
        const angle = idle
          ? -Math.PI / 2 + jitter
          : angleBase + jitter;

        const baseSpeed = idle ? (0.8 + Math.random() * 0.8) : (1.0 + Math.random() * 1.5);
        const speed = baseSpeed * (state.isMobile ? 0.8 : 1);
        const baseSize = idle ? (4 + Math.random() * 6) : (4 + Math.random() * 8);
        const size = baseSize * particleScale;

        const posJitter = (idle ? 6 : 12 - 8 * speedFactor) * mobileScale;

        // Determine particle type
        const rand = Math.random();
        let type: 'fire' | 'spark' | 'ember';
        if (rand < 0.7) type = 'fire';
        else if (rand < 0.9) type = 'spark';
        else type = 'ember';

        const hueVariation = type === 'spark' ? 40 : 20;
        const particleHue = fireColor.hue + (Math.random() - 0.5) * hueVariation;

        particles.push({
          x: state.emitterX + (Math.random() - 0.5) * posJitter,
          y: state.emitterY + (Math.random() - 0.5) * posJitter,
          vx: Math.cos(angle) * speed * (prefersReducedMotion ? 0.7 : 1),
          vy: Math.sin(angle) * speed * (prefersReducedMotion ? 0.7 : 1),
          life: 0,
          maxLife: (type === 'ember' ? (600 + Math.random() * 400) : (350 + Math.random() * 300)) * (state.isMobile ? 0.8 : 1),
          size: type === 'spark' ? size * 0.6 : size,
          seed: Math.random() * 1000,
          type,
          hue: particleHue,
        });
      }
    };

    const tick = (now: number) => {
      state.time = now;

      // Smooth target toward pointer with enhanced smoothing
      state.targetX += (state.pointerX - state.targetX) * 0.12;
      state.targetY += (state.pointerY - state.targetY) * 0.12;

      // Enhanced emitter movement with smoother damping
      const damping = 0.95;
      const follow = prefersReducedMotion ? 0.06 : (state.isMobile ? 0.12 : 0.08);
      const dx = state.targetX - state.emitterX;
      const dy = state.targetY - state.emitterY;
      state.vx = state.vx * damping + dx * follow;
      state.vy = state.vy * damping + dy * follow;
      
      const maxV = prefersReducedMotion ? 10 : (state.isMobile ? 12 : 15);
      const sp = Math.hypot(state.vx, state.vy);
      if (sp > maxV) {
        const s = maxV / sp;
        state.vx *= s;
        state.vy *= s;
      }
      state.emitterX += state.vx;
      state.emitterY += state.vy;

      // Update trail particles
      state.trailParticles.forEach((trail, i) => {
        trail.life += 16;
        const maxTrailLife = state.isMobile ? 150 : 200;
        if (trail.life > maxTrailLife) {
          state.trailParticles.splice(i, 1);
        }
      });

      const idle = now - state.lastMove > state.idleThreshold;
      const baseRate = prefersReducedMotion ? 20 : (state.isMobile ? 25 : 45);
      const rate = idle ? baseRate * 0.8 : baseRate;
      spawnParticles(rate, idle);

      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw trail
      ctx.globalCompositeOperation = "lighter";
      state.trailParticles.forEach(trail => {
        const maxTrailLife = state.isMobile ? 150 : 200;
        const alpha = (1 - trail.life / maxTrailLife) * (state.isMobile ? 0.2 : 0.3);
        
        const gradient = ctx.createRadialGradient(
          trail.x, trail.y, 0,
          trail.x, trail.y, trail.size * (state.isMobile ? 1.5 : 2)
        );
        gradient.addColorStop(0, `hsla(${fireColor.hue}, 80%, 80%, ${alpha})`);
        gradient.addColorStop(1, `hsla(${fireColor.hue}, 60%, 60%, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(trail.x, trail.y, trail.size * (state.isMobile ? 1.5 : 2), 0, Math.PI * 2);
        ctx.fill();
      });

      // Enhanced flicker with smoother variation
      const emitterSpeed = Math.hypot(state.vx, state.vy);
      const randAmp = emitterSpeed > 8 ? 0.01 : 0.03;
      const flicker = 0.95 + Math.sin(now * 0.006) * 0.04 + (Math.random() - 0.5) * randAmp;

      // Draw particles with enhanced effects
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += 16;

        // Enhanced physics with smoother movement
        const noiseBase = Math.sin((p.seed + now) * 0.002) * 0.15;
        const moveNoiseScale = 1 - Math.min(0.8, emitterSpeed / 15);
        const lateralNoise = idle ? noiseBase * 0.1 : noiseBase * (0.15 * moveNoiseScale);
        
        p.vx += lateralNoise;
        p.vy += (idle ? -0.008 : -0.006) * (p.type === 'ember' ? 0.5 : 1);

        // Gravity and air resistance with smoother damping
        p.vx *= 0.999;
        p.vy *= 0.997;

        p.x += p.vx;
        p.y += p.vy;

        if (p.life > p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        // Enhanced rendering
        const t = p.life / p.maxLife;
        let alpha = (1 - t) * 0.4 * flicker;
        
        if (p.type === 'spark') alpha *= 1.5;
        else if (p.type === 'ember') alpha *= 0.8;
        
        if (alpha <= 0.003) continue;

        const inner = Math.max(0, 1 - t * 1.3);
        let size = p.size * (0.9 + inner * 1.2);
        
        if (p.type === 'spark') size *= 0.5;
        else if (p.type === 'ember') size *= 1.0;

        // Enhanced color system
        const sat = fireColor.sat - t * 30;
        const light = fireColor.light - t * 25;
        
        let coreColor, midColor, edgeColor;
        
        if (p.type === 'spark') {
          coreColor = `hsla(${p.hue}, 100%, 95%, ${alpha * 1.2})`;
          midColor = `hsla(${p.hue}, ${sat + 10}%, ${light + 15}%, ${alpha})`;
          edgeColor = `hsla(${p.hue + 15}, ${sat}%, ${light}%, ${alpha * 0.5})`;
        } else if (p.type === 'ember') {
          coreColor = `hsla(${p.hue}, ${sat + 20}%, ${light + 10}%, ${alpha})`;
          midColor = `hsla(${p.hue}, ${sat}%, ${light - 10}%, ${alpha * 0.8})`;
          edgeColor = `hsla(${p.hue - 10}, ${sat - 20}%, ${light - 20}%, ${alpha * 0.3})`;
        } else {
          coreColor = `hsla(${p.hue}, 100%, 90%, ${alpha})`;
          midColor = `hsla(${p.hue}, ${sat}%, ${light}%, ${alpha * 0.9})`;
          edgeColor = `hsla(${p.hue + 10}, ${sat - 10}%, ${light - 10}%, ${alpha * 0.4})`;
        }

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size);
        gradient.addColorStop(0, coreColor);
        gradient.addColorStop(0.4, midColor);
        gradient.addColorStop(0.8, edgeColor);
        gradient.addColorStop(1, `hsla(${p.hue}, 50%, 30%, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Enhanced core orb
      const baseCoreSize = prefersReducedMotion ? 8 : (state.isMobile ? 8 : 12);
      const coreSize = (baseCoreSize + Math.sin(now * 0.015) * 1.5) * mobileScale;
      const coreIntensity = 0.6 + Math.sin(now * 0.01) * 0.2;
      
      const coreGrad = ctx.createRadialGradient(
        state.emitterX,
        state.emitterY,
        0,
        state.emitterX,
        state.emitterY,
        coreSize * 3
      );
      coreGrad.addColorStop(0, `hsla(${fireColor.hue}, 100%, 95%, ${coreIntensity * 0.8})`);
      coreGrad.addColorStop(0.3, `hsla(${fireColor.hue}, 90%, 70%, ${coreIntensity * 0.4})`);
      coreGrad.addColorStop(0.7, `hsla(${fireColor.hue}, 80%, 50%, ${coreIntensity * 0.2})`);
      coreGrad.addColorStop(1, `hsla(${fireColor.hue}, 70%, 40%, 0)`);
      
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(state.emitterX, state.emitterY, coreSize * 3, 0, Math.PI * 2);
      ctx.fill();

      // Intensity decay
      if (state.intensity > 1) {
        state.intensity = Math.max(1, state.intensity - 0.02);
      }

      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("click", onClick);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 z-30 pointer-events-none"
    />
  );
};

export default FireballCanvas;