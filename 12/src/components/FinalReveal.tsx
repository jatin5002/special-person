import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Heart, RotateCcw, Infinity as InfinityIcon, Music, Sparkles } from "lucide-react";
import type { MusicState } from "./MusicBar";

export default function FinalReveal({
  onRestart,
  music,
  openMusic,
}: {
  onRestart: () => void;
  music: MusicState;
  openMusic: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    confetti({
      particleCount: 220,
      spread: 140,
      origin: { y: 0.45 },
      colors: ["#ff8fb2", "#f3d894", "#fff3cf", "#c084fc", "#7dd3fc"],
    });
    const t = setTimeout(() => {
      confetti({ particleCount: 150, spread: 110, origin: { y: 0.6 } });
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    let raf = 0;

    type F = {
      x: number;
      y: number;
      s: number;
      r: number;
      vr: number;
      vy: number;
      vx: number;
      ch: string;
      col: string;
    };
    const chars = ["♥", "❀", "✦", "♥", "❀", "✨"];
    const cols = ["#ff8fb2", "#f3d894", "#ffb3c8", "#e8a0bf", "#fff3cf", "#ffd1dc"];
    const fs: F[] = Array.from({ length: 48 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      s: 14 + Math.random() * 20,
      r: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.02,
      vy: 0.35 + Math.random() * 0.75,
      vx: (Math.random() - 0.5) * 0.5,
      ch: chars[Math.floor(Math.random() * chars.length)],
      col: cols[Math.floor(Math.random() * cols.length)],
    }));

    const onR = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onR);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const f of fs) {
        f.y -= f.vy;
        f.x += f.vx + Math.sin(f.y * 0.01) * 0.45;
        f.r += f.vr;
        if (f.y < -30) {
          f.y = h + 30;
          f.x = Math.random() * w;
        }
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.r);
        ctx.globalAlpha = 0.88;
        ctx.fillStyle = f.col;
        ctx.font = `${f.s}px serif`;
        ctx.textAlign = "center";
        ctx.shadowColor = f.col;
        ctx.shadowBlur = 14;
        ctx.fillText(f.ch, 0, 0);
        ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onR);
    };
  }, []);

  return (
    <div className="stage-page relative flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-0" />
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(65% 50% at 50% 45%, rgba(255,140,175,.2), transparent 75%)",
        }}
      />
      <div className="spotlight-beam pointer-events-none absolute inset-x-0 top-0 mx-auto h-[75vh] w-full" />

      <motion.div
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, ease: [0.2, 0.8, 0.2, 1] }}
        className="relative z-10 flex w-full max-w-2xl flex-col items-center"
      >
        {/* Pulsating Glowing Heart Badge */}
        <motion.div
          animate={{ scale: [1, 1.14, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 via-[#c21840] to-[#c9a35c] shadow-[0_0_80px_rgba(255,110,150,.75)] ring-4 ring-pink-300/30"
        >
          <Heart size={42} className="fill-white text-white drop-shadow-md" />
        </motion.div>

        <div className="inline-flex items-center gap-2 rounded-full border border-[#c9a35c]/40 bg-[#1f0914]/85 px-5 py-1.5 shadow-[0_0_24px_rgba(201,163,92,.3)] backdrop-blur-md">
          <Sparkles size={13} className="text-[#f3d894]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.45em] text-[#f3d894]">
            The Final Reveal • Chapter 11 of 11
          </span>
          <Sparkles size={13} className="text-[#f3d894]" />
        </div>

        <h1 className="font-script mt-4 text-[60px] leading-[1.02] text-pink-50 script-glow sm:text-[84px]">
          Happy Birthday,<br />my Uhh ❤️
        </h1>

        <div className="my-6 flex items-center gap-4">
          <span className="h-px w-20 bg-gradient-to-r from-transparent to-[#c9a35c]" />
          <InfinityIcon size={22} className="text-[#f3d894]" />
          <span className="h-px w-20 bg-gradient-to-l from-transparent to-[#c9a35c]" />
        </div>

        <p className="max-w-xl font-serif2 text-[21px] italic leading-relaxed text-white/85 sm:text-[24px]">
          “The entire website was a journey made only for her — every curtain, every candle, every single word… was just another way of whispering <span className="font-bold text-pink-200">I love you, forever</span>.”
        </p>

        <p className="mt-4 max-w-lg text-[14.5px] leading-relaxed text-white/55">
          You walked through 11 little worlds I built with shaking hands and a heart full of love. If this made you smile even once, then my whole birthday mission is accomplished.
        </p>

        {/* Milestone Journey Chips */}
        <div className="my-6 flex flex-wrap items-center justify-center gap-2 text-[12px] font-medium uppercase tracking-[0.25em] text-white/45">
          {["envelope", "curtains", "gift", "cake", "memories", "quiz", "bubbles", "puzzle", "gold", "letter", "♥ you"].map((s, i) => (
            <span
              key={s}
              className={`rounded-full px-3 py-1 ${
                i === 10
                  ? "border border-pink-400/50 bg-pink-500/20 font-bold text-pink-200"
                  : "bg-white/[0.04] text-white/40"
              }`}
            >
              {s}
            </span>
          ))}
        </div>

        {/* Interactive Action Buttons */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {!music.url && (
            <button
              onClick={openMusic}
              className="btn-gold flex items-center gap-2 rounded-full px-7 py-3.5 text-[14px] font-bold shadow-[0_10px_35px_rgba(201,163,92,.45)]"
            >
              <Music size={15} /> Play our song for this moment
            </button>
          )}

          <button
            onClick={() => {
              confetti({
                particleCount: 260,
                spread: 150,
                origin: { y: 0.5 },
                colors: ["#ff8fb2", "#f3d894", "#fff3cf", "#7dd3a8", "#c084fc"],
              });
            }}
            className="btn-ghost flex items-center gap-2 rounded-full px-7 py-3.5 text-[14px] font-bold text-white shadow-md hover:scale-105"
          >
            <Heart size={16} className="fill-pink-400 text-pink-400" /> Shower more love ✨
          </button>

          <button
            onClick={onRestart}
            className="flex items-center gap-2 rounded-full px-6 py-3 text-[13.5px] text-white/50 transition-colors hover:text-white"
          >
            <RotateCcw size={14} /> Relive the whole journey
          </button>
        </div>

        <p className="mt-8 font-script text-[28px] text-[#f6e2aa] sm:text-[32px]">
          Forever yours — the one who loves you endlessly.
        </p>
        <p className="mt-1 text-[10.5px] uppercase tracking-[0.4em] text-white/30">
          Crafted with every heartbeat • Exclusively for Uhh
        </p>
      </motion.div>
    </div>
  );
}
