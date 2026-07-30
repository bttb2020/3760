"use client";

import { useEffect, useRef } from "react";

type Flake = {
  x: number;
  y: number;
  r: number;
  speed: number;
  drift: number;
  phase: number;
  opacity: number;
};

/** 全屏风雪 canvas：下落 + 侧风阵风，营造暴风雪氛围 */
export default function Snowfall({ density = 140 }: { density?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let raf = 0;
    let flakes: Flake[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round((density * width * height) / (1440 * 900));
      flakes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.6 + Math.random() * 2.2,
        speed: 0.4 + Math.random() * 1.4,
        drift: 0.3 + Math.random() * 1.1,
        phase: Math.random() * Math.PI * 2,
        opacity: 0.25 + Math.random() * 0.65,
      }));
    };

    resize();
    window.addEventListener("resize", resize);

    let t = 0;
    const tick = () => {
      t += 0.008;
      // 阵风：随时间起伏的侧风强度
      const gust = Math.sin(t * 1.7) * 0.9 + Math.sin(t * 0.6) * 1.4;

      ctx.clearRect(0, 0, width, height);
      for (const flake of flakes) {
        flake.phase += 0.01;
        flake.y += flake.speed * (1 + Math.abs(gust) * 0.35);
        flake.x += Math.sin(flake.phase) * flake.drift * 0.4 + gust * flake.drift;

        if (flake.y > height + 6) {
          flake.y = -6;
          flake.x = Math.random() * width;
        }
        if (flake.x > width + 6) flake.x = -6;
        if (flake.x < -6) flake.x = width + 6;

        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
        ctx.fill();
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [density]);

  return <canvas ref={canvasRef} className="snowfall" aria-hidden="true" />;
}
