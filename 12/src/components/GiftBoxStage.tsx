import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Gift, ChevronRight, Sparkles } from "lucide-react";

export default function GiftBoxStage({ onNext }: { onNext: () => void }) {
  const [stage, setStage] = useState<"idle" | "shaking" | "burst" | "revealed">("idle");

  const openBox = () => {
    if (stage !== "idle") return;
    setStage("shaking");
    setTimeout(() => {
      setStage("burst");
      confetti({
        particleCount: 200,
        spread: 120,
        origin: { y: 0.6 },
        colors: ["#ff8fb2", "#f3d894", "#fff3cf", "#7dd3a8", "#c084fc"],
      });
      setTimeout(() => {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.45 }, colors: ["#ff8fb2", "#f3d894"] });
      }, 500);
    }, 950);
    setTimeout(() => setStage("revealed"), 1900);
  };

  const burst = stage === "burst" || stage === "revealed";
  const wish = "Happy Birthday Laddooo, — my heart lives outside my chest, and it’s you babuu.";

  return (
    <div className="gift-page stage-page relative flex min-h-[calc(100svh-58px)] w-full flex-col items-center justify-start overflow-hidden px-4 py-10 sm:py-12">
      <div className="spotlight-beam pointer-events-none absolute inset-x-0 top-0 mx-auto h-[70vh] w-full" />

      {/* Header */}
      <div className="relative z-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#c9a35c]/35 bg-[#170712]/80 px-4 py-1.5 shadow-[0_0_24px_rgba(201,163,92,.25)] backdrop-blur-md">
          <Sparkles size={13} className="text-[#f3d894]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.35em] text-[#f3d894]">
            Chapter 03 • The Royal Gift
          </span>
          <Sparkles size={13} className="text-[#f3d894]" />
        </div>
        <h2 className="font-display mt-3 text-3xl font-bold sm:text-5xl">
          <span className="gold-text">Something Wrapped in Starlight</span>
        </h2>
        <p className="mt-2 font-serif2 text-[18px] italic text-white/70">
          {burst
            ? "Look what was glowing inside for you ✨"
            : "Go on, jaan… tap the gift box. It's been waiting all day for your touch."}
        </p>
      </div>

      {/* Gift Box Stage */}
      <div className="gift-scene relative z-10 my-3 flex h-[285px] w-full max-w-lg items-end justify-center sm:my-4 sm:h-[305px]">
        {/* Floor Glow */}
        <div className="absolute bottom-2 left-1/2 h-16 w-[320px] -translate-x-1/2 rounded-[100%] bg-emerald-500/20 blur-2xl" />
        <div className="absolute bottom-4 left-1/2 h-10 w-[240px] -translate-x-1/2 rounded-[100%] bg-[#f3d894]/25 blur-xl" />

        {/* Light Beam on Burst */}
        <AnimatePresence>
          {burst && (
            <motion.div
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: [0, 1, 0.75], scaleY: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: [0.2, 0.8, 0.2, 1] }}
              className="pointer-events-none absolute bottom-[115px] left-1/2 z-[1] h-[250px] w-[120px] origin-bottom -translate-x-1/2 overflow-hidden rounded-t-[55%]"
              style={{
                background:
                  "linear-gradient(to top, rgba(255,235,190,.9), rgba(255,170,200,.4) 45%, transparent 85%)",
                clipPath: "polygon(43% 100%, 57% 100%, 82% 0%, 18% 0%)",
                filter: "blur(6px)",
              }}
            />
          )}
        </AnimatePresence>

        {/* Flash Burst */}
        <AnimatePresence>
          {stage === "burst" && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 0.95, 0], scale: [0, 2.6, 3.2] }}
              transition={{ duration: 1 }}
              className="pointer-events-none absolute bottom-[128px] left-1/2 z-[6] h-36 w-[210px] -translate-x-1/2 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,240,210,.95), rgba(255,170,200,.6) 40%, transparent 70%)",
              }}
            />
          )}
        </AnimatePresence>

        {/* Floating Heart & Constellations */}
        <AnimatePresence>
          {burst && (
            <motion.div
              initial={{ y: 140, scale: 0, opacity: 0 }}
              animate={{ y: stage === "revealed" ? -10 : 50, scale: stage === "revealed" ? 1 : 0.65, opacity: 1 }}
              transition={{ type: "spring", stiffness: 75, damping: 12, delay: 0.35 }}
              className="absolute bottom-[145px] left-1/2 z-20 -translate-x-1/2 sm:bottom-[155px]"
            >
              <motion.div
                animate={{ y: [0, -14, 0], rotate: [0, -5, 5, 0] }}
                transition={{ repeat: Infinity, duration: 3.4, ease: "easeInOut" }}
                className="relative flex h-32 w-32 items-center justify-center"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-500/50 via-amber-300/30 to-[#c9a35c]/40 blur-2xl" />
                <span className="text-[92px] leading-none text-pink-200 drop-shadow-[0_0_35px_rgba(255,100,160,.9)]">
                  ♥
                </span>
                {[...Array(14)].map((_, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1.3, 0.3],
                      x: Math.cos((i / 14) * Math.PI * 2) * (65 + (i % 3) * 20),
                      y: Math.sin((i / 14) * Math.PI * 2) * (65 + (i % 3) * 20) - 20,
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      delay: i * 0.18,
                      ease: "easeOut",
                    }}
                    className="absolute text-[14px]"
                    style={{
                      color: i % 3 === 0 ? "#ffd7e4" : i % 3 === 1 ? "#f3d894" : "#7dd3a8",
                    }}
                  >
                    {i % 3 === 2 ? "✦" : "♥"}
                  </motion.span>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3D Gift Box Structure */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
          <motion.div
            animate={
              stage === "idle"
                ? { y: [0, -8, 0], rotate: 0 }
                : stage === "shaking"
                ? {
                    x: [0, -7, 7, -6, 6, -3, 3, 0],
                    rotate: [0, -2, 2, -1.5, 1.5, 0],
                    y: 0,
                  }
                : stage === "burst"
                ? { scaleY: [1, 0.9, 1.06, 1], scaleX: [1, 1.06, 0.96, 1] }
                : { y: 4 }
            }
            transition={
              stage === "idle"
                ? { repeat: Infinity, duration: 3.2, ease: "easeInOut" }
                : stage === "shaking"
                ? { duration: 0.95 }
                : stage === "burst"
                ? { duration: 0.7 }
                : { duration: 0.4 }
            }
            className="relative cursor-pointer"
            onClick={openBox}
          >
            {/* Box Inner Glow */}
            <motion.div
              animate={burst ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute -top-24 left-1/2 z-[4] h-32 w-44 -translate-x-1/2 rounded-t-full bg-gradient-to-t from-amber-100/80 via-pink-200/55 to-transparent blur-md"
            />

            {/* Box Body */}
            <div className="relative z-10 h-[140px] w-[220px] sm:h-[150px] sm:w-[250px]">
              <div
                className="absolute inset-0 rounded-b-[20px] border border-emerald-800/80"
                style={{
                  background:
                    "linear-gradient(180deg, #12634d 0%, #0c4838 45%, #062b21 100%)",
                  boxShadow:
                    "0 35px 70px rgba(0,0,0,.65), inset 0 -18px 32px rgba(0,0,0,.5), inset 0 8px 18px rgba(255,255,255,.14)",
                }}
              >
                <div
                  className="absolute inset-0 rounded-b-[20px] opacity-60"
                  style={{
                    background:
                      "repeating-linear-gradient(90deg, rgba(255,255,255,.045) 0 10px, transparent 10px 22px)",
                  }}
                />
                {/* Vertical Gold Ribbon */}
                <div
                  className="absolute inset-y-0 left-1/2 w-12 -translate-x-1/2"
                  style={{
                    background:
                      "linear-gradient(90deg, #9a6b1f, #f3d894 30%, #fff3cf 50%, #f3d894 70%, #9a6b1f)",
                    boxShadow: "0 0 24px rgba(243,216,148,.45)",
                  }}
                />
                {/* Inner Rim Light */}
                <motion.div
                  animate={burst ? { opacity: 1 } : { opacity: 0 }}
                  className="absolute inset-x-2 top-0 h-3.5 rounded-full bg-amber-100/90 blur-[6px]"
                />
              </div>
            </div>

            {/* Box Lid */}
            <motion.div
              animate={
                stage === "idle" || stage === "shaking"
                  ? { y: 0, x: 0, rotate: 0, opacity: 1 }
                  : {
                      y: [0, -250, -220],
                      x: [0, -75, -170],
                      rotate: [0, -32, -80],
                      opacity: [1, 1, 0],
                    }
              }
              transition={
                burst
                  ? { duration: 1.5, times: [0, 0.55, 1], ease: [0.2, 0.9, 0.3, 1] }
                  : { duration: 0.3 }
              }
              className="absolute -top-[44px] left-1/2 z-20 h-[46px] w-[252px] -translate-x-1/2 sm:w-[286px]"
            >
              <div
                className="absolute inset-0 rounded-[14px] border border-[#f3d894]/45"
                style={{
                  background:
                    "linear-gradient(180deg, #188663 0%, #0f5d47 45%, #083b2d 100%)",
                  boxShadow:
                    "0 18px 40px rgba(0,0,0,.6), inset 0 6px 12px rgba(255,255,255,.2)",
                }}
              >
                <div
                  className="absolute inset-y-0 left-1/2 w-12 -translate-x-1/2"
                  style={{
                    background: "linear-gradient(90deg, #9a6b1f, #fff3cf 50%, #9a6b1f)",
                  }}
                />
                <div className="absolute inset-x-0 top-0 h-[10px] rounded-t-[14px] bg-gradient-to-b from-white/25 to-transparent" />
              </div>

              {/* Silk Bow */}
              <div className="absolute -top-10 left-1/2 flex -translate-x-1/2 items-end">
                <motion.div
                  animate={stage === "idle" ? { rotate: [-8, 8, -8] } : { rotate: -20 }}
                  transition={
                    stage === "idle"
                      ? { repeat: Infinity, duration: 2.6, ease: "easeInOut" }
                      : { duration: 0.5 }
                  }
                  className="h-11 w-14 rounded-full rounded-br-[4px] border-2 border-[#f3d894]"
                  style={{
                    background: "linear-gradient(135deg, #ffe9b0, #c9a35c 55%, #8a5a22)",
                    boxShadow: "0 6px 16px rgba(0,0,0,.45)",
                  }}
                />
                <div
                  className="z-10 -mx-2.5 h-8 w-8 rounded-full shadow-[0_0_20px_rgba(243,216,148,.8)]"
                  style={{
                    background:
                      "radial-gradient(circle at 35% 30%, #fff3cf, #c9a35c 60%, #8a5a22)",
                  }}
                />
                <motion.div
                  animate={stage === "idle" ? { rotate: [8, -8, 8] } : { rotate: 20 }}
                  transition={
                    stage === "idle"
                      ? { repeat: Infinity, duration: 2.6, ease: "easeInOut" }
                      : { duration: 0.5 }
                  }
                  className="h-11 w-14 rounded-full rounded-bl-[4px] border-2 border-[#f3d894]"
                  style={{
                    background: "linear-gradient(225deg, #ffe9b0, #c9a35c 55%, #8a5a22)",
                    boxShadow: "0 6px 16px rgba(0,0,0,.45)",
                  }}
                />
              </div>
            </motion.div>

            {/* Ripple Pulse around box when idle */}
            {stage === "idle" && (
              <motion.span
                animate={{ scale: [1, 1.25, 1], opacity: [0.65, 0, 0.65] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                className="pointer-events-none absolute inset-[-16px] z-0 rounded-[26px] border-2 border-[#f3d894]/50"
              />
            )}
          </motion.div>
        </div>

        {/* Petals Shower on Burst */}
        {burst && (
          <div className="pointer-events-none absolute inset-0 z-30">
            {[...Array(22)].map((_, i) => (
              <span
                key={i}
                className="absolute top-[-25px] text-[15px]"
                style={{
                  left: `${5 + (i * 43) % 90}%`,
                  animation: `petalFall ${3.5 + (i % 4)}s linear ${i * 0.2}s infinite`,
                  color: i % 3 === 0 ? "#ffb3c8" : i % 3 === 1 ? "#f3d894" : "#7dd3a8",
                }}
              >
                {i % 2 ? "❀" : "♥"}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Bottom Reveal Area */}
      <div className="relative z-10 mt-1 flex min-h-[96px] w-full max-w-xl flex-col items-center">
        {stage === "idle" && (
          <button
            onClick={openBox}
            className="btn-gold flex items-center gap-2.5 rounded-full px-9 py-4 text-[15px] font-bold shadow-[0_12px_40px_rgba(201,163,92,.45)]"
          >
            <Gift size={18} /> Open it, love
          </button>
        )}

        {stage === "shaking" && (
          <p className="mt-4 animate-pulse font-display text-[14px] font-semibold uppercase tracking-[0.3em] text-[#f3d894]">
            Something magical is about to burst out…
          </p>
        )}

        <AnimatePresence>
          {stage === "revealed" && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-lux flex w-full flex-col items-center rounded-3xl p-6 text-center sm:p-8"
            >
              <p className="max-w-lg font-script text-[34px] leading-[1.18] text-pink-100 script-glow sm:text-[44px]">
                {wish.split(" ").map((w, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + i * 0.07 }}
                    className="inline-block"
                  >
                    {w}&nbsp;
                  </motion.span>
                ))}
              </p>

              <div className="mt-6">
                <button
                  onClick={onNext}
                  className="btn-gold flex items-center gap-2 rounded-full px-8 py-3.5 text-[14.5px] font-bold shadow-[0_10px_30px_rgba(201,163,92,.45)]"
                >
                  There’s cake waiting for you <ChevronRight size={17} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
