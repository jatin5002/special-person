import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Volume2, VolumeX, Target, RotateCcw, ChevronRight, Trophy, Sparkles } from "lucide-react";
import { BUBBLE_WISHES, FINAL_BUBBLE_SURPRISE } from "../data/content";

/* realistic latex palette — base / highlight / rim-light (backlit translucency) / deep edge */
const PAL = [
  { base: "#a41236", hi: "#e0708c", mid: "#7c0d27", edge: "#3a0412", glow: "#ff5f7e" }, // oxblood rose
  { base: "#8a5a22", hi: "#f0d19a", mid: "#5e3a10", edge: "#2a1906", glow: "#ffbb52" }, // rose gold
  { base: "#0f5c48", hi: "#63bda3", mid: "#0a3b2f", edge: "#03211a", glow: "#3fd6a4" }, // emerald
  { base: "#1c356b", hi: "#7fa4e0", mid: "#122450", edge: "#070f26", glow: "#5f8cff" }, // midnight
  { base: "#5c2260", hi: "#c184c8", mid: "#3b1340", edge: "#1a0620", glow: "#c56bd6" }, // plum
  { base: "#b8842f", hi: "#ffe9b0", mid: "#7a5212", edge: "#2f1f04", glow: "#ffd066" }, // champagne
];

type Balloon = {
  x: number; y: number; vx: number; vy: number; r: number; c: number; phase: number;
  kind: "normal" | "gold" | "heart"; squash: number; rot: number; dead: boolean; wob: number;
};
type Bullet = { x: number; y: number; vx: number; vy: number; px: number; py: number };
type Shred = { x: number; y: number; vx: number; vy: number; life: number; max: number; col: string; size: number; rot: number; vr: number };
type Casing = { x: number; y: number; vx: number; vy: number; rot: number; vr: number; life: number };
type Puff = { x: number; y: number; vx: number; vy: number; life: number; r: number };

type Pop = { id: number; xp: number; yp: number; text: string; title: string; tone: string };

const MAG = 6;
const GOAL = 14;

