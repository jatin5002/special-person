import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, RotateCcw, Pause, Play, Feather, Sparkles } from "lucide-react";
import { LOVE_LETTER_TEXT } from "../data/content";

export default function LoveLetter({ onNext }: { onNext: () => void }) {
  const [count, setCount] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [complete, setComplete] = useState(false);
  const timer = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const full = LOVE_LETTER_TEXT;

  useEffect(() => {
    if (!playing) return;
    timer.current = window.setInterval(() => {
      setCount((c) => {
        if (c + 3 >= full.length) {
          setPlaying(false);
          setComplete(true);
          if (timer.current) clearInterval(timer.current);
          return full.length;
        }
        return c + 3;
      });
    }, 28);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing, full.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [count]);

  const start = () => {
    setStarted(true);
    setPlaying(true);
  };
  const replay = () => {
    setCount(0);
    setComplete(false);
    setPlaying(true);
    setStarted(true);
  };

  const shown = full.slice(0, count);

  return (
    <div className="stage-page relative flex min-h-[100svh] w-full flex-col items-center justify-start overflow-hidden px-4 py-16 sm:py-20">
      {/* Warm Ambient Desk Lamp & Spotlight */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(75% 50% at 50% 25%, rgba(255,200,140,.18), rgba(200,80,120,.06) 50%, transparent 75%)",
        }}
      />
      <div className="spotlight-beam pointer-events-none absolute inset-x-0 top-0 mx-auto h-[70vh] w-full" />

      {/* Header */}
      <div className="relative z-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#c9a35c]/35 bg-[#170712]/80 px-4 py-1.5 shadow-[0_0_24px_rgba(201,163,92,.25)] backdrop-blur-md">
          <Sparkles size={13} className="text-[#f3d894]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.35em] text-[#f3d894]">
            Chapter 10 • In My Own Hand
          </span>
          <Sparkles size={13} className="text-[#f3d894]" />
        </div>
        <h2 className="font-display mt-3 text-3xl font-bold sm:text-5xl">
          <span className="gold-text">A Letter That Writes Itself</span>
        </h2>
        <p className="mt-2 font-serif2 text-[18px] italic text-white/70">
          A quiet dark room • A warm desk lamp • Just my truest words finding you
        </p>
      </div>

      {/* Parchment Desk Setting */}
      <div className="relative z-10 my-6 w-full max-w-2xl">
        <div className="lux-paper relative overflow-hidden rounded-[28px] p-2 sm:p-3 shadow-[0_45px_110px_rgba(0,0,0,.75)]">
          <div className="paper-lines relative rounded-[20px] border border-[#9a6b1f]/30 px-6 py-8 sm:px-10 sm:py-10">
            {/* Letter Header Ribbon */}
            <div className="mb-6 flex items-center justify-between border-b border-[#9a6b1f]/20 pb-3">
              <span className="flex items-center gap-2 font-display text-[12px] font-bold uppercase tracking-[0.25em] text-[#8a5a22]">
                <Feather size={15} /> Written from the heart
              </span>
              <span className="rounded-full border border-[#9a6b1f]/40 bg-[#9a6b1f]/10 px-3 py-0.5 font-serif2 text-[12.5px] italic text-[#8a5a22]">
                sealed forever • for uhh
              </span>
            </div>

            {/* Letter Content Writing Area */}
            <div
              ref={scrollRef}
              className="max-h-[50vh] min-h-[320px] overflow-y-auto pr-2 sm:max-h-[52vh]"
              style={{ scrollbarWidth: "thin" }}
            >
              {!started ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                  <Feather size={32} className="text-[#8a5a22]/70 mb-2" />
                  <p className="font-script text-[42px] text-[#7a1029]">A sealed letter for Uhh…</p>
                  <p className="mt-2 font-serif2 text-[17px] italic text-[#6a3c10]">
                    Press the button below and watch each word write itself on paper.
                  </p>
                </div>
              ) : (
                <p className="whitespace-pre-line font-hand text-[22px] font-semibold leading-[1.6] text-[#2c1705] sm:text-[25px]">
                  {shown}
                  {!complete && (
                    <span className="ml-1 inline-block h-[24px] w-[2.5px] animate-pulse bg-[#7a1029]" />
                  )}
                </p>
              )}
            </div>

            {/* Letter Footer Seal */}
            <div className="mt-6 flex items-center justify-between border-t border-[#9a6b1f]/20 pt-4">
              <div className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#8a5a22]">
                {complete
                  ? "Letter complete • Sealed forever with all my love"
                  : started
                  ? `${Math.round((count / full.length) * 100)}% written…`
                  : "Not yet broken"}
              </div>

              <AnimatePresence>
                {complete && (
                  <motion.div
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: -6 }}
                    transition={{ type: "spring", stiffness: 200, damping: 13 }}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#a41236] to-[#5c0a1e] font-script text-[26px] text-[#fef2d0] shadow-[0_10px_28px_rgba(122,10,40,.6)] ring-2 ring-[#f3d894]/60"
                  >
                    U♥
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Buttons Controls */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {!started ? (
            <button
              onClick={start}
              className="btn-gold rounded-full px-9 py-3.5 text-[15px] font-bold shadow-[0_10px_35px_rgba(201,163,92,.45)]"
            >
              Break the wax seal & read
            </button>
          ) : !complete ? (
            <>
              <button
                onClick={() => setPlaying(!playing)}
                className="btn-gold flex items-center gap-2 rounded-full px-7 py-3 text-[14px] font-bold shadow-md"
              >
                {playing ? (
                  <>
                    <Pause size={15} /> Pause the pen
                  </>
                ) : (
                  <>
                    <Play size={15} /> Keep writing
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setCount(full.length);
                  setPlaying(false);
                  setComplete(true);
                }}
                className="btn-ghost rounded-full px-6 py-3 text-[13.5px] text-white/80"
              >
                Reveal all words
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onNext}
                className="btn-gold flex items-center gap-2.5 rounded-full px-9 py-4 text-[15px] font-bold shadow-[0_12px_40px_rgba(201,163,92,.5)]"
              >
                The Grand Finale Awaits <ChevronRight size={17} />
              </button>
              <button
                onClick={replay}
                className="btn-ghost flex items-center gap-2 rounded-full px-6 py-3.5 text-[13.5px] text-white/80"
              >
                <RotateCcw size={15} /> Watch handwriting again
              </button>
            </>
          )}
        </div>

        {complete && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-center text-[12px] uppercase tracking-[0.3em] text-white/40"
          >
            Take a deep breath, my love — the final surprise is next
          </motion.p>
        )}
      </div>
    </div>
  );
}
