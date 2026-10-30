import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronRight, Hand } from "lucide-react";

export default function CurtainReveal({ onNext }: { onNext: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="curtain-page relative flex min-h-[100svh] w-full flex-col overflow-hidden">
      {/* ===== STAGE BACKGROUND (Visible behind curtains) ===== */}
      <div className="relative flex min-h-full w-full flex-1 flex-col items-center justify-center px-6 py-8 text-center">
        {/* Overhead Spotlights */}
        <div className="spotlight-beam pointer-events-none absolute inset-x-0 top-0 mx-auto h-[80vh] w-full" />

        {/* Diagonal theatrical light beams */}
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              transition={{ delay: 1, duration: 1.8 }}
              className="pointer-events-none absolute -top-10 left-[15%] h-[95vh] w-36 origin-top -rotate-12 bg-gradient-to-b from-amber-100/30 via-pink-200/10 to-transparent blur-xl"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              transition={{ delay: 1.2, duration: 1.8 }}
              className="pointer-events-none absolute -top-10 right-[15%] h-[95vh] w-36 origin-top rotate-12 bg-gradient-to-b from-amber-100/30 via-pink-200/10 to-transparent blur-xl"
            />
          </>
        )}

        {/* Floating dust/starlight particles */}
        {Array.from({ length: 32 }).map((_, i) => (
          <span
            key={i}
            className="pointer-events-none absolute rounded-full bg-[#ffe9b8]"
            style={{
              width: 2 + (i % 3) * 1.5,
              height: 2 + (i % 3) * 1.5,
              left: `${(i * 31) % 100}%`,
              top: `${15 + (i * 29) % 75}%`,
              opacity: 0.5,
              animation: `twinkle ${2.4 + (i % 4)}s ease-in-out infinite`,
              animationDelay: `${(i % 7) * 0.4}s`,
            }}
          />
        ))}

        {/* Stage Content when curtains open */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 1.2, duration: 1.1, ease: [0.2, 0.8, 0.2, 1] }}
              className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center"
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c9a35c]/40 bg-[#1f0914]/80 px-4 py-1.5 shadow-[0_0_30px_rgba(201,163,92,.35)] backdrop-blur-md">
                <Sparkles size={14} className="text-[#f3d894]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.35em] text-[#f3d894]">
                  Chapter 02 • The Grand Opening
                </span>
                <Sparkles size={14} className="text-[#f3d894]" />
              </div>

              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                className="my-5 flex h-24 w-24 items-center justify-center rounded-full border border-pink-300/40 bg-gradient-to-br from-pink-500/30 via-[#c9a35c]/20 to-pink-900/40 shadow-[0_0_80px_rgba(255,130,170,.6)] backdrop-blur-xl"
              >
                <span className="text-5xl text-pink-200 drop-shadow-[0_0_20px_rgba(255,100,160,.8)]">♥</span>
              </motion.div>

              <h1 className="font-script text-[48px] leading-[1.05] text-pink-50 script-glow sm:text-[68px]">
                Ta-da, birthday girl ✨
              </h1>

              <div className="my-5 h-px w-36 bg-gradient-to-r from-transparent via-[#c9a35c] to-transparent" />

              <p className="max-w-lg font-serif2 text-[19px] italic leading-relaxed text-white/80 sm:text-[22px]">
                “The entire world dimmed its lights just so you could take the stage. Everything tonight was built for an audience of one — <span className="font-semibold text-pink-200">You, my Uhh</span>.”
              </p>

              <p className="mt-3 max-w-md text-[13.5px] leading-relaxed text-white/50">
                Welcome to your private palace of surprises. Every curtain that parts brings you closer to what my heart holds for you.
              </p>

              <div className="mt-8 flex flex-col items-center gap-3">
                <button
                  onClick={onNext}
                  className="btn-gold flex items-center gap-2.5 rounded-full px-9 py-4 text-[15px] font-bold tracking-wide shadow-[0_12px_40px_rgba(201,163,92,.5)]"
                >
                  Step into the surprise <ChevronRight size={18} />
                </button>
                <p className="text-[11px] uppercase tracking-[0.3em] text-white/30">
                  Chapter 03 awaits you
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== FULL-SCREEN VELVET CURTAINS ===== */}
      {/* Left Curtain */}
      <motion.div
        initial={{ x: "0%" }}
        animate={open ? { x: "-102%" } : { x: "0%" }}
        transition={{ duration: 2.8, ease: [0.75, 0, 0.15, 1] }}
        className="velvet-left pointer-events-auto absolute inset-y-0 left-0 z-30 w-[51%] border-r-4 border-[#9a6b1f] shadow-[15px_0_40px_rgba(0,0,0,.8)]"
      >
        {/* Vertical drape highlights */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-full flex-1"
              style={{
                background:
                  "linear-gradient(90deg, rgba(255,160,185,.16) 0%, rgba(0,0,0,0) 24%, rgba(0,0,0,.5) 50%, rgba(0,0,0,0) 76%, rgba(255,160,185,.12) 100%)",
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Right Curtain */}
      <motion.div
        initial={{ x: "0%" }}
        animate={open ? { x: "102%" } : { x: "0%" }}
        transition={{ duration: 2.8, ease: [0.75, 0, 0.15, 1] }}
        className="velvet-right pointer-events-auto absolute inset-y-0 right-0 z-30 w-[51%] border-l-4 border-[#9a6b1f] shadow-[-15px_0_40px_rgba(0,0,0,.8)]"
      >
        {/* Vertical drape highlights */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-full flex-1"
              style={{
                background:
                  "linear-gradient(90deg, rgba(255,160,185,.12) 0%, rgba(0,0,0,0) 24%, rgba(0,0,0,.5) 50%, rgba(0,0,0,0) 76%, rgba(255,160,185,.16) 100%)",
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* ===== GRAND TOP VALANCE / PELMET (Edge to Edge) ===== */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40">
        <div className="curtain-valance relative h-16 w-full sm:h-20">
          {/* Natural sagging string lights — bulbs stay upright and hang from the wire. */}
          <svg className="pointer-events-none absolute inset-x-0 bottom-[-3px] h-16 w-full overflow-visible" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 18 C90 72 150 72 235 24 S390 72 500 25 S650 72 765 24 S900 72 1000 18" fill="none" stroke="rgba(80,38,10,.95)" strokeWidth="5" />
            <path d="M0 17 C90 70 150 70 235 23 S390 70 500 24 S650 70 765 23 S900 70 1000 17" fill="none" stroke="#d6a95b" strokeWidth="2" />
          </svg>
          <div className="absolute inset-x-0 bottom-0 h-16">
            {Array.from({ length: 17 }).map((_, i) => {
              const x = i / 16;
              const y = 18 + 54 * (0.5 - 0.5 * Math.cos(x * Math.PI * 4));
              return <div key={i} className="absolute -translate-x-1/2" style={{ left: `${x*100}%`, top: `${Math.min(58,y)}px` }}>
                <div className="mx-auto h-2.5 w-[2px] bg-[#8d5c1b]" />
                <div className="h-4 w-4 rounded-full sm:h-5 sm:w-5" style={{ background:"radial-gradient(circle at 35% 30%, #fff8d8, #f1c86e 45%, #a46b1d 80%)", boxShadow:"0 0 12px rgba(255,220,135,.75), 0 4px 8px rgba(0,0,0,.55)" }} />
              </div>;
            })}
          </div>

          {/* Center Golden Plaque */}
          <div className="absolute left-1/2 top-1/2 z-50 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2.5 rounded-full border border-[#fef2d0]/60 bg-[#160710]/95 px-6 py-1.5 shadow-[0_0_35px_rgba(201,163,92,.5)] backdrop-blur-md">
            <Sparkles size={14} className="text-[#f6e2aa]" />
            <span className="font-display text-[12px] font-bold tracking-[0.35em] text-[#f6e2aa] sm:text-[13px]">
              FOR UHH • THE ROYAL THEATRE
            </span>
            <Sparkles size={14} className="text-[#f6e2aa]" />
          </div>
        </div>
      </div>

      {/* ===== CENTER INTERACTIVE PULL BUTTON (When curtains are closed) ===== */}
      {!open && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 text-center">
          <motion.button
            onClick={() => setOpen(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group relative flex flex-col items-center"
          >
            {/* Pulsating outer glow ring */}
            <motion.span
              animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
              className="absolute inset-[-18px] rounded-full border-2 border-[#f6e2aa]/60"
            />

            {/* Golden Wax Seal / Emblem */}
            <div
              className="flex h-24 w-24 items-center justify-center rounded-full sm:h-28 sm:w-28"
              style={{
                background: "radial-gradient(circle at 35% 30%, #fef2d0, #cca358 45%, #8a5a22 80%, #4a2d0c)",
                boxShadow: "0 20px 50px rgba(0,0,0,.9), 0 0 45px rgba(201,163,92,.7), inset 0 2px 6px rgba(255,255,255,.7)",
              }}
            >
              <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full border-2 border-[#4a2d0c]/40 bg-gradient-to-br from-[#f8e5b4] to-[#caa055] text-[#1f0f03] sm:h-24 sm:w-24">
                <Hand size={24} className="animate-bounce text-[#4a2d0c]" />
                <span className="mt-1 font-display text-[11px] font-extrabold uppercase tracking-widest text-[#2b1604]">
                  Pull Open
                </span>
              </div>
            </div>

            <div className="mt-5 rounded-full border border-[#c9a35c]/50 bg-black/75 px-6 py-2 shadow-2xl backdrop-blur-md">
              <p className="font-display text-[14px] font-bold tracking-wide text-[#f6e2aa]">
                Tap anywhere to open the grand curtains ✨
              </p>
            </div>
            <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-white/50">
              The grand show is waiting for you
            </p>
          </motion.button>
        </div>
      )}
    </div>
  );
}
