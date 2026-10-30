import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Theater,
  Gift,
  Cake,
  Images,
  HeartHandshake,
  Bubbles,
  Ticket,
  Feather,
  Crown,
  ChevronLeft,
  ChevronRight,
  Home,
  Puzzle,
} from "lucide-react";

import GlobalBackground from "./components/GlobalBackground";
import MusicBar, {
  type MusicState,
} from "./components/MusicBar";

import ErrorBoundary from "./components/ErrorBoundary";
import SecretEntry from "./components/SecretEntry";
import CurtainReveal from "./components/CurtainReveal";
import GiftBoxStage from "./components/GiftBoxStage";
import CakeStage from "./components/CakeStage";
import Memories from "./components/MemoriesArc";
import QuizGame from "./components/QuizGame";
import BubbleShooter from "./components/BubbleShooter";
import BalloonShooter from "./components/BalloonShooter";
import PhotoPuzzle from "./components/PhotoPuzzle";
import ScratchCard from "./components/ScratchCard";
import LoveLetter from "./components/LoveLetter";
import FinalReveal from "./components/FinalReveal";

const STAGES = [
  {
    id: "entry",
    label: "Secret",
    icon: Lock,
  },
  {
    id: "curtain",
    label: "Curtains",
    icon: Theater,
  },
  {
    id: "gift",
    label: "Gift",
    icon: Gift,
  },
  {
    id: "cake",
    label: "Cake",
    icon: Cake,
  },
  {
    id: "memories",
    label: "Memories",
    icon: Images,
  },
  {
    id: "quiz",
    label: "Love Quiz",
    icon: HeartHandshake,
  },
  {
    id: "bubbles",
    label: "Bubbles",
    icon: Bubbles,
  },
  {
    id: "puzzle",
    label: "Puzzle",
    icon: Puzzle,
  },
  {
    id: "scratch",
    label: "Scratch",
    icon: Ticket,
  },
  {
    id: "letter",
    label: "Letter",
    icon: Feather,
  },
  {
    id: "final",
    label: "Finale",
    icon: Crown,
  },
];

const LAST = STAGES.length - 1;

