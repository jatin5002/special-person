import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { ChevronRight, Eraser, RotateCcw, Fingerprint } from "lucide-react";
import { SCRATCH_SECRET } from "../data/content";

export default function ScratchCard({ onNext }: { onNext: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [pct, setPct] = useState(0);
  const [done, setDone] = useState(false);
  const [scratching, setScratching] = useState(false);
  const doneRef = useRef(false);

  const paintCover = () => {
    const canvas = canvasRef.current!, wrap = wrapRef.current!;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    const W = wrap.clientWidth, H = wrap.clientHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.scale(dpr, dpr);
    // foil
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#8a6a2a"); g.addColorStop(0.2, "#e8c476"); g.addColorStop(0.35, "#fff2c8");
    g.addColorStop(0.5, "#c9a35c"); g.addColorStop(0.65, "#7a5212"); g.addColorStop(0.8, "#f3d894"); g.addColorStop(1, "#8a6a2a");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // texture dots
    ctx.fillStyle = "rgba(0,0,0,.08)";
    for (let i = 0; i < 900; i++) ctx.fillRect(Math.random() * W, Math.random() * H, 1.4, 1.4);
    // text
    ctx.fillStyle = "rgba(29,15,4,.85)";
    ctx.textAlign = "center";
    ctx.font = "700 17px 'Playfair Display', serif";
    ctx.fillText("SCRATCH  WITH  LOVE", W / 2, H / 2 - 8);
    ctx.font = "italic 500 14px 'Cormorant Garamond', serif";
    ctx.fillText("use your finger — slowly, jaan", W / 2, H / 2 + 16);
    // hearts pattern
    ctx.font = "16px serif"; ctx.fillStyle = "rgba(29,15,4,.25)";
    for (let x = 20; x < W; x += 46) for (let y = 22; y < H; y += 44) ctx.fillText("♥", x, y);
    // border shine
    ctx.strokeStyle = "rgba(255,243,207,.8)"; ctx.lineWidth = 3;
    ctx.strokeRect(6, 6, W - 12, H - 12);
  };

  useEffect(() => {
    paintCover();
    const onR = () => !doneRef.current && paintCover();
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  const scratchAt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const x = (clientX - r.left) * (canvas.width / r.width) / dpr;
    const y = (clientY - r.top) * (canvas.height / r.height) / dpr;
    // need to account for ctx scale: draw in css pixels
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 72, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const measure = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    const step = 12;
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let clear = 0, total = 0;
    for (let i = 3; i < img.length; i += 4 * step) { total++; if (img[i] === 0) clear++; }
    const p = Math.round((clear / total) * 100);
    setPct(p);
    if (p > 52 && !doneRef.current) {
      doneRef.current = true;
      setDone(true);
      confetti({ particleCount: 140, spread: 100, origin: { y: 0.6 }, colors: ["#f3d894", "#ff8fb2", "#fff3cf"] });
      // fade remaining cover
      canvas.style.transition = "opacity .8s ease";
      canvas.style.opacity = "0";
      setTimeout(() => { canvas.style.display = "none"; }, 850);
    }
  };

  const reset = () => {
    const canvas = canvasRef.current!;
    canvas.style.display = "block"; canvas.style.opacity = "1";
    doneRef.current = false; setDone(false); setPct(0);
    setTimeout(paintCover, 50);
  };

  return (
    <div className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-4 py-14">
      <p className="relative z-10 text-[11px] uppercase tracking-[0.4em] text-[#c9a35c]">Chapter 09 — sealed with gold</p>
      <h2 className="font-display relative z-10 mt-2 text-center text-3xl font-bold sm:text-4xl"><span className="gold-text">Scratch My Heart Open</span></h2>
      <p className="relative z-10 mt-2 flex items-center gap-1.5 font-serif2 text-[16px] italic text-white/60"><Fingerprint size={15} className="text-[#e8c476]" /> no tapping to cheat — only slow, tender scratching reveals it</p>

      <div className="relative z-10 mt-6 w-full max-w-[440px]">
        <div className="glass-lux rounded-[26px] p-3.5">
          <div ref={wrapRef} className="relative h-[380px] overflow-hidden rounded-2xl sm:h-[400px]">
            {/* secret underneath */}
            <div className="lux-paper absolute inset-0 flex flex-col items-center justify-center overflow-hidden px-6 py-6 text-center">
              <div className="paper-lines absolute inset-0 opacity-60" />
              <div className="relative">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#9a6b1f]">{SCRATCH_SECRET.over}</p>
                <p className="font-script mt-1 text-[32px] leading-tight text-[#7a1029]">{SCRATCH_SECRET.title}</p>
                <div className="mx-auto my-2 h-px w-24 bg-gradient-to-r from-transparent via-[#9a6b1f] to-transparent" />
                <p className="font-hand text-[19px] font-medium leading-[1.45] text-[#3d2308]">{SCRATCH_SECRET.body}</p>
                <p className="font-script mt-2 text-[22px] text-[#7a1029]">{SCRATCH_SECRET.sign}</p>
                <div className="mx-auto mt-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#a41236] to-[#5c0a1e] text-[20px] text-[#f3d894] shadow-lg">♥</div>
              </div>
            </div>
            {/* cover */}
            <canvas ref={canvasRef} className="absolute inset-0 cursor-crosshair touch-none"
              onPointerDown={(e) => { setScratching(true); (e.target as HTMLElement).setPointerCapture(e.pointerId); scratchAt(e.clientX, e.clientY); }}
              onPointerMove={(e) => { if (scratching) { scratchAt(e.clientX, e.clientY); } }}
              onPointerUp={() => { setScratching(false); measure(); }}
              onPointerLeave={() => { if (scratching) { setScratching(false); measure(); } }} />
          </div>
          <div className="flex items-center justify-between px-1.5 pt-3">
            <div className="flex items-center gap-2 text-[12px] text-white/55">
              <Eraser size={14} className="text-[#e8c476]" />
              {done ? <span className="font-semibold text-emerald-300">fully revealed — all yours</span> : <span><span className="font-bold text-[#f3d894]">{pct}%</span> revealed — keep going…</span>}
            </div>
            <button onClick={reset} className="btn-ghost flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] text-white/70"><RotateCcw size={12} /> Reseal</button>
          </div>
          {!done && (
            <div className="mx-1.5 mb-1 mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-[#c9a35c] to-pink-400 transition-all duration-300" style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>

        <AnimatePresence>
          {done && (
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mt-4 text-center">
              <p className="font-script text-[30px] text-pink-100 script-glow">see? my heart was always underneath.</p>
              <button onClick={onNext} className="btn-gold mx-auto mt-3 flex items-center gap-2 rounded-full px-7 py-3 text-[14px] font-bold">
                Read my full letter <ChevronRight size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
