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

    const hue = 210; // Blue fire hue

    // Emitter and mouse tracking
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
      idleThreshold: 380, // ms without movement -> idle/upward
    };

    const onMove = (e: MouseEvent) => {
      state.pointerX = e.clientX;
      state.pointerY = e.clientY;
      state.lastMove = performance.now();
    };

    window.addEventListener("mousemove", onMove);
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
    };

    const particles: Particle[] = [];

    const spawnParticles = (count: number, idle: boolean) => {
      for (let i = 0; i < count; i++) {
        const angleBase = Math.atan2(state.vy, state.vx);
        const spd = Math.hypot(state.vx, state.vy);
        const speedFactor = Math.min(1, spd / 10);
        const jitterRange = idle ? 0.35 : 0.8 - 0.5 * speedFactor; // less spread at high speeds
        const jitter = (Math.random() - 0.5) * jitterRange;
        const angle = idle
          ? -Math.PI / 2 + jitter // straight up with small spread
          : angleBase + jitter; // follow motion vector

        const speed = idle ? (0.6 + Math.random() * 0.6) : (0.8 + Math.random() * 1.2);
        const size = idle ? (5 + Math.random() * 6) : (5 + Math.random() * 8); // Bigger particles

        const posJitter = idle ? 4 : 10 - 6 * speedFactor; // tighter origin when fast

        particles.push({
          x: state.emitterX + (Math.random() - 0.5) * posJitter,
          y: state.emitterY + (Math.random() - 0.5) * posJitter,
          vx: Math.cos(angle) * speed * (prefersReducedMotion ? 0.6 : 1),
          vy: Math.sin(angle) * speed * (prefersReducedMotion ? 0.6 : 1),
          life: 0,
          maxLife: idle ? (420 + Math.random() * 280) : (300 + Math.random() * 240),
          size,
          seed: Math.random() * 1000,
        });
      }
    };

    const tick = (now: number) => {
      state.time = now;

      // Smooth target toward pointer to prevent jitter
      state.targetX += (state.pointerX - state.targetX) * 0.25;
      state.targetY += (state.pointerY - state.targetY) * 0.25;

      // Ease emitter toward target (gentle pull) with damping and velocity clamp
      const damping = 0.88;
      const follow = prefersReducedMotion ? 0.045 : 0.09;
      const dx = state.targetX - state.emitterX;
      const dy = state.targetY - state.emitterY;
      state.vx = state.vx * damping + dx * follow;
      state.vy = state.vy * damping + dy * follow;
      // Clamp speed to reduce shake at high cursor speeds
      const maxV = prefersReducedMotion ? 7 : 10;
      const sp = Math.hypot(state.vx, state.vy);
      if (sp > maxV) {
        const s = maxV / sp;
        state.vx *= s;
        state.vy *= s;
      }
      state.emitterX += state.vx;
      state.emitterY += state.vy;

      const idle = now - state.lastMove > state.idleThreshold;

      // Spawn rate and behavior
      const baseRate = prefersReducedMotion ? 15 : 35; // More particles for bigger fire
      const rate = idle ? baseRate * 0.9 : baseRate;
      spawnParticles(rate, idle);

      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw particles with additive blending for glow
      ctx.globalCompositeOperation = "lighter";

      // Flicker factor from time (less random at high speeds to avoid visual shaking)
      const emitterSpeed = Math.hypot(state.vx, state.vy);
      const randAmp = emitterSpeed > 6 ? 0.015 : 0.04;
      const flicker = 0.85 + Math.sin(now * 0.005) * 0.05 + (Math.random() - 0.5) * randAmp;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += 16;

        // Upward buoyancy and slight curl noise (reduce lateral noise when moving fast)
        const noiseBase = Math.sin((p.seed + now) * 0.002) * 0.2;
        const moveNoiseScale = 1 - Math.min(0.7, emitterSpeed / 12);
        const lateralNoise = idle ? noiseBase * 0.15 : noiseBase * (0.25 * moveNoiseScale);
        p.vx += lateralNoise;
        p.vy += idle ? -0.008 : -0.004; // buoyancy stronger when idle (calm rise)

        // Integrate
        p.x += p.vx;
        p.y += p.vy;

        // Life and removal
        if (p.life > p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        // Render
        const t = p.life / p.maxLife;
        const alpha = (1 - t) * 0.28 * flicker; // Slightly more visible
        if (alpha <= 0.002) continue;

        const inner = Math.max(0, 1 - t * 1.2);
        const size = p.size * (0.8 + inner * 1.0); // Bigger rendered size

        // Color ramp: white core -> cyan -> azure blue
        const sat = 90 - t * 40; // saturation reduces slightly
        const light = 70 - t * 35; // gets darker toward the edges
        const color = `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`;

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size);
        gradient.addColorStop(0, `hsla(${hue}, 100%, 95%, ${alpha})`);
        gradient.addColorStop(0.3, `hsla(${hue}, 98%, 70%, ${alpha * 0.9})`);
        gradient.addColorStop(0.7, color);
        gradient.addColorStop(1, `hsla(${hue + 10}, 90%, 50%, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Core orb that follows the pointer (subtle)
      const coreSize = (prefersReducedMotion ? 8 : 12) + Math.sin(now * 0.01) * 1.0; // Bigger core
      const coreGrad = ctx.createRadialGradient(
        state.emitterX,
        state.emitterY,
        0,
        state.emitterX,
        state.emitterY,
        coreSize * 4
      );
      coreGrad.addColorStop(0, `hsla(${hue}, 100%, 96%, 0.35)`);
      coreGrad.addColorStop(0.4, `hsla(${hue}, 100%, 60%, 0.18)`);
      coreGrad.addColorStop(1, `hsla(${hue}, 100%, 50%, 0)`);
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(state.emitterX, state.emitterY, coreSize * 4, 0, Math.PI * 2);
      ctx.fill();

      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener("mousemove", onMove);
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