export default function App() {
  const [stage, setStage] = useState(0);

  const [unlocked, setUnlocked] = useState(false);
  const [gameChoice, setGameChoice] = useState<"bubble" | "balloon" | null>(null);

  /*
  |--------------------------------------------------------------------------
  | GLOBAL MUSIC STATE
  |--------------------------------------------------------------------------
  */

  const [music, setMusic] = useState<MusicState>({
    url: null,
    name: "",
    playing: false,
  });

  /*
  |--------------------------------------------------------------------------
  | IMPORTANT
  |--------------------------------------------------------------------------
  | false initially, but MusicBar will automatically open the music
  | selection popup because the website is still locked.
  */

  const [musicOpen, setMusicOpen] = useState(true);

  const audioRef =
    useRef<HTMLAudioElement | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Scroll to top when changing stage
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "instant" as ScrollBehavior,
    });
  }, [stage]);

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  const go = (number: number) => {
    setStage(
      Math.max(
        0,
        Math.min(LAST, number)
      )
    );
  };

  const next = () => {
    go(stage + 1);
  };

  const prev = () => {
    go(stage - 1);
  };

  return (
    <div className="relative min-h-[100svh] w-full overflow-x-hidden">
      {/* ================================================================
          GLOBAL BACKGROUND
      ================================================================ */}

      <GlobalBackground
        intensity={
          stage === LAST
            ? 1.5
            : 1
        }
      />

      {/* ================================================================
          TOP JOURNEY NAVIGATION
      ================================================================ */}

      {unlocked && stage > 0 && (
        <header className="fixed inset-x-0 top-0 z-[80] border-b border-white/[0.08] bg-[#09030c]/85 shadow-lg backdrop-blur-xl">
          <div className="mx-auto flex max-w-5xl items-center gap-2 px-3 py-2.5 sm:px-6">
            <button
              onClick={() => go(1)}
              className="mr-2 hidden items-center gap-1.5 rounded-full border border-[#c9a35c]/35 px-3.5 py-1.5 text-[11.5px] font-bold text-[#f3d894] transition-colors hover:bg-[#c9a35c]/15 sm:flex"
            >
              <Home size={13} />

              For Uhh
            </button>

            <div
              className="flex flex-1 items-center gap-1.5 overflow-x-auto py-0.5"
              style={{
                scrollbarWidth: "none",
              }}
            >
              {STAGES.slice(1).map(
                (stageItem, index) => {
                  const stageIndex =
                    index + 1;

                  const Icon =
                    stageItem.icon;

                  const active =
                    stageIndex === stage;

                  const done =
                    stageIndex < stage;

                  return (
                    <button
                      key={stageItem.id}
                      onClick={() =>
                        go(stageIndex)
                      }
                      className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition-all ${
                        active
                          ? "scale-105 bg-gradient-to-r from-[#c9a35c] via-[#f3d894] to-[#c9a35c] text-[#1a0a02] shadow-[0_0_20px_rgba(201,163,92,.5)]"
                          : done
                          ? "border border-emerald-400/30 bg-emerald-400/15 text-emerald-200 hover:bg-emerald-400/25"
                          : "bg-white/[0.04] text-white/45 hover:bg-white/10 hover:text-white/80"
                      }`}
                    >
                      <Icon size={12.5} />

                      <span className="hidden md:inline">
                        {stageItem.label}
                      </span>

                      <span className="md:hidden">
                        {stageIndex}
                      </span>
                    </button>
                  );
                }
              )}
            </div>

            <div className="hidden shrink-0 text-[11.5px] font-bold text-[#f3d894]/70 sm:block">
              {stage}/{LAST}
            </div>
          </div>

          {/* Golden progress line */}

          <div className="h-[2px] w-full bg-white/[0.06]">
            <div
              className="h-full bg-gradient-to-r from-[#c9a35c] via-pink-400 to-[#f3d894] transition-all duration-700"
              style={{
                width: `${
                  (stage / LAST) * 100
                }%`,
              }}
            />
          </div>
        </header>
      )}

      {/* ================================================================
          MAIN STAGES
      ================================================================ */}

      <main
        className={`relative z-10 w-full ${
          unlocked && stage > 0
            ? "pt-[58px]"
            : ""
        } ${stage === 1 ? "pb-0" : "pb-24"}`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{
              opacity: 0,
              y: 24,
              scale: 0.99,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -20,
              scale: 0.99,
            }}
            transition={{
              duration: 0.55,
              ease: [
                0.2,
                0.8,
                0.2,
                1,
              ],
            }}
            className="w-full"
          >
            {/* ==========================================================
                SECRET ENTRY
            ========================================================== */}

            <ErrorBoundary label="Secret entry">
              {stage === 0 && (
                <SecretEntry
                  onUnlock={() => {
                    /*
                    ------------------------------------------------------
                    Password is successful.
                    ------------------------------------------------------
                    */

                    setUnlocked(true);

                    /*
                    Music popup is already completed.
                    */

                    setMusicOpen(false);

                    /*
                    Move to first journey stage.
                    */

                    setStage(1);

                    /*
                    Continue selected music.
                    */

                    if (
                      audioRef.current &&
                      music.url
                    ) {
                      audioRef.current
                        .play()
                        .then(() => {
                          setMusic(
                            (
                              current
                            ) => ({
                              ...current,
                              playing: true,
                            })
                          );
                        })
                        .catch(() => {});
                    }
                  }}
                />
              )}
            </ErrorBoundary>

            {/* ==========================================================
                CURTAIN
            ========================================================== */}

            <ErrorBoundary label="Curtain reveal">
              {stage === 1 && (
                <CurtainReveal
                  onNext={next}
                />
              )}
            </ErrorBoundary>

            {/* ==========================================================
                GIFT
            ========================================================== */}

            <ErrorBoundary label="Gift box">
              {stage === 2 && (
                <GiftBoxStage
                  onNext={next}
                />
              )}
            </ErrorBoundary>

            {/* ==========================================================
                CAKE
            ========================================================== */}

            <ErrorBoundary label="Birthday cake">
              {stage === 3 && (
                <CakeStage
                  onNext={next}
                />
              )}
            </ErrorBoundary>

            {/* ==========================================================
                MEMORIES
            ========================================================== */}

            <ErrorBoundary label="Memories gallery">
              {stage === 4 && (
                <Memories
                  onNext={next}
                  music={music}
                  setMusic={setMusic}
                />
              )}
            </ErrorBoundary>

            {/* ==========================================================
                QUIZ
            ========================================================== */}

            <ErrorBoundary label="Love quiz">
              {stage === 5 && (
                <QuizGame
                  onNext={next}
                />
              )}
            </ErrorBoundary>

            {/* ==========================================================
                BUBBLES
            ========================================================== */}

            <ErrorBoundary label="Bubble shooter">
              {stage === 6 && (
                gameChoice === null ? (
                  <div className="relative flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden px-4 py-16">
                    <div className="relative z-10 w-full max-w-2xl text-center">
                      <p className="text-[10px] font-bold uppercase tracking-[0.38em] text-[#c9a35c]">Chapter 07 • choose your game</p>
                      <h2 className="font-display mt-3 text-3xl font-bold sm:text-5xl"><span className="gold-text">Pick Your Little Challenge</span></h2>
                      <p className="mx-auto mt-2 max-w-xl font-serif2 text-[18px] italic text-white/65">Dono games mein wishes milengi. Choose the one you want to play first.</p>
                      <div className="mt-8 grid gap-4 sm:grid-cols-2">
                        <button onClick={() => setGameChoice("bubble")} className="glass-lux rounded-3xl p-6 text-left transition hover:-translate-y-1 hover:border-pink-300/50">
                          <div className="text-4xl">🫧</div><p className="mt-3 font-display text-2xl font-bold text-white">Bubble Shooter</p><p className="mt-1 text-sm text-white/55">Pop the bubbles and collect every little wish.</p>
                          <span className="btn-gold mt-5 inline-flex rounded-full px-5 py-2 text-xs font-bold">Play Bubble Shooter →</span>
                        </button>
                        <button onClick={() => setGameChoice("balloon")} className="glass-lux rounded-3xl p-6 text-left transition hover:-translate-y-1 hover:border-pink-300/50">
                          <div className="text-4xl">🎈</div><p className="mt-3 font-display text-2xl font-bold text-white">Balloon Shooter</p><p className="mt-1 text-sm text-white/55">Aim, shoot the balloons and reveal their wishes.</p>
                          <span className="btn-gold mt-5 inline-flex rounded-full px-5 py-2 text-xs font-bold">Play Balloon Shooter →</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : gameChoice === "bubble" ? (
                  <BubbleShooter onNext={next} />
                ) : (
                  <BalloonShooter onNext={next} />
                )
              )}
            </ErrorBoundary>

            {/* ==========================================================
                PHOTO PUZZLE
            ========================================================== */}

            <ErrorBoundary label="Photo puzzle">
              {stage === 7 && (
                <PhotoPuzzle
                  onNext={next}
                />
              )}
            </ErrorBoundary>

            {/* ==========================================================
                SCRATCH CARD
            ========================================================== */}

            <ErrorBoundary label="Scratch card">
              {stage === 8 && (
                <ScratchCard
                  onNext={next}
                />
              )}
            </ErrorBoundary>

            {/* ==========================================================
                LOVE LETTER
            ========================================================== */}

            <ErrorBoundary label="Love letter">
              {stage === 9 && (
                <LoveLetter
                  onNext={next}
                />
              )}
            </ErrorBoundary>

            {/* ==========================================================
                FINAL REVEAL
            ========================================================== */}

            <ErrorBoundary label="Final reveal">
              {stage === 10 && (
                <FinalReveal
                  onRestart={() =>
                    setStage(1)
                  }
                  music={music}
                  openMusic={() =>
                    setMusicOpen(true)
                  }
                />
              )}
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ================================================================
          BOTTOM NAVIGATION
      ================================================================ */}

      {unlocked &&
        stage > 0 &&
        stage < LAST && (
          <nav className="fixed inset-x-0 bottom-0 z-[80] border-t border-white/[0.08] bg-[#09030c]/85 shadow-2xl backdrop-blur-xl">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
              <button
                onClick={prev}
                className="btn-ghost flex items-center gap-1.5 rounded-full px-5 py-2 text-[13px] font-semibold text-white/80 shadow-sm"
              >
                <ChevronLeft size={16} />

                <span className="hidden sm:inline">
                  Back
                </span>
              </button>

              <p className="truncate text-center font-script text-[22px] leading-none text-pink-200/90 sm:text-[24px]">
                {stage === 1
                  ? "the curtains part for you"
                  : stage === 2
                  ? "a gift from the stars"
                  : stage === 3
                  ? "make a silent wish"
                  : stage === 4
                  ? "every frame, only you"
                  : stage === 5
                  ? "how well do you know us"
                  : stage === 6
                  ? "pop your way to my heart"
                  : stage === 7
                  ? "piece us back together"
                  : stage === 8
                  ? "scratch with love"
                  : stage === 9
                  ? "in my own handwriting"
                  : "made only for Uhh"}
              </p>

              <button
                onClick={next}
                className="btn-gold flex items-center gap-1.5 rounded-full px-5 py-2 text-[13px] font-bold shadow-md"
              >
                <span className="hidden sm:inline">
                  Next
                </span>

                <ChevronRight size={16} />
              </button>
            </div>

            <div className="h-[env(safe-area-inset-bottom)]" />
          </nav>
        )}

      {/* ================================================================
          GLOBAL MUSIC PLAYER

          IMPORTANT:
          This is OUTSIDE unlocked condition.

          Therefore music selection appears before password.
      ================================================================ */}

      <MusicBar
        music={music}
        setMusic={setMusic}
        audioRef={audioRef}
        open={musicOpen}
        setOpen={setMusicOpen}
        required={!unlocked}
      />
    </div>
  );
}