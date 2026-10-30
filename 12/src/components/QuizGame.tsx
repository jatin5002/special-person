import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Heart, ChevronRight, RotateCcw, Sparkles, Frown } from "lucide-react";
import { QUIZ } from "../data/content";

const ROMANTIC_WRONG_MESSAGES = [
  "Nahi cutie… par tumhara guess kitna pyara tha 🥺 Phir se socho!",
  "Galat jawab, sahi insaan! Ek aur try lo meri jaan ❤️",
  "Aww… aankhen band karo aur dil se socho, answer wahi hai 💫",
  "Nope baby… mera dil kehta hai tum agla wala pakka sahi dogi 😚",
];

export default function QuizGame({ onNext }: { onNext: () => void }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [wrongShake, setWrongShake] = useState(0);
  const [done, setDone] = useState(false);

  const q = QUIZ[idx];

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.correct) {
      setScore((s) => s + 1);
      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#ff8fb2", "#f3d894", "#fff3cf"],
      });
      setTimeout(() => {
        if (idx + 1 >= QUIZ.length) setDone(true);
        else {
          setIdx(idx + 1);
          setPicked(null);
        }
      }, 2100);
    } else {
      setWrongShake((w) => w + 1);
    }
  };

  const retryQ = () => setPicked(null);

  return (
    <div className="stage-page relative flex min-h-[100svh] w-full flex-col items-center justify-start overflow-hidden px-4 py-16 sm:py-20">
      <div className="spotlight-beam pointer-events-none absolute inset-x-0 top-0 mx-auto h-[70vh] w-full" />

      {/* Header */}
      <div className="relative z-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#c9a35c]/35 bg-[#170712]/80 px-4 py-1.5 shadow-[0_0_24px_rgba(201,163,92,.25)] backdrop-blur-md">
          <Sparkles size={13} className="text-[#f3d894]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.35em] text-[#f3d894]">
            Chapter 06 • Love Quiz
          </span>
          <Sparkles size={13} className="text-[#f3d894]" />
        </div>
        <h2 className="font-display mt-3 text-3xl font-bold sm:text-5xl">
          <span className="gold-text">How Well Do You Know Us?</span>
        </h2>
        <p className="mt-2 font-serif2 text-[18px] italic text-white/70">
          A little game of questions made only for you, my Uhh.
        </p>
      </div>

      {!done ? (
        <div className="relative z-10 my-8 w-full max-w-xl">
          {/* Progress Indicator */}
          <div className="mb-4 flex items-center gap-3">
            <div className="flex flex-1 gap-2">
              {QUIZ.map((_, i) => (
                <div
                  key={i}
                  className={`h-2.5 flex-1 rounded-full transition-all duration-500 ${
                    i < idx
                      ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.5)]"
                      : i === idx
                      ? "bg-gradient-to-r from-[#f3d894] via-pink-400 to-[#c9a35c] shadow-[0_0_10px_rgba(243,216,148,.6)]"
                      : "bg-white/10"
                  }`}
                />
              ))}
            </div>
            <span className="flex items-center gap-1.5 rounded-full border border-pink-300/35 bg-pink-500/15 px-3.5 py-1 text-[12px] font-bold text-pink-200">
              <Heart size={13} className="fill-pink-400 text-pink-400" /> {score}/{QUIZ.length}
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
              className="glass-lux rounded-3xl p-6 sm:p-8"
            >
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.25em] text-[#c9a35c]">
                <span>Question {idx + 1} of {QUIZ.length}</span>
                <span className="text-white/40">pick your heart</span>
              </div>

              <h3 className="font-display mt-3 text-[22px] font-bold leading-snug text-[#fff9e8] sm:text-[26px]">
                {q.q}
              </h3>

              <div className="mt-6 grid gap-3">
                {q.options.map((op, i) => {
                  const isRight = picked !== null && i === q.correct;
                  const isWrongPick = picked === i && i !== q.correct;
                  return (
                    <button
                      key={i}
                      onClick={() => pick(i)}
                      disabled={picked !== null && picked === q.correct}
                      className={`flex items-center gap-3.5 rounded-2xl border px-5 py-4 text-left text-[14.5px] font-medium transition-all duration-300 ${
                        isRight
                          ? "border-emerald-300/70 bg-emerald-400/20 text-emerald-100 shadow-[0_0_30px_rgba(52,211,153,.35)] scale-[1.01]"
                          : isWrongPick
                          ? "shake border-pink-400/70 bg-pink-500/20 text-pink-100"
                          : picked !== null
                          ? "border-white/5 bg-white/[0.02] text-white/35"
                          : "border-white/10 bg-white/[0.04] text-white/85 hover:border-[#c9a35c]/60 hover:bg-[#c9a35c]/10 hover:translate-x-1"
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold transition-all ${
                          isRight
                            ? "bg-emerald-400 text-emerald-950 shadow-md"
                            : isWrongPick
                            ? "bg-pink-400 text-pink-950"
                            : "bg-white/10 text-white/70"
                        }`}
                      >
                        {isRight ? "♥" : String.fromCharCode(65 + i)}
                      </span>
                      <span className="leading-relaxed">{op}</span>
                    </button>
                  );
                })}
              </div>

              {/* Feedback Message */}
              <AnimatePresence>
                {picked !== null && (
                  <motion.div
                    key={`fb-${idx}-${picked}-${wrongShake}`}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-5 rounded-2xl p-4 text-[14.5px] leading-relaxed ${
                      picked === q.correct
                        ? "border border-emerald-300/35 bg-emerald-400/15 text-emerald-100"
                        : "border border-pink-300/30 bg-pink-500/15 text-pink-100"
                    }`}
                  >
                    {picked === q.correct ? (
                      <p>
                        <span className="font-bold text-emerald-200">Bilkul Sahi, Meri Jaan! </span>
                        {q.love}
                      </p>
                    ) : (
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="flex items-start gap-2.5">
                          <Frown size={18} className="mt-0.5 shrink-0 text-pink-300" />
                          <span>{ROMANTIC_WRONG_MESSAGES[wrongShake % ROMANTIC_WRONG_MESSAGES.length]}</span>
                        </p>
                        <button
                          onClick={retryQ}
                          className="btn-ghost shrink-0 rounded-full px-5 py-2 text-[12.5px] font-bold text-white/90"
                        >
                          Try again
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        /* Game Completed Card */
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-lux relative z-10 my-8 w-full max-w-xl rounded-3xl p-8 text-center sm:p-10"
        >
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 via-[#c21840] to-[#c9a35c] shadow-[0_0_50px_rgba(255,120,160,.6)]">
            <Heart size={36} className="fill-white text-white" />
          </div>

          <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-[#c9a35c]">
            Quiz Complete • {score}/{QUIZ.length} Hearts
          </p>

          <p className="font-script mt-2 text-[42px] leading-tight text-pink-100 script-glow sm:text-[50px]">
            You passed the test of my heart
          </p>

          <p className="mx-auto mt-3 max-w-lg font-serif2 text-[18px] italic leading-relaxed text-white/75">
            {score === QUIZ.length
              ? "A perfect score — just like you. Beautiful, wonderful, and the only one for me."
              : "Every single answer in this world leads right back to you. You are my forever answer, Uhh."}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={onNext}
              className="btn-gold flex items-center gap-2 rounded-full px-8 py-3.5 text-[14.5px] font-bold shadow-[0_10px_35px_rgba(201,163,92,.45)]"
            >
              Pop some bubbles <ChevronRight size={17} />
            </button>
            <button
              onClick={() => {
                setIdx(0);
                setPicked(null);
                setScore(0);
                setDone(false);
              }}
              className="btn-ghost flex items-center gap-2 rounded-full px-6 py-3.5 text-[13.5px] text-white/80"
            >
              <RotateCcw size={15} /> Play again
            </button>
          </div>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-[12.5px] text-white/40">
            <Sparkles size={13} className="text-[#f3d894]" /> Reward Unlocked: Unlimited forehead kisses for life
          </p>
        </motion.div>
      )}
    </div>
  );
}
