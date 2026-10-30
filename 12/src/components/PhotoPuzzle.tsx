import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Upload,
  Shuffle,
  ChevronRight,
  Trophy,
  ImageIcon,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { MEMORIES } from "../data/content";

type Grid = 3 | 4;

const shuffleSolvable = (n: number): number[] => {
  const total = n * n;
  let arr: number[];
  const isSolvable = (a: number[]) => {
    let inv = 0;
    const t = a.filter((x) => x !== total - 1);
    for (let i = 0; i < t.length; i++) {
      for (let j = i + 1; j < t.length; j++) {
        if (t[i] > t[j]) inv++;
      }
    }
    if (n % 2 === 1) return inv % 2 === 0;
    const blankRow = Math.floor(a.indexOf(total - 1) / n);
    const rowFromBottom = n - blankRow;
    return rowFromBottom % 2 === 0 ? inv % 2 === 1 : inv % 2 === 0;
  };

  do {
    arr = Array.from({ length: total }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  } while (!isSolvable(arr) || arr.every((v, i) => v === i));
  return arr;
};

export default function PhotoPuzzle({ onNext }: { onNext: () => void }) {
  const [grid, setGrid] = useState<Grid>(3);
  const [img, setImg] = useState<string>(MEMORIES[1].img);
  const [tiles, setTiles] = useState<number[]>(() => shuffleSolvable(3));
  const [moves, setMoves] = useState(0);
  const [solved, setSolved] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [started, setStarted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const total = grid * grid;
  const blank = total - 1;

  const newGame = (n: Grid = grid) => {
    setGrid(n);
    setTiles(shuffleSolvable(n));
    setMoves(0);
    setSolved(false);
    setStarted(true);
  };

  const move = (idx: number) => {
    if (solved) return;
    const bi = tiles.indexOf(blank);
    const r = Math.floor(idx / grid),
      c = idx % grid;
    const br = Math.floor(bi / grid),
      bc = bi % grid;
    if ((Math.abs(r - br) === 1 && c === bc) || (Math.abs(c - bc) === 1 && r === br)) {
      const nt = [...tiles];
      [nt[idx], nt[bi]] = [nt[bi], nt[idx]];
      setTiles(nt);
      setMoves((m) => m + 1);
      if (nt.every((v, i) => v === i)) {
        setSolved(true);
        confetti({
          particleCount: 200,
          spread: 120,
          origin: { y: 0.5 },
          colors: ["#ff8fb2", "#f3d894", "#c084fc", "#7dd3fc"],
        });
      }
    }
  };

  useEffect(() => {
    setTiles(shuffleSolvable(grid));
    setSolved(false);
    setMoves(0);
  }, []); // eslint-disable-line

  const onUpload = (f?: File) => {
    if (!f) return;
    const url = URL.createObjectURL(f);
    setImg(url);
    newGame();
  };

  const tilePos = (val: number) => {
    const r = Math.floor(val / grid),
      c = val % grid;
    return `${(c / (grid - 1)) * 100}% ${(r / (grid - 1)) * 100}%`;
  };

  return (
    <div className="stage-page relative flex min-h-[100svh] w-full flex-col items-center justify-start overflow-hidden px-4 py-16 sm:py-20">
      <div className="spotlight-beam pointer-events-none absolute inset-x-0 top-0 mx-auto h-[70vh] w-full" />

      {/* Header */}
      <div className="relative z-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#c9a35c]/35 bg-[#170712]/80 px-4 py-1.5 shadow-[0_0_24px_rgba(201,163,92,.25)] backdrop-blur-md">
          <Sparkles size={13} className="text-[#f3d894]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.35em] text-[#f3d894]">
            Chapter 08 • Our Photo Puzzle
          </span>
          <Sparkles size={13} className="text-[#f3d894]" />
        </div>
        <h2 className="font-display mt-3 text-3xl font-bold sm:text-5xl">
          <span className="gold-text">Piece Us Back Together</span>
        </h2>
        <p className="mt-2 font-serif2 text-[18px] italic text-white/70">
          Upload our photo or pick one — slide the tiles to make us whole 🧩
        </p>
      </div>

      {/* Controls Bar */}
      <div className="relative z-10 my-4 flex flex-wrap items-center justify-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onUpload(e.target.files?.[0])}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="btn-gold flex items-center gap-2 rounded-full px-5 py-2.5 text-[13.5px] font-bold shadow-md"
        >
          <Upload size={15} /> Upload Our Photo
        </button>

        <div className="flex overflow-hidden rounded-full border border-[#c9a35c]/40 shadow-md">
          {[3, 4].map((n) => (
            <button
              key={n}
              onClick={() => newGame(n as Grid)}
              className={`px-4 py-2 text-[13px] font-bold transition-all ${
                grid === n
                  ? "bg-gradient-to-r from-[#c9a35c] to-[#edd18a] text-[#1d0f04]"
                  : "bg-black/50 text-white/60 hover:text-white"
              }`}
            >
              {n}×{n} Grid
            </button>
          ))}
        </div>

        <button
          onClick={() => newGame()}
          className="btn-ghost flex items-center gap-2 rounded-full px-5 py-2.5 text-[13.5px] font-semibold text-white/85 shadow-md"
        >
          <Shuffle size={15} /> Shuffle
        </button>
      </div>

      {/* Preset Sample Selector */}
      {!started && (
        <div className="relative z-10 my-1 flex flex-wrap items-center justify-center gap-2.5">
          {MEMORIES.slice(0, 4).map((m, i) => (
            <button
              key={i}
              onClick={() => {
                setImg(m.img);
                newGame();
              }}
              className="h-12 w-12 overflow-hidden rounded-xl border border-[#c9a35c]/40 opacity-75 shadow-md transition-all hover:scale-105 hover:opacity-100"
            >
              <img src={m.img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
          <span className="flex items-center gap-1 text-[11.5px] text-white/45">
            <ImageIcon size={13} /> or tap a sample
          </span>
        </div>
      )}

      {/* Moves & Preview Bar */}
      <div className="relative z-10 my-3 flex items-center gap-3">
        <span className="flex items-center gap-2 rounded-full border border-white/20 bg-black/50 px-4 py-1.5 text-[13px] font-bold text-white/90 shadow-md">
          <Trophy size={14} className="text-[#f3d894]" /> {moves} Moves
        </span>
        <button
          onClick={() => setShowHint((s) => !s)}
          className="btn-ghost flex items-center gap-2 rounded-full px-4 py-1.5 text-[12.5px] font-medium text-white/80"
        >
          {showHint ? <EyeOff size={14} /> : <Eye size={14} />} {showHint ? "Hide Reference" : "Show Reference"}
        </button>
      </div>

      {/* Sliding Puzzle Board */}
      <div className="relative z-10 my-3 w-full max-w-[390px]">
        <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-[#c9a35c]/40 bg-black/55 p-2 shadow-[0_30px_80px_rgba(0,0,0,.75)]">
          {/* Reference Image Overlay */}
          <AnimatePresence>
            {(showHint || solved) && (
              <motion.img
                initial={{ opacity: 0 }}
                animate={{ opacity: solved ? 1 : 0.4 }}
                exit={{ opacity: 0 }}
                src={img}
                alt="preview"
                className="pointer-events-none absolute inset-2 z-20 rounded-2xl object-cover"
                style={{ width: "calc(100% - 16px)", height: "calc(100% - 16px)" }}
              />
            )}
          </AnimatePresence>

          <div
            className="grid h-full w-full gap-1.5"
            style={{ gridTemplateColumns: `repeat(${grid}, 1fr)` }}
          >
            {tiles.map((val, idx) => {
              const isBlank = val === blank;
              const bi = tiles.indexOf(blank);
              const r = Math.floor(idx / grid),
                c = idx % grid;
              const br = Math.floor(bi / grid),
                bc = bi % grid;
              const movable =
                !isBlank &&
                !solved &&
                ((Math.abs(r - br) === 1 && c === bc) || (Math.abs(c - bc) === 1 && r === br));

              return (
                <button
                  key={idx}
                  onClick={() => move(idx)}
                  disabled={isBlank || solved}
                  className={`relative overflow-hidden rounded-xl transition-all duration-150 ${
                    isBlank && !solved
                      ? "border-2 border-dashed border-[#c9a35c]/40 bg-[#160611]/80"
                      : movable
                      ? "z-10 shadow-[0_0_0_2px_rgba(243,216,148,.8),0_0_20px_rgba(243,216,148,.45)] hover:scale-[1.03] active:scale-95 cursor-pointer"
                      : "shadow-[inset_0_0_0_1px_rgba(255,255,255,.1)]"
                  }`}
                  style={
                    !isBlank || solved
                      ? {
                          backgroundImage: `url(${img})`,
                          backgroundSize: `${grid * 100}% ${grid * 100}%`,
                          backgroundPosition: tilePos(val),
                        }
                      : {}
                  }
                >
                  {!isBlank && !solved && (
                    <span
                      className={`absolute bottom-1 right-1 rounded px-1.5 py-0.5 text-[9.5px] font-bold shadow-md ${
                        movable ? "bg-[#c9a35c] text-[#1d0f04]" : "bg-black/60 text-[#f3d894]"
                      }`}
                    >
                      {val + 1}
                    </span>
                  )}
                  {isBlank && !solved && (
                    <span className="flex h-full w-full items-center justify-center text-[18px] text-[#c9a35c]/50">
                      ♥
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <p className="mt-2 text-center text-[12.5px] text-white/45">
          Glowing tiles can slide into the empty heart space ✨
        </p>
      </div>

      {/* Solved Card */}
      <AnimatePresence>
        {solved && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="glass-lux relative z-10 mt-6 w-full max-w-xl rounded-3xl p-6 text-center sm:p-8"
          >
            <div className="mx-auto mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-4 py-1 text-[11px] font-bold uppercase tracking-widest text-emerald-300">
              Puzzle Completed in {moves} Moves ✨
            </div>
            <p className="font-script mt-2 text-[36px] text-pink-100 script-glow sm:text-[44px]">
              Every piece of me fits with you
            </p>
            <p className="mx-auto mt-2 max-w-md font-serif2 text-[17px] italic leading-relaxed text-white/75">
              Just like this photo, we only make sense when we are side by side. Scattered apart, whole together. Happy birthday, my missing piece.
            </p>
            <button
              onClick={onNext}
              className="btn-gold mx-auto mt-6 flex items-center gap-2 rounded-full px-8 py-3.5 text-[14.5px] font-bold shadow-[0_10px_35px_rgba(201,163,92,.45)]"
            >
              Next: Scratch My Secret <ChevronRight size={17} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {!solved && (
        <button
          onClick={onNext}
          className="btn-ghost relative z-10 mt-4 flex items-center gap-2 rounded-full px-7 py-2.5 text-[13px] text-white/60 hover:text-white"
        >
          Skip puzzle — take me forward →
        </button>
      )}
    </div>
  );
}