export default function BalloonShooter({ onNext }: { onNext: () => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [popped, setPopped] = useState(0);
  const [ammo, setAmmo] = useState(MAG);
  const [reloading, setReloading] = useState(false);
  const [combo, setCombo] = useState(0);
  const [muted, setMuted] = useState(false);
  const [pops, setPops] = useState<Pop[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const G = useRef({
    balloons: [] as Balloon[], bullets: [] as Bullet[], shreds: [] as Shred[],
    casings: [] as Casing[], puffs: [] as Puff[],
    aim: -Math.PI / 2, px: 0, py: 0, lock: false,
    recoil: 0, flash: 0, ammo: MAG, reloading: false, reloadT: 0,
    score: 0, popped: 0, combo: 0, lastPop: 0, escaped: 0,
    done: false, muted: false, W: 600, H: 560, t: 0, spawnIn: 400,
  }).current;
  const audioRef = useRef<AudioContext | null>(null);

  useEffect(() => { G.muted = muted; }, [muted, G]);

  /* ---------- sfx ---------- */
  const ac = () => {
    if (!audioRef.current) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (Ctor) audioRef.current = new Ctor();
    }
    return audioRef.current;
  };
  const noise = (dur: number) => {
    const ctx = ac(); if (!ctx) return null;
    const buf = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * dur)), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = ctx.createBufferSource(); src.buffer = buf;
    return src;
  };
  const sfxShot = () => {
    const ctx = ac(); if (!ctx || G.muted) return;
    const t = ctx.currentTime;
    const src = noise(0.16); if (!src) return;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.setValueAtTime(2600, t); lp.frequency.exponentialRampToValueAtTime(320, t + 0.15);
    const gn = ctx.createGain(); gn.gain.setValueAtTime(0.5, t); gn.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    src.connect(lp).connect(gn).connect(ctx.destination); src.start(t); src.stop(t + 0.17);
    const o = ctx.createOscillator(); o.type = "sine"; o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(46, t + 0.12);
    const og = ctx.createGain(); og.gain.setValueAtTime(0.34, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
    o.connect(og).connect(ctx.destination); o.start(t); o.stop(t + 0.14);
  };
  const sfxPop = (low = false) => {
    const ctx = ac(); if (!ctx || G.muted) return;
    const t = ctx.currentTime;
    const src = noise(0.07); if (!src) return;
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = low ? 700 : 1500; bp.Q.value = 1.1;
    const gn = ctx.createGain(); gn.gain.setValueAtTime(0.42, t); gn.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    src.connect(bp).connect(gn).connect(ctx.destination); src.start(t); src.stop(t + 0.09);
  };
  const sfxClick = () => {
    const ctx = ac(); if (!ctx || G.muted) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = "square"; o.frequency.setValueAtTime(1500, t);
    const g2 = ctx.createGain(); g2.gain.setValueAtTime(0.07, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    o.connect(g2).connect(ctx.destination); o.start(t); o.stop(t + 0.05);
  };

  /* ---------- game ---------- */
  useEffect(() => {
    const canvas = canvasRef.current!, wrap = wrapRef.current!;
    const ctx = canvas.getContext("2d")!;
    let dpr = Math.min(2, window.devicePixelRatio || 1);
    const measure = () => {
      G.W = Math.min(660, Math.max(300, wrap.clientWidth));
      G.H = Math.min(620, Math.max(420, Math.floor(window.innerHeight * 0.56)));
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = G.W * dpr; canvas.height = G.H * dpr;
      canvas.style.width = G.W + "px"; canvas.style.height = G.H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    measure();
    window.addEventListener("resize", measure);
    G.px = G.W / 2; G.py = 60;

    let popupId = 0;
    const pushPop = (x: number, y: number, title: string, text: string, tone: string) => {
      const id = ++popupId;
      setPops((p) => [...p.slice(-2), { id, xp: x / G.W, yp: y / G.H, title, text, tone }]);
      setLog((l) => [text, ...l].slice(0, 3));
      window.setTimeout(() => setPops((p) => p.filter((q) => q.id !== id)), 2800);
    };

    const muzzle = () => {
      const gx = G.W / 2, gy = G.H - 34;
      const L = 96 - G.recoil * 9;
      return { x: gx + Math.cos(G.aim) * L, y: gy + Math.sin(G.aim) * L };
    };

    const spawn = () => {
      const r = 26 + Math.random() * 12;
      const roll = Math.random();
      const kind: Balloon["kind"] = roll > 0.92 ? "gold" : roll > 0.8 ? "heart" : "normal";
      G.balloons.push({
        x: 40 + Math.random() * (G.W - 80), y: G.H + r * 2.6,
        vx: (Math.random() - 0.5) * 0.5, vy: -(0.62 + Math.random() * 0.5),
        r, c: Math.floor(Math.random() * PAL.length), phase: Math.random() * 9,
        kind, squash: 0, rot: 0, dead: false, wob: 0.5 + Math.random() * 0.7,
      });
    };

    const pop = (b: Balloon) => {
      b.dead = true;
      const pal = b.kind === "gold" ? PAL[1] : PAL[b.c];
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2 + Math.random();
        const sp = 1.6 + Math.random() * 3.4;
        G.shreds.push({
          x: b.x, y: b.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1,
          life: 0, max: 40 + Math.random() * 26, col: Math.random() > 0.55 ? pal.base : pal.mid,
          size: 2 + Math.random() * 5, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
        });
      }
      for (let i = 0; i < 8; i++) {
        const a = Math.random() * Math.PI * 2;
        G.puffs.push({ x: b.x, y: b.y, vx: Math.cos(a) * 1.5, vy: Math.sin(a) * 1.5, life: 0, r: 3 + Math.random() * 7 });
      }
      const now = performance.now();
      G.combo = now - G.lastPop < 1600 ? G.combo + 1 : 1;
      G.lastPop = now;
      G.score += 12 + (G.combo - 1) * 6 + (b.kind === "gold" ? 30 : b.kind === "heart" ? 18 : 0);
      G.popped++;
      setScore(G.score); setPopped(G.popped); setCombo(G.combo);
      sfxPop(b.r > 34);

      const wish = BUBBLE_WISHES[(G.popped - 1) % BUBBLE_WISHES.length];
      const tone = b.kind === "gold" ? "gold" : b.kind === "heart" ? "rose" : "plain";
      pushPop(b.x, b.y, b.kind === "gold" ? "golden wish" : b.kind === "heart" ? "heart wish" : wish.title, wish.text, tone);
      if (b.kind === "gold") {
        confetti({ particleCount: 90, spread: 90, origin: { y: 0.5 }, colors: ["#f3d894", "#fff3cf", "#e8c476"] });
      } else if (b.kind === "heart") {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.55 }, colors: ["#ff8fb2", "#ff5f7e"] });
      }
      if (G.popped >= GOAL && !G.done) {
        G.done = true; setFinished(true);
        confetti({ particleCount: 240, spread: 130, origin: { y: 0.45 }, colors: ["#f3d894", "#ff8fb2", "#fff3cf", "#63bda3"] });
        setTimeout(() => confetti({ particleCount: 120, spread: 100, origin: { y: 0.6 } }), 800);
      }
    };

    const fire = () => {
      if (G.done || G.reloading) return;
      if (G.ammo <= 0) { startReload(); return; }
      const m = muzzle();
      G.bullets.push({ x: m.x, y: m.y, px: m.x, py: m.y, vx: Math.cos(G.aim) * 15, vy: Math.sin(G.aim) * 15 });
      G.ammo--; setAmmo(G.ammo);
      G.recoil = 1; G.flash = 1;
      G.puffs.push({ x: m.x, y: m.y, vx: 0, vy: -0.3, life: 0, r: 12 });
      G.casings.push({ x: m.x - 8, y: m.y + 4, vx: -1.6 - Math.random(), vy: -2.4, rot: 0, vr: 0.3, life: 0 });
      sfxShot();
      if (G.ammo === 0) startReload();
    };
    const startReload = () => {
      if (G.reloading) return;
      G.reloading = true; setReloading(true); G.reloadT = 0;
      sfxClick();
      window.setTimeout(() => { sfxClick(); }, 380);
      window.setTimeout(() => { G.ammo = MAG; G.reloading = false; setAmmo(MAG); setReloading(false); }, 1150);
    };

    /* ================= drawing ================= */
    const drawBackdrop = () => {
      const sky = ctx.createLinearGradient(0, 0, 0, G.H);
      sky.addColorStop(0, "#241033"); sky.addColorStop(0.45, "#3a1428"); sky.addColorStop(1, "#150810");
      ctx.fillStyle = sky; ctx.fillRect(0, 0, G.W, G.H);
      const sun = ctx.createRadialGradient(G.W * 0.5, G.H * 1.02, 10, G.W * 0.5, G.H * 1.02, G.H * 0.72);
      sun.addColorStop(0, "rgba(255,186,120,.35)"); sun.addColorStop(1, "transparent");
      ctx.fillStyle = sun; ctx.fillRect(0, 0, G.W, G.H);
      for (let i = 0; i < 3; i++) {
        const cy = 70 + i * 130, cx = ((G.t * (0.05 + i * 0.02) + i * 260) % (G.W + 340)) - 170;
        const cg = ctx.createRadialGradient(cx, cy, 4, cx, cy, 120);
        cg.addColorStop(0, "rgba(255,220,200,.09)"); cg.addColorStop(1, "transparent");
        ctx.fillStyle = cg; ctx.beginPath(); ctx.ellipse(cx, cy, 150, 40, 0, 0, Math.PI * 2); ctx.fill();
      }
      for (let i = 0; i < 26; i++) {
        const sx = (i * 137.2) % G.W, sy = (i * 71.7) % (G.H * 0.7);
        ctx.globalAlpha = 0.15 + 0.5 * Math.abs(Math.sin(G.t * 0.0015 + i));
        ctx.fillStyle = "#fff0d0"; ctx.beginPath(); ctx.arc(sx, sy, i % 4 === 0 ? 1.5 : 1, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const bodyPath = (r: number, heart: boolean) => {
      ctx.beginPath();
      if (heart) {
        ctx.moveTo(0, r * 0.92);
        ctx.bezierCurveTo(-r * 1.25, r * 0.05, -r * 0.72, -r * 1.12, 0, -r * 0.34);
        ctx.bezierCurveTo(r * 0.72, -r * 1.12, r * 1.25, r * 0.05, 0, r * 0.92);
      } else {
        ctx.moveTo(0, -r);
        ctx.bezierCurveTo(r * 1.04, -r * 0.98, r * 0.96, r * 0.44, 0, r * 0.98);
        ctx.bezierCurveTo(-r * 0.96, r * 0.44, -r * 1.04, -r * 0.98, 0, -r);
      }
      ctx.closePath();
    };

    const drawBalloon = (b: Balloon) => {
      const pal = b.kind === "gold" ? PAL[1] : PAL[b.c];
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      ctx.scale(1 + b.squash * 0.5, 1 - b.squash * 0.5);
      const r = b.r;

      // string
      ctx.strokeStyle = "rgba(236,226,214,.42)"; ctx.lineWidth = 1.15; ctx.beginPath();
      ctx.moveTo(0, r * 1.14);
      for (let i = 1; i <= 14; i++) {
        const p = i / 14;
        ctx.lineTo(Math.sin(G.t * 0.0022 + b.phase + p * 3.4) * r * 0.46 * p, r * 1.14 + p * r * 1.9);
      }
      ctx.stroke();

      // knot
      ctx.fillStyle = pal.mid;
      ctx.beginPath();
      ctx.moveTo(-r * 0.14, r * 0.9); ctx.lineTo(r * 0.14, r * 0.9); ctx.lineTo(r * 0.05, r * 1.16); ctx.lineTo(-r * 0.05, r * 1.16);
      ctx.closePath(); ctx.fill();

      // body
      bodyPath(r, b.kind === "heart");
      const g = ctx.createRadialGradient(-r * 0.34, -r * 0.44, r * 0.05, 0, r * 0.1, r * 1.35);
      g.addColorStop(0, pal.hi); g.addColorStop(0.3, pal.base); g.addColorStop(0.72, pal.mid); g.addColorStop(1, pal.edge);
      ctx.fillStyle = g; ctx.fill();

      // shading pass inside body
      ctx.save(); ctx.clip();
      // backlit translucency (rim)
      ctx.globalCompositeOperation = "screen";
      const rg = ctx.createRadialGradient(r * 0.42, r * 0.44, 1, r * 0.42, r * 0.44, r * 0.95);
      rg.addColorStop(0, b.kind === "gold" ? "rgba(255,225,150,.6)" : "rgba(255,190,200,.3)");
      rg.addColorStop(1, "transparent");
      ctx.fillStyle = rg; ctx.fillRect(-r * 1.4, -r * 1.4, r * 2.8, r * 2.8);
      // glow halo around the whole balloon (light bleed through latex)
      const hg = ctx.createRadialGradient(0, 0, r * 0.7, 0, 0, r * 1.6);
      hg.addColorStop(0, "rgba(0,0,0,.35)"); hg.addColorStop(1, "transparent");
      ctx.fillStyle = hg; ctx.fillRect(-r * 1.6, -r * 1.6, r * 3.2, r * 3.2);
      const rg2 = ctx.createRadialGradient(r * 0.4, r * 0.5, 1, r * 0.4, r * 0.5, r * 0.8);
      rg2.addColorStop(0, "rgba(255,255,255,.22)"); rg2.addColorStop(1, "transparent");
      ctx.fillStyle = rg2; ctx.fillRect(-r * 1.4, -r * 1.4, r * 2.8, r * 2.8);
      ctx.globalCompositeOperation = "source-over";
      // specular: broad soft + sharp
      const sp = ctx.createRadialGradient(-r * 0.36, -r * 0.42, 1, -r * 0.36, -r * 0.42, r * 0.6);
      sp.addColorStop(0, "rgba(255,255,255,.8)"); sp.addColorStop(0.5, "rgba(255,255,255,.2)"); sp.addColorStop(1, "transparent");
      ctx.fillStyle = sp; ctx.beginPath(); ctx.ellipse(-r * 0.34, -r * 0.4, r * 0.34, r * 0.22, -0.55, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.9)";
      ctx.beginPath(); ctx.ellipse(-r * 0.44, -r * 0.5, r * 0.085, r * 0.05, -0.5, 0, Math.PI * 2); ctx.fill();
      // long streak
      const st = ctx.createLinearGradient(-r * 0.1, -r, r * 0.3, r * 0.6);
      st.addColorStop(0, "rgba(255,255,255,.18)"); st.addColorStop(1, "transparent");
      ctx.fillStyle = st; ctx.beginPath(); ctx.ellipse(r * 0.16, r * 0.1, r * 0.14, r * 0.62, 0.2, 0, Math.PI * 2); ctx.fill();
      // gold glitter
      if (b.kind === "gold") {
        for (let i = 0; i < 7; i++) {
          const a = G.t * 0.002 + i * 1.9;
          ctx.globalAlpha = 0.35 + 0.55 * Math.abs(Math.sin(a * 1.7));
          ctx.fillStyle = "#fff8dd";
          ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.55, Math.sin(a * 1.3) * r * 0.6, 1.3, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      ctx.restore();

      // edge definition
      bodyPath(r, b.kind === "heart");
      ctx.strokeStyle = "rgba(0,0,0,.3)"; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-r * 0.1, -r * 0.62, r * 0.62, r * 0.2, -0.25, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,.22)"; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.restore();
    };

    const metal = (x0: number, y0: number, x1: number, y1: number, dark: boolean) => {
      const gm = ctx.createLinearGradient(x0, y0, x1, y1);
      if (dark) {
        gm.addColorStop(0, "#4c5158"); gm.addColorStop(0.3, "#8e97a1"); gm.addColorStop(0.5, "#c9d2da");
        gm.addColorStop(0.72, "#5b636c"); gm.addColorStop(1, "#1b1e22");
      } else {
        gm.addColorStop(0, "#2b2f34"); gm.addColorStop(0.35, "#6d757e"); gm.addColorStop(0.55, "#a9b3bd");
        gm.addColorStop(0.8, "#3a3f45"); gm.addColorStop(1, "#14171a");
      }
      return gm;
    };

    const drawGun = () => {
      const gx = G.W / 2, gy = G.H - 34;
      const rec = G.recoil;
      ctx.save();
      ctx.translate(gx, gy);
      // shadow pool
      const sh = ctx.createRadialGradient(0, 14, 2, 0, 14, 74);
      sh.addColorStop(0, "rgba(0,0,0,.55)"); sh.addColorStop(1, "transparent");
      ctx.fillStyle = sh; ctx.beginPath(); ctx.ellipse(0, 14, 74, 15, 0, 0, Math.PI * 2); ctx.fill();
      // Full 360° aim: the base stays fixed while the complete revolver
      // rotates around that pivot to point at the cursor in every direction.
      ctx.rotate(G.aim);
      ctx.translate(-rec * 9, -rec * 2.5);
      ctx.rotate(-rec * 0.07);

      // barrel
      ctx.fillStyle = metal(0, -17, 0, -6, true);
      ctx.beginPath(); ctx.rect(26, -17, 66, 10); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.16)"; ctx.fillRect(28, -16, 62, 1.6); // rib highlight
      ctx.fillStyle = "#101215"; ctx.fillRect(26, -18.5, 66, 2.2); // top rib
      // muzzle
      ctx.fillStyle = "#0d0f12"; ctx.beginPath(); ctx.ellipse(92, -12, 2.6, 5.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(220,230,240,.4)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(92, -12, 3.4, 6, 0, 0, Math.PI * 2); ctx.stroke();
      // front sight
      ctx.fillStyle = "#171a1d"; ctx.beginPath(); ctx.moveTo(80, -19); ctx.lineTo(85, -19); ctx.lineTo(84, -23.5); ctx.lineTo(81, -23.5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#f0f4f8"; ctx.fillRect(82.2, -23, 0.9, 2.4);
      // ejector rod under barrel
      ctx.fillStyle = metal(0, -6, 0, -1, false); ctx.fillRect(36, -7, 52, 3.4);
      // frame
      ctx.fillStyle = metal(0, -20, 0, 4, false);
      ctx.beginPath(); ctx.rect(-12, -20, 44, 20); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.12)"; ctx.fillRect(-12, -20, 44, 2);
      // cylinder
      const cylX = 12, cylY = -10, cr = 11.5;
      const cg = ctx.createRadialGradient(cylX - 4, cylY - 5, 1, cylX, cylY, cr);
      cg.addColorStop(0, "#c3ccd6"); cg.addColorStop(0.45, "#7b848e"); cg.addColorStop(1, "#22262a");
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cylX, cylY, cr, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.translate(cylX, cylY); ctx.rotate(G.reloading ? G.reloadT * 0.16 : 0.1);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.fillStyle = G.ammo > i && !G.reloading ? "#ffd98a" : "#14171a";
        ctx.beginPath(); ctx.arc(Math.cos(a) * 6.4, Math.sin(a) * 6.4, 2.1, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,.5)"; ctx.lineWidth = 0.7; ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = "rgba(255,255,255,.28)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cylX, cylY, cr, 0, Math.PI * 2); ctx.stroke();
      // hammer
      ctx.fillStyle = "#2a2e33"; ctx.beginPath(); ctx.moveTo(-14, -22); ctx.lineTo(-6, -24 - rec * 3); ctx.lineTo(-4, -17); ctx.lineTo(-13, -15); ctx.closePath(); ctx.fill();
      // trigger guard + trigger
      ctx.strokeStyle = "#4a5158"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(-2, 2, 8.5, -0.35, Math.PI * 0.92); ctx.stroke();
      ctx.strokeStyle = "#79828c"; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-3, -2); ctx.lineTo(-5, 4); ctx.stroke();
      // grip (walnut)
      ctx.save(); ctx.translate(-24, 2); ctx.rotate(0.34);
      const wg = ctx.createLinearGradient(0, -8, 16, 40);
      wg.addColorStop(0, "#7a4a22"); wg.addColorStop(0.32, "#5c3416"); wg.addColorStop(0.62, "#8a5628"); wg.addColorStop(1, "#38200c");
      ctx.fillStyle = wg;
      ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(17, -10); ctx.lineTo(21, 36); ctx.quadraticCurveTo(10, 44, 0, 36); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(255,220,180,.18)"; ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath(); ctx.moveTo(2 + i * 0.6, -4 + i * 8);
        ctx.quadraticCurveTo(11 + i, 10 + i * 7, 19 - i * 0.5, 2 + i * 9); ctx.stroke();
      }
      ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.beginPath(); ctx.arc(10, 14, 3.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#c9a35c"; ctx.beginPath(); ctx.arc(10, 14, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      // engraving on barrel
      ctx.fillStyle = "rgba(243,216,148,.62)"; ctx.font = "600 5.4px 'Playfair Display', serif";
      ctx.fillText("REVÓLVER · U♥", 44, -12.6);

      // muzzle flash + smoke
      if (G.flash > 0) {
        ctx.save(); ctx.globalCompositeOperation = "screen";
        const fx = 96, fy = -12;
        const fg = ctx.createRadialGradient(fx, fy, 1, fx, fy, 40 * G.flash);
        fg.addColorStop(0, "rgba(255,255,235,1)"); fg.addColorStop(0.35, "rgba(255,196,110,.85)"); fg.addColorStop(1, "transparent");
        ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(fx, fy, 40 * G.flash, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(255,238,190,${0.9 * G.flash})`;
        ctx.beginPath();
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * Math.PI * 2 + G.t * 0.02;
          const rr = (i % 2 ? 9 : 20) * G.flash;
          ctx.lineTo(fx + Math.cos(a) * rr, fy + Math.sin(a) * rr * 0.7);
        }
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    };

    const drawReticle = () => {
      const { px, py, lock } = G;
      // laser
      const m = muzzle();
      ctx.save(); ctx.setLineDash([3, 7]); ctx.lineWidth = 1;
      ctx.strokeStyle = lock ? "rgba(243,216,148,.5)" : "rgba(255,90,90,.28)";
      ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(px, py); ctx.stroke();
      ctx.restore();
      ctx.save(); ctx.translate(px, py); ctx.rotate(G.t * 0.0012);
      ctx.strokeStyle = lock ? "#f3d894" : "rgba(255,255,255,.7)"; ctx.lineWidth = 1.4;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath(); ctx.arc(0, 0, lock ? 13 : 11, i * Math.PI / 2 + 0.35, i * Math.PI / 2 + 1.22); ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(0, 0, 19, 0, Math.PI * 2); ctx.globalAlpha = 0.28; ctx.stroke(); ctx.globalAlpha = 1;
      ctx.fillStyle = lock ? "#f3d894" : "rgba(255,120,120,.95)";
      ctx.beginPath(); ctx.arc(0, 0, 1.7, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };

    let raf = 0;
    const loop = () => {
      try {
        G.t++;
        drawBackdrop();

        // spawn
        if (!G.done && G.t % 3 === 0) {
          G.spawnIn -= 3;
          if (G.spawnIn <= 0 && G.balloons.length < 7) { spawn(); G.spawnIn = 620 + Math.random() * 700; }
        }
        if (!G.done && (G.balloons.length === 0 || (G.t < 24 && G.balloons.length < 3))) spawn();

        // balloons
        for (const b of G.balloons) {
          b.x += b.vx + Math.sin(G.t * 0.014 * b.wob + b.phase) * 0.5;
          b.y += b.vy;
          b.rot = Math.sin(G.t * 0.014 * b.wob + b.phase) * 0.1;
          b.squash = Math.sin(G.t * 0.03 + b.phase) * 0.02;
          if (b.x < b.r + 6 || b.x > G.W - b.r - 6) b.vx *= -1;
          if (b.y < -b.r * 3) { b.dead = true; G.escaped++; }
          if (!b.dead) drawBalloon(b);
        }
        G.balloons = G.balloons.filter((b) => !b.dead);

        // bullets
        for (const bl of G.bullets) {
          bl.px = bl.x; bl.py = bl.y;
          bl.x += bl.vx; bl.y += bl.vy;
          ctx.save();
          ctx.strokeStyle = "rgba(255,232,180,.4)"; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(bl.px, bl.py); ctx.lineTo(bl.x, bl.y); ctx.stroke();
          const bg = ctx.createRadialGradient(bl.x, bl.y, 0, bl.x, bl.y, 5);
          bg.addColorStop(0, "#fff8dd"); bg.addColorStop(1, "rgba(255,180,60,0)");
          ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(bl.x, bl.y, 5, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
          for (const b of G.balloons) {
            if (!b.dead && Math.hypot(b.x - bl.x, b.y - bl.y) < b.r * 0.94 + 3) { pop(b); bl.y = -999; break; }
          }
        }
        G.bullets = G.bullets.filter((b) => b.x > -40 && b.x < G.W + 40 && b.y > -40 && b.y < G.H + 40);

        // shreds
        for (const s of G.shreds) {
          s.life++; s.x += s.vx; s.y += s.vy; s.vy += 0.14; s.vx *= 0.99; s.rot += s.vr;
          const a = 1 - s.life / s.max; if (a <= 0) continue;
          ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot); ctx.globalAlpha = a;
          ctx.fillStyle = s.col; ctx.beginPath(); ctx.ellipse(0, 0, s.size, s.size * 0.42, 0, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
        G.shreds = G.shreds.filter((s) => s.life < s.max);

        // puffs / smoke
        for (const p of G.puffs) {
          p.life++; p.x += p.vx; p.y += p.vy; p.vx *= 0.94; p.vy = p.vy * 0.94 - 0.02; p.r += 0.7;
          const a = 1 - p.life / 46; if (a <= 0) continue;
          const pg = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, p.r);
          pg.addColorStop(0, `rgba(238,232,224,${0.3 * a})`); pg.addColorStop(1, "transparent");
          ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        }
        G.puffs = G.puffs.filter((p) => p.life < 46);

        // brass casings
        for (const c of G.casings) {
          c.life++; c.x += c.vx; c.y += c.vy; c.vy += 0.3; c.vx *= 0.99; c.rot += c.vr;
          ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.rot); ctx.globalAlpha = Math.max(0, 1 - c.life / 70);
          const lg = ctx.createLinearGradient(-3, 0, 3, 0);
          lg.addColorStop(0, "#8a5a22"); lg.addColorStop(0.5, "#ffe9b0"); lg.addColorStop(1, "#6b450f");
          ctx.fillStyle = lg; ctx.fillRect(-3.4, -1.7, 6.8, 3.4);
          ctx.fillStyle = "#c9a35c"; ctx.fillRect(-3.4, -1.7, 1.3, 3.4);
          ctx.restore();
        }
        G.casings = G.casings.filter((c) => c.life < 70 && c.y < G.H + 20);

        // lock detect
        G.lock = G.balloons.some((b) => Math.hypot(b.x - G.px, b.y - G.py) < b.r + 6);

        if (G.reloading) G.reloadT++;
        G.recoil *= 0.84; G.flash *= 0.8;
        drawGun();
        drawReticle();

        // floor
        const fg = ctx.createLinearGradient(0, G.H - 46, 0, G.H);
        fg.addColorStop(0, "transparent"); fg.addColorStop(1, "rgba(10,4,8,.85)");
        ctx.fillStyle = fg; ctx.fillRect(0, G.H - 46, G.W, 46);
      } catch { /* keep the loop alive */ }
      raf = requestAnimationFrame(loop);
    };
    loop();

    const onDown = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      G.px = e.clientX - r.left; G.py = e.clientY - r.top;
      G.aim = Math.atan2(G.py - (G.H - 34), G.px - G.W / 2);
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      if (audioRef.current?.state === "suspended") audioRef.current.resume();
      fire();
    };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      G.px = e.clientX - r.left; G.py = e.clientY - r.top;
      G.aim = Math.atan2(G.py - (G.H - 34), G.px - G.W / 2);
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
    };
  }, [G]);

  const reset = () => {
    G.balloons = []; G.bullets = []; G.shreds = []; G.casings = []; G.puffs = [];
    G.score = 0; G.popped = 0; G.combo = 0; G.escaped = 0; G.done = false; G.ammo = MAG; G.reloading = false;
    setScore(0); setPopped(0); setCombo(0); setFinished(false); setAmmo(MAG); setReloading(false); setPops([]); setLog([]);
  };

  return (
    <div className="stage-page relative flex min-h-[100svh] w-full flex-col items-center justify-start overflow-hidden px-4 py-14 sm:py-20">
      <div className="relative z-10 mb-5 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.38em] text-[#c9a35c]">Chapter 07 • shooting gallery</p>
        <h2 className="font-display mt-2 text-3xl font-bold sm:text-5xl"><span className="gold-text">Balloon Shooter</span></h2>
        <p className="mx-auto mt-2 max-w-xl font-serif2 text-[17px] italic text-white/65">Real latex, real aim — har balloon mein ek wish bandhi hai.</p>
      </div>
      {/* HUD row */}
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        <span className="flex items-center gap-1.5 rounded-full border border-[#c9a35c]/30 bg-black/45 px-4 py-1.5 text-[13px] font-bold text-[#f3d894]"><Trophy size={13} /> {score}</span>
        <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-4 py-1.5 text-[13px] font-bold text-white/80"><Target size={13} /> {popped}/{GOAL}</span>
        {/* ammo pips */}
        <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-3.5 py-2">
          {Array.from({ length: MAG }).map((_, i) => (
            <span key={i} className="h-3.5 w-[5px] rounded-[2px] transition-all duration-200"
              style={{ background: i < ammo ? "linear-gradient(180deg,#ffe9b0,#c9a35c 55%,#6b450f)" : "rgba(255,255,255,.12)", transform: i === ammo && !reloading ? "translateY(-2px)" : "none" }} />
          ))}
          <span className={`ml-1 text-[10px] font-bold uppercase tracking-[0.2em] ${reloading ? "text-amber-200" : "text-white/40"}`}>{reloading ? "reloading" : `${ammo}/${MAG}`}</span>
        </span>
        <button onClick={() => setMuted(!muted)} className="btn-ghost rounded-full p-2 text-white/70" title="Sound effects">
          {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>
        <button onClick={reset} className="btn-ghost rounded-full p-2 text-white/70" title="Restart"><RotateCcw size={15} /></button>
      </div>

      {/* Desktop shooting-gallery layout: game left, wishes right. */}
      <div className="flex w-full max-w-[1060px] flex-col items-center gap-5 lg:flex-row lg:items-start lg:justify-center lg:gap-7">
      {/* arena */}
      <div ref={wrapRef} className="relative w-full max-w-[660px] lg:w-[660px] lg:flex-none">
        <canvas ref={canvasRef} className="block w-full cursor-none touch-none rounded-[20px] border border-[#c9a35c]/28 shadow-[0_36px_90px_rgba(0,0,0,.65)]" />
        <AnimatePresence>
          {combo > 1 && !finished && (
            <motion.p key={combo} initial={{ opacity: 0, y: 10, scale: .9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}
              className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-full border border-[#f3d894]/50 bg-black/80 px-4 py-1.5 font-display text-[13px] font-bold tracking-[0.2em] text-[#f3d894]">
              ×{combo} RAPID FIRE
            </motion.p>
          )}
        </AnimatePresence>
        {/* wish popups */}
        <AnimatePresence>
          {pops.map((p) => (
            <motion.div key={p.id}
              initial={{ opacity: 0, y: 16, scale: .88 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -22, scale: .94 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="pointer-events-none absolute z-20 w-[min(78%,290px)] -translate-x-1/2 lg:hidden"
              style={{ left: `${Math.min(72, Math.max(28, p.xp * 100))}%`, top: `${Math.min(64, Math.max(6, p.yp * 100))}%` }}>
              <div className={`rounded-2xl px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,.6)] backdrop-blur-md ${
                p.tone === "gold" ? "border border-[#f3d894]/70 bg-[#241705]/92"
                : p.tone === "rose" ? "border border-pink-300/60 bg-[#2a0a18]/92"
                : "border border-white/20 bg-[#100710]/92"}`}>
                <p className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.3em] ${p.tone === "gold" ? "text-[#f3d894]" : p.tone === "rose" ? "text-pink-200" : "text-white/45"}`}>
                  <Sparkles size={10} /> {p.title}
                </p>
                <p className="mt-1 font-serif2 text-[15px] italic leading-snug text-white/85">{p.text}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <p className="mt-2 text-center text-[11px] uppercase tracking-[0.28em] text-white/35">
          move = aim • click / tap = fire • auto-reload at 6
        </p>
      </div>

      {/* Desktop wish rail */}
      <aside className="hidden w-full max-w-[340px] shrink-0 lg:flex lg:min-h-[480px] lg:flex-col lg:rounded-[26px] lg:border lg:border-[#c9a35c]/30 lg:bg-black/30 lg:p-4 lg:backdrop-blur-md">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-[#c9a35c]">Your wishes</p>
            <h3 className="font-display mt-1 text-xl font-bold text-pink-100">Little notes from the sky</h3>
          </div>
          <span className="rounded-full border border-pink-300/20 bg-pink-400/10 px-2.5 py-1 text-[10px] text-pink-200">{pops.length} new</span>
        </div>
        <div className="flex flex-1 flex-col gap-2.5 overflow-hidden">
          {pops.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 text-center text-[13px] italic text-white/35">
              Pop a balloon and its little wish will appear here ✦
            </div>
          ) : pops.slice().reverse().map((p) => (
            <motion.div key={p.id} initial={{ opacity: 0, x: 18, scale: .96 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 18 }} className={`rounded-2xl px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,.45)] ${p.tone === "gold" ? "border border-[#f3d894]/60 bg-[#241705]/92" : p.tone === "rose" ? "border border-pink-300/50 bg-[#2a0a18]/92" : "border border-white/15 bg-[#100710]/92"}`}>
              <p className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.25em] ${p.tone === "gold" ? "text-[#f3d894]" : p.tone === "rose" ? "text-pink-200" : "text-white/45"}`}><Sparkles size={10}/> {p.title}</p>
              <p className="mt-1 font-serif2 text-[15px] italic leading-snug text-white/85">{p.text}</p>
            </motion.div>
          ))}
        </div>
      </aside>
      </div>

      {/* collected wishes */}
      {log.length > 0 && !finished && (
        <div className="grid w-full max-w-[620px] gap-1.5">
          {log.map((w, i) => (
            <motion.p key={w + i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1 - i * 0.26, x: 0 }}
              className="flex items-start gap-2 rounded-xl border border-white/10 bg-black/35 px-3.5 py-2 text-[13px] leading-snug text-white/70">
              <span className="mt-[3px] text-[10px] text-[#c9a35c]">✦</span>{w}
            </motion.p>
          ))}
        </div>
      )}

      {finished ? (
        <motion.div initial={{ opacity: 0, y: 20, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          className="glass-lux w-full max-w-[620px] rounded-[26px] p-6 text-center sm:p-7">
          <p className="text-[10px] uppercase tracking-[0.4em] text-[#c9a35c]">sky cleared • {score} pts • {G.escaped} escaped</p>
          <p className="font-script mt-2 text-[clamp(30px,5.6vw,44px)] leading-tight text-pink-100 script-glow">{FINAL_BUBBLE_SURPRISE.title}</p>
          <p className="mx-auto mt-2 max-w-[440px] font-serif2 text-[16px] italic leading-relaxed text-white/70">{FINAL_BUBBLE_SURPRISE.text}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            <button onClick={onNext} className="btn-gold flex items-center gap-2 rounded-full px-7 py-3 text-[14px] font-bold">Next: scratch the gold card <ChevronRight size={16} /></button>
            <button onClick={reset} className="btn-ghost flex items-center gap-2 rounded-full px-5 py-3 text-[13px] text-white/70"><RotateCcw size={14} /> One more round</button>
          </div>
        </motion.div>
      ) : (
        <button onClick={onNext} className="btn-ghost rounded-full px-6 py-2 text-[12px] text-white/50 hover:text-white/85">
          skip shooting range — next surprise →
        </button>
      )}
    </div>
  );
}
