import React, { useEffect, useRef } from "react";

const StarfieldCanvas: React.FC = () => {
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

    type Star = {
      x: number;
      y: number;
      size: number;
      brightness: number;
      twinkleSpeed: number;
      twinkleOffset: number;
      color: string;
      pulsePhase: number;
    };

    const stars: Star[] = [];
    const numStars = prefersReducedMotion ? 120 : 200;

    // Generate stars with varied colors
    const starColors = [
      'rgba(255, 255, 255, ',
      'rgba(200, 220, 255, ',
      'rgba(255, 220, 200, ',
      'rgba(180, 200, 255, ',
      'rgba(255, 200, 180, ',
    ];

    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 3 + 0.5,
        brightness: Math.random() * 0.9 + 0.1,
        twinkleSpeed: Math.random() * 0.03 + 0.005,
        twinkleOffset: Math.random() * Math.PI * 2,
        color: starColors[Math.floor(Math.random() * starColors.length)],
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    window.addEventListener("resize", resize);

    const tick = (now: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw nebula-like background
      const nebulaGradient = ctx.createRadialGradient(
        window.innerWidth * 0.3, window.innerHeight * 0.4, 0,
        window.innerWidth * 0.3, window.innerHeight * 0.4, window.innerWidth * 0.8
      );
      nebulaGradient.addColorStop(0, 'rgba(20, 30, 80, 0.15)');
      nebulaGradient.addColorStop(0.5, 'rgba(40, 20, 60, 0.08)');
      nebulaGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = nebulaGradient;
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      // Draw stars with enhanced effects
      stars.forEach((star) => {
        const twinkle = Math.sin(now * star.twinkleSpeed + star.twinkleOffset) * 0.4 + 0.6;
        const pulse = Math.sin(now * 0.001 + star.pulsePhase) * 0.2 + 0.8;
        const alpha = star.brightness * twinkle * pulse * 0.9;
        
        // Main star glow
        const gradient = ctx.createRadialGradient(
          star.x, star.y, 0,
          star.x, star.y, star.size * 4
        );
        gradient.addColorStop(0, star.color + `${alpha})`);
        gradient.addColorStop(0.3, star.color + `${alpha * 0.7})`);
        gradient.addColorStop(0.7, star.color + `${alpha * 0.3})`);
        gradient.addColorStop(1, star.color + '0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 4, 0, Math.PI * 2);
        ctx.fill();

        // Bright core
        if (star.brightness > 0.7) {
          ctx.fillStyle = star.color + `${alpha * 1.2})`);
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 z-10 pointer-events-none"
    />
  );
};

export default StarfieldCanvas;