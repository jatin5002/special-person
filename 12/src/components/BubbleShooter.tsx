import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { ChevronRight, RotateCcw, Crosshair, Trophy, Sparkles } from "lucide-react";
import { BUBBLE_WISHES, FINAL_BUBBLE_SURPRISE } from "../data/content";

const COLORS = ["#ff6b9d", "#f3d894", "#7dd3fc", "#c084fc", "#fda4af"];
const R = 18;
const COLS = 9;
const ROW_H = R * 1.72;
const TOP = 34;

type Cell = { c: number } | null;
type Fly = { x: number; y: number; vx: number; vy: number; c: number };

function rrPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function makeGrid(rows: number): Cell[][] {
  const g: Cell[][] = [];
  for (let r = 0; r < 12; r++) {
    const cc = r % 2 === 1 ? COLS - 1 : COLS;
    g.push(
      Array.from({ length: cc }, () =>
        r < rows && Math.random() > 0.12 ? { c: Math.floor(Math.random() * 4) } : null
      )
    );
  }
  return g;
}

export default function BubbleShooter({ onNext }: { onNext: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [shots, setShots] = useState(22);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const [tick, setTick] = useState(0);

  const g = useRef({
    grid: makeGrid(4),
    fly: null as Fly | null,
    current: Math.floor(Math.random() * 4),
    next: Math.floor(Math.random() * 4),
    aim: -Math.PI / 2,
    W: 380,
    H: 480,
    done: false,
    score: 0,
    shots: 22,
    revealed: [] as number[],
  });

  const pos = (r: number, c: number, W: number) => {
    const usable = W - 2 * (R + 4);
    const step = usable / (COLS - 1);
    const off = r % 2 === 1 ? step / 2 : 0;
    return { x: R + 4 + off + c * step, y: TOP + r * ROW_H + R };
  };

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const parent = canvas.parentElement!;
    const W = Math.min(420, parent.clientWidth || 380);
    const H = Math.min(540, Math.max(450, window.innerHeight * 0.54));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.current.W = W;
    g.current.H = H;
    let raf = 0;

    const S = g.current;
    const sx = () => W / 2;
    const sy = () => H - 46;

    const neighborsOf = (r: number, c: number) => {
      const res: [number, number][] = [];
      const even = r % 2 === 0;
      const cand = even
        ? [
            [r, c - 1],
            [r, c + 1],
            [r - 1, c - 1],
            [r - 1, c],
            [r + 1, c - 1],
            [r + 1, c],
          ]
        : [
            [r, c - 1],
            [r, c + 1],
            [r - 1, c],
            [r - 1, c + 1],
            [r + 1, c],
            [r + 1, c + 1],
          ];
      for (const [rr, cc] of cand) {
        if (S.grid[rr] && S.grid[rr][cc] !== undefined) res.push([rr, cc]);
      }
      return res;
    };

    const settle = (fx: number, fy: number, color: number) => {
      let best: [number, number] | null = null;
      let bestD = Infinity;
      for (let r = 0; r < S.grid.length; r++) {
        for (let c = 0; c < S.grid[r].length; c++) {
          if (S.grid[r][c]) continue;
          const p = pos(r, c, W);
          const hasNeighbor =
            r === 0 || neighborsOf(r, c).some(([rr, cc]) => S.grid[rr][cc]);
          if (!hasNeighbor) continue;
          const d = Math.hypot(p.x - fx, p.y - fy);
          if (d < bestD) {
            bestD = d;
            best = [r, c];
          }
        }
      }
      if (!best) {
        best = [0, Math.max(0, Math.min(COLS - 1, Math.round((fx - R) / (2 * R))))];
      }
      const [br, bc] = best;
      S.grid[br][bc] = { c: color };

      // Flood match
      const seen = new Set<string>([`${br},${bc}`]);
      const stack = [[br, bc]];
      while (stack.length) {
        const [r, c] = stack.pop()!;
        for (const [rr, cc] of neighborsOf(r, c)) {
          const key = `${rr},${cc}`;
          if (!seen.has(key) && S.grid[rr][cc] && S.grid[rr][cc]!.c === color) {
            seen.add(key);
            stack.push([rr, cc]);
          }
        }
      }

      if (seen.size >= 3) {
        seen.forEach((k) => {
          const [r, c] = k.split(",").map(Number);
          S.grid[r][c] = null;
        });
        S.score += seen.size * 15;

        // Drop floating clusters
        const anchored = new Set<string>();
        for (let c = 0; c < S.grid[0].length; c++) {
          if (S.grid[0][c]) anchored.add(`0,${c}`);
        }
        const st2 = [...anchored].map((k) => k.split(",").map(Number) as [number, number]);
        while (st2.length) {
          const [r, c] = st2.pop()!;
          for (const [rr, cc] of neighborsOf(r, c)) {
            const key = `${rr},${cc}`;
            if (!anchored.has(key) && S.grid[rr][cc]) {
              anchored.add(key);
              st2.push([rr, cc]);
            }
          }
        }
        let dropped = 0;
        for (let r = 0; r < S.grid.length; r++) {
          for (let c = 0; c < S.grid[r].length; c++) {
            if (S.grid[r][c] && !anchored.has(`${r},${c}`)) {
              S.grid[r][c] = null;
              dropped++;
            }
          }
        }
        S.score += dropped * 25;
      }

      // Reveal hidden wishes
      BUBBLE_WISHES.forEach((w, i) => {
        if (S.score >= w.at * 5 && !S.revealed.includes(i)) {
          S.revealed = [...S.revealed, i];
          setRevealed([...S.revealed]);
          confetti({
            particleCount: 65,
            spread: 85,
            origin: { y: 0.6 },
            colors: ["#ff8fb2", "#f3d894"],
          });
        }
      });
      setScore(S.score);

      const remaining = S.grid.flat().filter(Boolean).length;
      if ((S.score >= 300 || remaining === 0) && !S.done) {
        S.done = true;
        setFinished(true);
        confetti({
          particleCount: 220,
          spread: 130,
          origin: { y: 0.5 },
          colors: ["#ff8fb2", "#f3d894", "#c084fc", "#7dd3fc"],
        });
      }
    };

    const drawBall = (x: number, y: number, color: string, a = 1) => {
      ctx.save();
      ctx.globalAlpha = a;
      const grd = ctx.createRadialGradient(x - 5, y - 6, 2, x, y, R);
      grd.addColorStop(0, "rgba(255,255,255,.95)");
      grd.addColorStop(0.28, color);
      grd.addColorStop(1, "rgba(0,0,0,.45)");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(x, y, R - 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.5)";
      ctx.lineWidth = 1.3;
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.85)";
      ctx.beginPath();
      ctx.ellipse(x - 5.5, y - 6.5, 4.4, 2.8, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const loop = () => {
      ctx.clearRect(0, 0, W, H);

      // Background
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "rgba(50,10,26,.6)");
      bg.addColorStop(1, "rgba(10,3,12,.4)");
      ctx.fillStyle = bg;
      rrPath(ctx, 0, 0, W, H, 24);
      ctx.fill();
      ctx.strokeStyle = "rgba(201,163,92,.3)";
      ctx.lineWidth = 1.5;
      rrPath(ctx, 1, 1, W - 2, H - 2, 24);
      ctx.stroke();

      // Draw Grid Bubbles
      for (let r = 0; r < S.grid.length; r++) {
        for (let c = 0; c < S.grid[r].length; c++) {
          if (S.grid[r][c]) {
            const p = pos(r, c, W);
            drawBall(p.x, p.y, COLORS[S.grid[r][c]!.c]);
          }
        }
      }

      // Flying Bubble
      if (S.fly) {
        S.fly.x += S.fly.vx;
        S.fly.y += S.fly.vy;
        if (S.fly.x < R + 3) {
          S.fly.x = R + 3;
          S.fly.vx *= -1;
        }
        if (S.fly.x > W - R - 3) {
          S.fly.x = W - R - 3;
          S.fly.vx *= -1;
        }
        let hit = false;
        if (S.fly.y <= TOP + R) hit = true;
        else {
          for (let r = 0; r < S.grid.length && !hit; r++) {
            for (let c = 0; c < S.grid[r].length; c++) {
              if (S.grid[r][c]) {
                const p = pos(r, c, W);
                if (Math.hypot(p.x - S.fly.x, p.y - S.fly.y) < 2 * R - 3) {
                  hit = true;
                  break;
                }
              }
            }
          }
        }
        if (hit) {
          settle(S.fly.x, S.fly.y, S.fly.c);
          S.fly = null;
          S.current = S.next;
          S.next = Math.floor(Math.random() * 5);
          setTick((t) => t + 1);
        } else {
          drawBall(S.fly.x, S.fly.y, COLORS[S.fly.c]);
        }
      }

      // Aiming Guide Line
      ctx.save();
      ctx.strokeStyle = "rgba(243,216,148,.45)";
      ctx.setLineDash([6, 9]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx(), sy());
      ctx.lineTo(sx() + Math.cos(S.aim) * 260, sy() + Math.sin(S.aim) * 260);
      ctx.stroke();
      ctx.restore();

      // Shooter Pedestal
      const bg2 = ctx.createRadialGradient(sx(), sy(), 3, sx(), sy(), 32);
      bg2.addColorStop(0, "#fff3cf");
      bg2.addColorStop(0.5, "#c9a35c");
      bg2.addColorStop(1, "#5e3f0e");
      ctx.fillStyle = bg2;
      ctx.beginPath();
      ctx.arc(sx(), sy(), 26, 0, Math.PI * 2);
      ctx.fill();

      if (!S.fly) drawBall(sx(), sy() - 2, COLORS[S.current]);

      // Next Bubble Preview
      drawBall(W - 28, H - 28, COLORS[S.next], 0.9);
      ctx.fillStyle = "rgba(255,255,255,.6)";
      ctx.font = "10px Inter";
      ctx.textAlign = "center";
      ctx.fillText("NEXT", W - 28, H - 50);

      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);

  const aimAt = (clientX: number, clientY: number) => {
    const c = canvasRef.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    const sx = r.width / 2,
      sy = r.height - 46;
    const a = Math.atan2(clientY - r.top - sy, clientX - r.left - sx);
    g.current.aim = Math.max(-Math.PI + 0.15, Math.min(-0.15, a));
    setTick((t) => t + 1);
  };

  const shoot = () => {
    const S = g.current;
    if (S.fly || S.done || S.shots <= 0) return;
    S.fly = {
      x: S.W / 2,
      y: S.H - 48,
      vx: Math.cos(S.aim) * 9.2,
      vy: Math.sin(S.aim) * 9.2,
      c: S.current,
    };
    S.shots -= 1;
    setShots(S.shots);
  };

  const reset = () => {
    const S = g.current;
    S.grid = makeGrid(4);
    S.fly = null;
    S.done = false;
    S.score = 0;
    S.shots = 22;
    S.revealed = [];
    S.current = Math.floor(Math.random() * 4);
    S.next = Math.floor(Math.random() * 4);
    setScore(0);
    setShots(22);
    setRevealed([]);
    setFinished(false);
  };

  void tick;

  return (
    <div className="stage-page relative flex min-h-[100svh] w-full flex-col items-center justify-start overflow-hidden px-4 py-16 sm:py-20">
      <div className="spotlight-beam pointer-events-none absolute inset-x-0 top-0 mx-auto h-[70vh] w-full" />

      {/* Header */}
      <div className="relative z-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#c9a35c]/35 bg-[#170712]/80 px-4 py-1.5 shadow-[0_0_24px_rgba(201,163,92,.25)] backdrop-blur-md">
          <Sparkles size={13} className="text-[#f3d894]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.35em] text-[#f3d894]">
            Chapter 07 • Bubble Arcade
          </span>
          <Sparkles size={13} className="text-[#f3d894]" />
        </div>
        <h2 className="font-display mt-3 text-3xl font-bold sm:text-5xl">
          <span className="gold-text">Pop Your Way to My Heart</span>
        </h2>
        <p className="mt-2 font-serif2 text-[18px] italic text-white/70">
          Move your finger/mouse to aim • Tap to shoot • Match 3 same colours to pop wishes!
        </p>
      </div>

      {/* Score & Controls Bar */}
      <div className="relative z-10 my-4 flex items-center gap-3">
        <span className="flex items-center gap-2 rounded-full border border-[#c9a35c]/40 bg-black/50 px-5 py-2 text-[13.5px] font-bold text-[#f3d894] shadow-md backdrop-blur-md">
          <Trophy size={15} /> {score} Points
        </span>
        <span className="flex items-center gap-2 rounded-full border border-white/20 bg-black/50 px-5 py-2 text-[13.5px] font-bold text-white/90 shadow-md backdrop-blur-md">
          <Crosshair size={15} /> {shots} Shots Left
        </span>
        <button
          onClick={reset}
          className="btn-ghost rounded-full p-2.5 text-white/80 shadow-md"
          title="Restart Game"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Canvas Arcade Area */}
      <div className="relative z-10 my-3 w-full max-w-[420px]">
        <canvas
          ref={canvasRef}
          className="mx-auto block cursor-crosshair touch-none rounded-[24px] shadow-[0_30px_80px_rgba(0,0,0,.75)]"
          onPointerMove={(e) => aimAt(e.clientX, e.clientY)}
          onPointerDown={(e) => aimAt(e.clientX, e.clientY)}
          onPointerUp={(e) => {
            aimAt(e.clientX, e.clientY);
            shoot();
          }}
        />

        {shots <= 0 && !finished && (
          <p className="mt-3 text-center text-[13.5px] text-pink-200">
            Out of bubbles!{" "}
            <button onClick={reset} className="font-bold underline">
              Tap here to reload & play again
            </button>{" "}
            💕
          </p>
        )}
      </div>

      {/* Unlocked Romantic Wishes */}
      <div className="relative z-10 mt-4 grid w-full max-w-xl gap-2.5">
        <AnimatePresence>
          {revealed.map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="flex items-start gap-3.5 rounded-2xl border border-pink-300/30 bg-gradient-to-r from-pink-500/15 via-[#c9a35c]/10 to-transparent p-4 shadow-lg backdrop-blur-md"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-[#c9a35c] text-[18px] text-[#1d0f04] shadow-md">
                ♥
              </span>
              <div>
                <p className="text-[14px] font-bold text-pink-100">{BUBBLE_WISHES[i].title}</p>
                <p className="mt-0.5 text-[13.5px] leading-relaxed text-white/70">
                  {BUBBLE_WISHES[i].text}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {finished && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-lux rounded-3xl p-6 text-center sm:p-8"
          >
            <div className="mx-auto mb-2 inline-flex items-center gap-2 rounded-full border border-[#f3d894]/40 bg-[#240c1a]/90 px-4 py-1 text-[11px] font-bold uppercase tracking-widest text-[#f3d894]">
              Special Level Complete ✨
            </div>
            <p className="font-script mt-2 text-[36px] text-pink-100 script-glow sm:text-[44px]">
              {FINAL_BUBBLE_SURPRISE.title}
            </p>
            <p className="mx-auto mt-2 max-w-md font-serif2 text-[17px] italic text-white/75">
              {FINAL_BUBBLE_SURPRISE.text}
            </p>
            <button
              onClick={onNext}
              className="btn-gold mx-auto mt-6 flex items-center gap-2 rounded-full px-8 py-3.5 text-[14.5px] font-bold shadow-[0_10px_35px_rgba(201,163,92,.45)]"
            >
              Next: Our Photo Puzzle <ChevronRight size={17} />
            </button>
          </motion.div>
        )}

        {!finished && (
          <button
            onClick={onNext}
            className="btn-ghost mx-auto mt-2 rounded-full px-7 py-2.5 text-[13px] text-white/60 hover:text-white"
          >
            Take me to the next surprise →
          </button>
        )}
      </div>
    </div>
  );
}
