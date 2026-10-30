import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Mic,
  MicOff,
  Wind,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Calendar,
  Clock,
  Heart,
  Sun,
} from "lucide-react";

type Candle = { id: number; color: string; lit: boolean; smoke: boolean };

const INITIAL_CANDLES: Candle[] = [
  { id: 0, color: "#ff6b9d", lit: true, smoke: false },
  { id: 1, color: "#c9a35c", lit: true, smoke: false },
  { id: 2, color: "#7dd3fc", lit: true, smoke: false },
  { id: 3, color: "#c084fc", lit: true, smoke: false },
  { id: 4, color: "#fda4af", lit: true, smoke: false },
];

type BirthdayElapsed = { days: number; hours: number; minutes: number; seconds: number };

const BIRTHDAY_START = new Date(2005, 9, 31, 0, 0, 0, 0).getTime();

function getBirthdayElapsed(): BirthdayElapsed {
  const diff = Math.max(0, Date.now() - BIRTHDAY_START);
  const second = 1000;
  const minute = second * 60;
  const hour = minute * 60;
  const day = hour * 24;
  return {
    days: Math.floor(diff / day),
    hours: Math.floor(diff / hour),
    minutes: Math.floor(diff / minute),
    seconds: Math.floor(diff / second),
  };
}

export default function CakeStage({ onNext }: { onNext: () => void }) {
  const [candles, setCandles] = useState<Candle[]>(INITIAL_CANDLES);
  const [micOn, setMicOn] = useState(false);
  const [micError, setMicError] = useState("");
  const [blowPower, setBlowPower] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [lived, setLived] = useState(() => getBirthdayElapsed());

  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const holdRef = useRef<number | null>(null);

  const litCount = candles.filter((c) => c.lit).length;
  const allOut = litCount === 0;

  useEffect(() => {
    if (allOut && !celebrating) {
      setCelebrating(true);
      stopMic();
      confetti({
        particleCount: 240,
        spread: 120,
        origin: { y: 0.55 },
        colors: ["#f3d894", "#ff8fb2", "#fff3cf", "#c084fc", "#38ef7d"],
      });
      setTimeout(() => {
        confetti({ particleCount: 140, spread: 90, origin: { y: 0.4 } });
      }, 700);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allOut]);

  const stopMic = () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setMicOn(false);
    setBlowPower(0);
  };

  useEffect(() => () => stopMic(), []);
  useEffect(() => {
    const tick = () => setLived(getBirthdayElapsed());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);


  const startMic = async () => {
    setMicError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      setMicOn(true);
      let cooldown = 0;
      const loop = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setBlowPower(Math.min(1, avg / 75));
        if (avg > 40 && Date.now() - cooldown > 700) {
          cooldown = Date.now();
          setCandles((prev) => {
            const idx = prev.findIndex((c) => c.lit);
            if (idx === -1) return prev;
            const next = [...prev];
            next[idx] = { ...next[idx], lit: false, smoke: true };
            return next;
          });
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
    } catch {
      setMicError("Mic access was blocked — koi baat nahi, tap any flame or hold the button!");
    }
  };

  const blowOne = () => {
    setCandles((prev) => {
      const idx = prev.findIndex((c) => c.lit);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], lit: false, smoke: true };
      return next;
    });
  };

  const startHold = () => {
    if (allOut) return;
    setHoldProgress(0);
    const t0 = Date.now();
    holdRef.current = window.setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / 1600);
      setHoldProgress(p);
      if (p >= 1) {
        setCandles((prev) => prev.map((c) => ({ ...c, lit: false, smoke: true })));
        if (holdRef.current) clearInterval(holdRef.current);
        holdRef.current = null;
        return;
      }
      if (p > 0.25 && Math.random() > 0.5) blowOne();
    }, 80);
  };

  const endHold = () => {
    if (holdRef.current) clearInterval(holdRef.current);
    holdRef.current = null;
    setHoldProgress(0);
  };

  const reset = () => {
    setCandles(INITIAL_CANDLES);
    setCelebrating(false);
  };

  return (
    <div className="stage-page relative flex min-h-[100svh] w-full flex-col items-center justify-start overflow-hidden px-4 py-16 sm:py-20">
      <div className="spotlight-beam pointer-events-none absolute inset-x-0 top-0 mx-auto h-[70vh] w-full" />

      {/* Header */}
      <div className="relative z-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#c9a35c]/35 bg-[#170712]/80 px-4 py-1.5 shadow-[0_0_24px_rgba(201,163,92,.25)] backdrop-blur-md">
          <Sparkles size={13} className="text-[#f3d894]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.35em] text-[#f3d894]">
            Chapter 04 • The Royal Cake
          </span>
          <Sparkles size={13} className="text-[#f3d894]" />
        </div>
        <h2 className="font-display mt-3 text-3xl font-bold sm:text-5xl">
          <span className="gold-text">Make a Birthday Wish For Uhh</span>
        </h2>
        <p className="mt-2 font-serif2 text-[18px] italic text-white/70">
          Close your eyes, think of your sweetest dream, and blow out the candles.
        </p>
      </div>

      {/* ===== 3D BIRTHDAY CAKE (Clean of numbers/text on cake itself) ===== */}
      <div className="relative z-10 my-4 select-none" style={{ perspective: "1200px" }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
          className="relative mx-auto w-[290px] sm:w-[350px]"
          style={{ transform: "rotateX(8deg)", transformStyle: "preserve-3d" }}
        >
          {/* Top Tier Strawberry/Heart Crown */}
          <div className="relative z-30 mx-auto -mb-2 flex w-fit items-center gap-2 rounded-full border border-pink-300/40 bg-[#2b0c1e]/90 px-4 py-1.5 shadow-[0_0_30px_rgba(255,130,170,.4)] backdrop-blur-md">
            <span className="text-[12px] text-pink-300">♥</span>
            <span className="font-script text-[22px] leading-none text-pink-100">
              Happy Birthday Uhh
            </span>
            <span className="text-[12px] text-pink-300">♥</span>
          </div>

          {/* 5 Interactive Candles */}
          <div className="relative z-30 mx-auto flex w-[86%] items-end justify-center gap-2 sm:gap-3">
            {candles.map((c, i) => (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, y: -40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1, type: "spring", stiffness: 180, damping: 12 }}
                onClick={() =>
                  setCandles((prev) =>
                    prev.map((p) => (p.id === c.id ? { ...p, lit: false, smoke: true } : p))
                  )
                }
                className="group flex flex-col items-center rounded-xl p-1 transition-transform hover:scale-105 active:scale-95"
                title={c.lit ? "Tap flame to blow out" : "Extinguished"}
              >
                {/* Flame or Smoke */}
                <div className="relative flex h-[56px] flex-col items-center justify-end">
                  {c.lit ? (
                    <>
                      <div className="flame relative h-7 w-[18px]" />
                      <div className="h-1.5 w-[2.5px] bg-[#2b1807]" />
                    </>
                  ) : (
                    <>
                      {c.smoke && <div className="smoke absolute -top-10 h-12 w-3 rounded-full" />}
                      <div className="h-1.5 w-[2.5px] bg-[#1a0f04] opacity-50" />
                    </>
                  )}
                </div>

                {/* Candle Stick */}
                <div
                  className="relative h-[68px] w-[14px] overflow-hidden rounded-md border border-black/25 shadow-md sm:w-[16px]"
                  style={{
                    background: `repeating-linear-gradient(135deg, ${c.color} 0 6px, rgba(255,255,255,.9) 6px 12px)`,
                    opacity: c.lit ? 1 : 0.5,
                  }}
                >
                  {!c.lit && <div className="absolute inset-0 bg-black/30" />}
                  <div className="absolute inset-y-0 left-0 w-[4px] bg-white/35" />
                </div>
              </motion.button>
            ))}
          </div>

          {/* Tier 3 (Top Cream Tier) */}
          <div className="relative z-20 mx-auto -mt-1 w-[60%]">
            <div className="h-5 rounded-t-full bg-gradient-to-b from-white via-[#fff0f4] to-[#f8c0d2]" />
            <div className="flex justify-between px-1">
              {[...Array(9)].map((_, i) => (
                <span key={i} className="h-3 w-3 rounded-b-full bg-gradient-to-b from-[#fff0f4] to-[#f2a8c0]" />
              ))}
            </div>
            <div
              className="h-[60px] rounded-b-2xl border border-pink-200/30 bg-gradient-to-b from-[#d94f7e] via-[#ad234f] to-[#730e28]"
              style={{
                boxShadow:
                  "inset -14px 0 24px rgba(0,0,0,.45), inset 10px 0 20px rgba(255,255,255,.25), 0 8px 20px rgba(0,0,0,.4)",
              }}
            >
              <div className="flex h-full items-center justify-center gap-2 text-pink-200/90">
                {[...Array(6)].map((_, i) => (
                  <span key={i} className="text-[13px]">
                    {i % 2 ? "✦" : "♥"}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Tier 2 (Middle Golden Chocolate Tier) */}
          <div className="relative z-10 mx-auto -mt-1 w-[80%]">
            <div className="h-5 rounded-t-full bg-gradient-to-b from-white via-[#fff5dc] to-[#f2d89f]" />
            <div className="flex justify-between px-1">
              {[...Array(12)].map((_, i) => (
                <span key={i} className="h-3.5 w-3.5 rounded-b-full bg-gradient-to-b from-[#fff5dc] to-[#e4be72]" />
              ))}
            </div>
            <div
              className="h-[68px] rounded-b-2xl border border-[#f3d894]/40 bg-gradient-to-b from-[#8f5a1e] via-[#6a3d0d] to-[#3d2005]"
              style={{
                boxShadow:
                  "inset -18px 0 30px rgba(0,0,0,.55), inset 12px 0 24px rgba(255,235,190,.2), 0 10px 24px rgba(0,0,0,.45)",
              }}
            >
              <div className="flex h-full items-center justify-center gap-3 text-[#f3d894]">
                {[...Array(8)].map((_, i) => (
                  <span key={i} className="h-2 w-2 rotate-45 border border-[#f3d894]/80 bg-[#f3d894]/30" />
                ))}
              </div>
            </div>
          </div>

          {/* Tier 1 (Bottom Royal Velvet Tier) */}
          <div className="relative mx-auto -mt-1 w-full">
            <div className="h-6 rounded-t-full bg-gradient-to-b from-white via-[#ffeef3] to-[#f4b5cb]" />
            <div className="flex justify-between px-2">
              {[...Array(15)].map((_, i) => (
                <span key={i} className="h-4 w-4 rounded-b-full bg-gradient-to-b from-[#ffeef3] to-[#efa0bd]" />
              ))}
            </div>
            <div
              className="relative h-[82px] overflow-hidden rounded-b-3xl border border-pink-200/35 bg-gradient-to-b from-[#e85b85] via-[#a81f47] to-[#54081c]"
              style={{
                boxShadow:
                  "inset -24px 0 40px rgba(0,0,0,.55), inset 16px 0 30px rgba(255,255,255,.2), 0 14px 30px rgba(0,0,0,.5)",
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "repeating-linear-gradient(90deg, rgba(255,255,255,.07) 0 12px, transparent 12px 28px)",
                }}
              />
              <div className="relative flex h-full items-center justify-center gap-3">
                {[...Array(10)].map((_, i) => (
                  <span key={i} className="text-[14px] text-pink-200/80">
                    {i % 2 === 0 ? "❀" : "✦"}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Gold Platter Base */}
          <div className="mx-auto -mt-1 h-5 w-[108%] -translate-x-[4%] rounded-[100%] border border-[#f3d894]/60 bg-gradient-to-b from-[#f3d894] via-[#a47629] to-[#452805] shadow-[0_20px_45px_rgba(0,0,0,.75)]" />
          <div className="mx-auto mt-1 h-4 w-[75%] rounded-[100%] bg-black/70 blur-md" />
        </motion.div>
      </div>

      

      {/* Blow Power Meter (If mic is enabled) */}
      {micOn && (
        <div className="relative z-10 mb-4 w-full max-w-sm">
          <div className="mb-1.5 flex justify-between text-[11px] font-bold uppercase tracking-[0.25em] text-white/60">
            <span>Blow Power</span>
            <span className="text-[#f3d894]">{Math.round(blowPower * 100)}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/10 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-300 via-[#f3d894] to-pink-400 transition-all duration-100"
              style={{ width: `${blowPower * 100}%` }}
            />
          </div>
          <p className="mt-1.5 text-center text-[12px] text-sky-200/90">
            Mic is listening — blow gently into your phone/laptop mic! 🌬️
          </p>
        </div>
      )}

      {/* ===== BLOW CANDLES INTERACTIVE CONTROLS ===== */}
      <div className="relative z-10 mt-2 flex w-full max-w-xl flex-col items-center gap-3">
        {!allOut ? (
          <>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={micOn ? stopMic : startMic}
                className={`flex items-center gap-2 rounded-full px-5 py-3 text-[13.5px] font-bold transition-all ${
                  micOn
                    ? "bg-emerald-400 text-emerald-950 shadow-[0_0_25px_rgba(52,211,153,.5)]"
                    : "btn-ghost text-[#f3d894]"
                }`}
              >
                {micOn ? (
                  <>
                    <Mic size={16} /> Listening… blow now!
                  </>
                ) : (
                  <>
                    <MicOff size={16} /> Blow with Mic
                  </>
                )}
              </button>

              <button
                onClick={blowOne}
                className="btn-ghost flex items-center gap-2 rounded-full px-5 py-3 text-[13.5px] font-bold text-white/90"
              >
                <Wind size={16} /> Blow one flame
              </button>

              <button
                onMouseDown={startHold}
                onMouseUp={endHold}
                onMouseLeave={endHold}
                onTouchStart={(e) => {
                  e.preventDefault();
                  startHold();
                }}
                onTouchEnd={endHold}
                className="btn-gold relative flex items-center gap-2 overflow-hidden rounded-full px-6 py-3 text-[13.5px] font-bold shadow-lg"
              >
                <span
                  className="absolute inset-y-0 left-0 bg-black/25 transition-all"
                  style={{ width: `${holdProgress * 100}%` }}
                />
                <Wind size={16} /> Hold to blow all
              </button>
            </div>

 {/* ===== BIRTHDAY DATE & DAYS MILESTONE SECTION (Dedicated below cake) ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="relative z-10 my-4 w-full max-w-xl lg:max-w-3xl"
      >
        <div className="glass-lux rounded-3xl p-5 sm:p-6 text-center">
          {/* Header pill */}
          <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-[#f3d894]/40 bg-[#240c1a]/90 px-4 py-1 shadow-sm">
            <Calendar size={13} className="text-[#f3d894]" />
            <span className="font-display text-[12px] font-bold tracking-widest text-[#f3d894]">
              BIRTHDAY MILESTONE FOR UHH
            </span>
          </div>

          <p className="font-serif2 text-[17px] italic text-white/85 sm:text-[19px]">
            “The world has been infinitely brighter and softer since the day you arrived.”
          </p>

          {/* Live birthday elapsed-time counter */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
            <div className="min-w-0 rounded-2xl border border-amber-300/20 bg-amber-500/10 p-3 text-center">
              <Sun size={18} className="mx-auto text-amber-300" />
              <div className="font-display mt-1 whitespace-nowrap text-[clamp(.92rem,2.2vw,1.35rem)] font-bold leading-none tracking-[-0.045em] tabular-nums text-[#fef2d0]">{lived.days.toLocaleString("en-IN")}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-200/75">Days of Sunshine ☀️</div>
            </div>
            <div className="min-w-0 rounded-2xl border border-pink-300/20 bg-pink-500/10 p-3 text-center">
              <Clock size={18} className="mx-auto text-pink-300" />
              <div className="font-display mt-1 whitespace-nowrap text-[clamp(.92rem,2.2vw,1.35rem)] font-bold leading-none tracking-[-0.045em] tabular-nums text-pink-100">{lived.hours.toLocaleString("en-IN")}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-pink-200/75">Hours of Magic ✨</div>
            </div>
            <div className="min-w-0 rounded-2xl border border-purple-300/20 bg-purple-500/10 p-3 text-center">
              <Heart size={18} className="mx-auto text-purple-300" />
              <div className="font-display mt-1 whitespace-nowrap text-[clamp(.92rem,2.2vw,1.35rem)] font-bold leading-none tracking-[-0.045em] tabular-nums text-purple-100">{lived.minutes.toLocaleString("en-IN")}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-purple-200/75">Minutes of Love 💕</div>
            </div>
            <div className="min-w-0 rounded-2xl border border-rose-300/20 bg-rose-500/10 p-3 text-center">
              <span className="mx-auto block text-[18px] leading-[18px] text-rose-200">⏱</span>
              <div className="font-display mt-1 whitespace-nowrap text-[clamp(.92rem,2.2vw,1.35rem)] font-bold leading-none tracking-[-0.045em] tabular-nums text-rose-100">{lived.seconds.toLocaleString("en-IN")}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-rose-200/75">Seconds of Magic ✨</div>
            </div>
          </div>
          <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-white/35">Counting continuously from 31 October 2005</p>
        </div>
      </motion.div>

            <p className="text-center text-[12.5px] text-white/50">
              Tip: You can also tap each flickering flame directly {micError && <span className="text-amber-300">• {micError}</span>}
            </p>
          </>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="glass-lux w-full rounded-3xl p-6 text-center sm:p-8"
            >
              <div className="mx-auto mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-4 py-1 text-[11px] font-bold uppercase tracking-widest text-emerald-300">
                All 5 Flames Blown Out • Wish Locked ✨
              </div>

              <p className="font-script mt-2 text-[36px] leading-tight text-[#fff7db] script-glow sm:text-[46px]">
                Your wish is sealed in the heavens
              </p>

              <p className="mx-auto mt-2 max-w-lg font-serif2 text-[18px] italic leading-relaxed text-white/80">
                Close your eyes for one quiet second, Uhh. Every candle carried my silent prayer for your happiness. You deserve the softest, most magical year ahead.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  onClick={onNext}
                  className="btn-gold flex items-center gap-2 rounded-full px-8 py-3.5 text-[14.5px] font-bold shadow-[0_10px_30px_rgba(201,163,92,.45)]"
                >
                  Walk down memory lane <ChevronRight size={17} />
                </button>
                <button
                  onClick={reset}
                  className="btn-ghost flex items-center gap-2 rounded-full px-5 py-3 text-[13.5px] text-white/80"
                >
                  <RotateCcw size={15} /> Relight candles
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
