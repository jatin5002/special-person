import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Music,
  Upload,
  Pause,
  Play,
  Volume2,
   X,
  Check,
  Disc3,
  ChevronRight,
} from "lucide-react";

export type MusicState = {
  url: string | null;
  name: string;
  playing: boolean;
};

type Song = {
  id: string;
  title: string;
  artist: string;
  src: string;
  owner?: boolean;
};

/*
|--------------------------------------------------------------------------
| DEFAULT SONGS
|--------------------------------------------------------------------------
| These files must exist inside:
|
| public/music/
|
| You can change title/artist later without changing the UI.
|
*/

const DEFAULT_SONGS: Song[] = [
  { id: "meri-zindagi-hai-tu", title: "Meri Zindagi Hai Tu", artist: "Asim Azhar", src: "/music/Meri Zindagi Hai Tu.mp3" },
  { id: "falling-for-you", title: "Falling For You", artist: "Shrey Singhal", src: "/music/Fallin For You Shrey Singhal 128 Kbps.mp3" },
  { id: "ishq-de-fanniyar", title: "Ishq De Fanniyar", artist: "Female Version", src: "/music/Ishq de Fanniyar - Female [lGO21pNVLK8].mp3" },
  { id: "ishq-mubarak", title: "Ishq Mubarak", artist: "Tum Bin 2", src: "/music/Ishq Mubarak Tum Bin 2 128 Kbps.mp3" },
  { id: "ishq-sufiyana", title: "Ishq Sufiyana", artist: "The Dirty Picture", src: "/music/Ishq Sufiyana Male The Dirty Picture 128 Kbps.mp3" },
  { id: "khat", title: "Khat", artist: "Navjot Ahuja", src: "/music/Khat Navjot Ahuja 128 Kbps.mp3" },
  { id: "tere-layi", title: "Tere Layi", artist: "Babbal Rai", src: "/music/Tere Layi [5Qv7R6hv89A].mp3" },
  { id: "tu-zaroori", title: "Tu Zaroori", artist: "Zid", src: "/music/Tu Zaroori Zid 128 Kbps.mp3" },
  { id: "tere-liye", title: "Tere Liye", artist: "Prince", src: "/music/Tere Liye Prince 128 Kbps.mp3" },
  { id: "teri-saanson-mein", title: "Teri Saanson Mein", artist: "KoshallWorld", src: "/music/Teri Saanson Mein(KoshalWorld.Com).mp3" },
];

export default function MusicBar({
  music,
  setMusic,
  audioRef,
  open,
  setOpen,
  required = false,
}: {
  music: MusicState;
  setMusic: (m: MusicState) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  open: boolean;
  setOpen: (v: boolean) => void;
  required?: boolean;
}) {
  const [level, setLevel] = useState(0);
  const [songs, setSongs] = useState<Song[]>(DEFAULT_SONGS);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const [volume, setVolume] = useState(0.7);

  const fileRef = useRef<HTMLInputElement>(null);
  const animRef = useRef<number>(0);

  /*
  |--------------------------------------------------------------------------
  | Force music popup before password
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (required && !music.url) {
      setOpen(true);
    }
  }, [required, music.url, setOpen]);

  /*
  |--------------------------------------------------------------------------
  | Play selected song
  |--------------------------------------------------------------------------
  */

  const playSong = async (song: Song) => {
    const audio = audioRef.current;

    setSelectedId(song.id);
    setPreviewId(song.id);

    setMusic({
      url: song.src,
      name: song.title,
      playing: true,
    });

    if (!audio) return;

    try {
      audio.pause();

      audio.src = song.src;
      audio.loop = true;
      audio.volume = volume;

      audio.load();

      await audio.play();
    } catch {
      /*
       * If the file doesn't exist yet, selection still remains valid.
       * Playback will work once the correct audio file is added.
       */
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Select song
  |--------------------------------------------------------------------------
  */

  const selectSong = async (song: Song) => {
    setSelectedId(song.id);
    setPreviewId(song.id);

    setMusic({
      url: song.src,
      name: song.title,
      playing: true,
    });

    const audio = audioRef.current;

    if (!audio) return;

    try {
      audio.pause();

      audio.src = song.src;
      audio.loop = true;
      audio.volume = volume;

      audio.load();

      await audio.play();
    } catch {
      /*
       * Browser may block playback if the file is missing.
       * Song selection still works.
       */
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Preview button
  |--------------------------------------------------------------------------
  */

  const togglePreview = async (song: Song) => {
    const audio = audioRef.current;

    if (!audio) return;

    if (previewId === song.id && music.playing) {
      audio.pause();

      setMusic({
        ...music,
        playing: false,
      });

      return;
    }

    await playSong(song);
  };

  /*
  |--------------------------------------------------------------------------
  | User uploaded song
  |--------------------------------------------------------------------------
  */

  const onFile = (file: File | undefined) => {
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      alert("Please select a valid audio file.");
      return;
    }

    const url = URL.createObjectURL(file);

    const id = `upload-${Date.now()}`;

    const cleanName = file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[_-]+/g, " ")
      .slice(0, 40);

    const uploadedSong: Song = {
      id,
      title: cleanName,
      artist: "Your upload",
      src: url,
      owner: true,
    };

    setSongs((current) => [
      ...current.filter((song) => !song.owner),
      uploadedSong,
    ]);

    setSelectedId(id);
    setPreviewId(id);

    setMusic({
      url,
      name: cleanName,
      playing: true,
    });

    setTimeout(async () => {
      const audio = audioRef.current;

      if (!audio) return;

      try {
        audio.pause();

        audio.src = url;
        audio.loop = true;
        audio.volume = volume;

        audio.load();

        await audio.play();
      } catch {
        // Browser autoplay restriction.
      }
    }, 50);

    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Mini player
  |--------------------------------------------------------------------------
  */

  const togglePlayer = () => {
    setOpen(true);
  };

  /*
  |--------------------------------------------------------------------------
  | Continue to password
  |--------------------------------------------------------------------------
  */

  const continueToPassword = async () => {
    if (!music.url) return;

    setOpen(false);

    const audio = audioRef.current;

    if (audio && music.playing) {
      try {
        await audio.play();
      } catch {
        // Password interaction can start it later.
      }
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Audio settings
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.loop = true;
    audio.volume = volume;
  }, [volume, audioRef]);

  // Only load a new source when the selected URL actually changes.
  // Play/pause and volume changes never touch currentTime or call load().
  const loadedUrlRef = useRef<string | null>(null);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !music.url || loadedUrlRef.current === music.url) return;
    if (audio.src === new URL(music.url, window.location.href).href) {
      loadedUrlRef.current = music.url;
      return;
    }
    loadedUrlRef.current = music.url;
    audio.pause();
    audio.src = music.url;
    audio.loop = true;
    audio.volume = volume;
    audio.load();
    if (music.playing) audio.play().catch(() => {});
  }, [music.url, music.playing, volume, audioRef]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !music.url || loadedUrlRef.current !== music.url) return;
    if (music.playing && audio.paused) audio.play().catch(() => {});
    if (!music.playing && !audio.paused) audio.pause();
  }, [music.playing, music.url, audioRef]);

  /*
  |--------------------------------------------------------------------------
  | Equalizer animation
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const loop = () => {
      if (music.playing) {
        setLevel(0.4 + Math.random() * 0.6);
      } else {
        setLevel((value) => value * 0.9);
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [music.playing]);

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <>
      <audio
        ref={audioRef}
        loop
        preload="auto"
      />

      {/* ================================================================
          MUSIC SELECTION MODAL
      ================================================================ */}

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-black/65 px-4 py-8 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{
                opacity: 0,
                y: 30,
                scale: 0.94,
                rotateX: 3,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                rotateX: 0,
              }}
              exit={{
                opacity: 0,
                y: 18,
                scale: 0.96,
              }}
              transition={{
                type: "spring",
                stiffness: 180,
                damping: 20,
              }}
              onClick={(event) => event.stopPropagation()}
              className="relative w-full max-w-[680px] overflow-hidden rounded-[26px] border border-[#c9a35c]/35 bg-[linear-gradient(155deg,rgba(42,8,25,.98),rgba(12,3,12,.98))] shadow-[0_40px_120px_rgba(0,0,0,.8)]"
            >
              {/* Decorative glow */}

              <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-pink-400/10 blur-3xl" />

              <div className="pointer-events-none absolute -bottom-24 -right-10 h-64 w-64 rounded-full bg-[#c9a35c]/10 blur-3xl" />

              {/* ==========================================================
                  HEADER
              ========================================================== */}

              <div className="relative border-b border-white/10 px-5 pb-4 pt-5 sm:px-7 sm:pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-[#e8c476]">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#c9a35c]/35 bg-[#c9a35c]/10">
                        <Music size={13} />
                      </span>

                      A little soundtrack
                    </div>

                    <h2 className="font-display text-[28px] font-bold leading-tight text-[#fff2d0] sm:text-[34px]">
                      Our soundtrack ♫
                    </h2>

                    <p className="mt-1.5 text-[13px] text-white/55 sm:text-[14px]">
                      Change the song anytime — it stays with you through the whole journey.
                    </p>
                  </div>

                  {!required && (
                    <button
                      onClick={() => setOpen(false)}
                      className="shrink-0 rounded-full border border-white/10 bg-white/5 p-2 text-white/45 transition hover:bg-white/10 hover:text-white"
                      aria-label="Close music room"
                    >
                      <X size={17} />
                    </button>
                  )}
                </div>
              </div>

              {/* ==========================================================
                  NOW PLAYING
              ========================================================== */}
              {music.url && (
                <div className="relative mx-5 mt-4 overflow-hidden rounded-2xl border border-pink-300/25 bg-gradient-to-br from-[#321024]/90 via-[#1c0815]/90 to-black/50 p-4 shadow-[0_12px_45px_rgba(0,0,0,.35)] sm:mx-7">
                  <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-pink-400/15 blur-3xl" />
                  <div className="relative flex items-center gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-[#f3d894]/35 bg-gradient-to-br from-pink-500/35 via-[#c9a35c]/25 to-[#3b0d24] shadow-inner">
                      <Disc3 size={28} className={`text-[#f3d894] ${music.playing ? "animate-spin" : ""}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#f3d894]/75">Now Playing</p>
                      <p className="mt-0.5 truncate font-display text-[17px] font-bold text-white">{music.name}</p>
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[42%] rounded-full bg-gradient-to-r from-pink-400 to-[#f3d894]" /></div>
                    </div>
                    <button onClick={() => { const a=audioRef.current; if(!a) return; if(a.paused){a.play().then(()=>setMusic({...music,playing:true})).catch(()=>{});} else {a.pause(); setMusic({...music,playing:false});} }} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f3d894] to-[#b27b25] text-[#1d0f04] shadow-lg">
                      {music.playing ? <Pause size={16}/> : <Play size={16}/>}
                    </button>
                  </div>
                </div>
              )}

              {/* ==========================================================
                  SONG LIST
              ========================================================== */}

              <div
                className="relative max-h-[52vh] overflow-y-auto px-5 py-4 sm:px-7"
                style={{
                  scrollbarWidth: "thin",
                }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/35">
                    Choose from our songs
                  </p>

                  <span className="text-[10px] text-[#f3d894]/55">
                    {songs.length} available
                  </span>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2">
                  {songs.map((song, index) => {
                    const selected =
                      selectedId === song.id ||
                      music.name === song.title;

                    const playing =
                      previewId === song.id &&
                      music.playing;

                    return (
                      <motion.div
                        key={song.id}
                        layout
                        whileHover={{
                          y: -2,
                        }}
                        onClick={() => selectSong(song)}
                        className={`group relative flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-all ${
                          selected
                            ? "border-[#e8c476]/75 bg-[#c9a35c]/12 shadow-[0_0_24px_rgba(201,163,92,.12)]"
                            : "border-white/10 bg-white/[0.035] hover:border-[#c9a35c]/35 hover:bg-white/[0.06]"
                        }`}
                      >
                        {/* Number / disc */}

                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                            selected
                              ? "border-[#f3d894]/45 bg-[#c9a35c]/20 text-[#f3d894]"
                              : "border-white/10 bg-black/20 text-white/45"
                          }`}
                        >
                          {playing ? (
                            <Disc3
                              size={18}
                              className="animate-spin"
                            />
                          ) : (
                            <span className="text-[12px] font-bold">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                          )}
                        </div>

                        {/* Song info */}

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-white/90">
                            {song.title}
                          </p>

                          <p className="truncate text-[10px] uppercase tracking-[0.14em] text-white/35">
                            {song.artist}
                          </p>
                        </div>

                        {/* Preview */}

                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            togglePreview(song);
                          }}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/65 transition hover:border-[#e8c476]/40 hover:bg-[#c9a35c]/15 hover:text-[#f3d894]"
                          aria-label={
                            playing
                              ? `Pause ${song.title}`
                              : `Preview ${song.title}`
                          }
                        >
                          {playing ? (
                            <Pause size={13} />
                          ) : (
                            <Play size={13} />
                          )}
                        </button>

                        {/* Selected check */}

                        {selected && (
                          <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#f3d894] text-[#2b0c12]">
                            <Check
                              size={10}
                              strokeWidth={3}
                            />
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* ========================================================
                    UPLOAD OWN SONG
                ======================================================== */}

                <input
                  ref={fileRef}
                  type="file"
                  accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg"
                  className="hidden"
                  onChange={(event) =>
                    onFile(event.target.files?.[0])
                  }
                />

                <button
                  onClick={() => fileRef.current?.click()}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#c9a35c]/35 bg-[#c9a35c]/[0.045] px-4 py-3 text-[12px] font-semibold text-[#f3d894]/80 transition hover:border-[#e8c476]/65 hover:bg-[#c9a35c]/10 hover:text-[#fff2d0]"
                >
                  <Upload size={15} />

                  Upload your own song

                  <span className="text-white/25">
                    •
                  </span>

                  MP3 / WAV / M4A
                </button>
              </div>

              {/* ==========================================================
                  FOOTER
              ========================================================== */}

              <div className="relative border-t border-white/10 bg-black/20 px-5 py-4 sm:px-7">
                {music.url && (
                  <div className="mb-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2.5">
                    <Volume2
                      size={15}
                      className="shrink-0 text-[#e8c476]"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-semibold text-white/80">
                        Selected: {music.name}
                      </p>

                      <p className="text-[9px] uppercase tracking-[0.18em] text-emerald-300/65">
                        {music.playing
                          ? "preview playing"
                          : "ready for your secret"}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        const audio = audioRef.current;
                        if (!audio) return;
                        if (audio.paused) {
                          audio.play().then(() => setMusic({ ...music, playing: true })).catch(() => {});
                        } else {
                          audio.pause();
                          setMusic({ ...music, playing: false });
                        }
                      }}
                      className="rounded-full bg-white/10 p-2 text-white/75 hover:bg-white/15"
                    >
                      {music.playing ? <Pause size={13} /> : <Play size={13} />}
                    </button>
                  </div>
                )}

                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                  {/* Volume */}

                  <div className="flex flex-1 items-center gap-2">
                    <span className="text-[9px] uppercase tracking-[0.16em] text-white/30">
                      Volume
                    </span>

                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={(event) =>
                        setVolume(Number(event.target.value))
                      }
                      className="w-full max-w-[150px] accent-[#d8b76d]"
                    />
                  </div>

                  {/* Continue */}

                  <button
                    disabled={!music.url}
                    onClick={continueToPassword}
                    className="btn-gold flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13px] font-bold disabled:cursor-not-allowed disabled:opacity-35 sm:w-auto sm:min-w-[260px]"
                  >
                    Continue to our little secret

                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================================================
          BOTTOM RIGHT MINI PLAYER
      ================================================================ */}

      <div className="fixed bottom-[5.5rem] right-3 z-[90] sm:bottom-6 sm:right-6">
        <AnimatePresence>
          {music.playing && !open && (
            <motion.div
              initial={{
                opacity: 0,
                y: 8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: 8,
              }}
              className="absolute -top-8 right-1 whitespace-nowrap rounded-full border border-[#c9a35c]/20 bg-black/45 px-2.5 py-1 text-[9px] uppercase tracking-[0.15em] text-[#f3d894]/70 backdrop-blur-xl"
            >
              now playing ♥
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={togglePlayer}
          whileTap={{
            scale: 0.92,
          }}
          animate={
            !music.url && !open
              ? {
                  y: [0, -3, 0],
                  boxShadow: [
                    "0 10px 40px rgba(0,0,0,.6)",
                    "0 10px 50px rgba(201,163,92,.35)",
                    "0 10px 40px rgba(0,0,0,.6)",
                  ],
                }
              : undefined
          }
          transition={
            !music.url && !open
              ? {
                  repeat: Infinity,
                  duration: 2.6,
                  ease: "easeInOut",
                }
              : undefined
          }
          className={`group relative z-[90] flex items-center gap-2.5 rounded-full border border-[#c9a35c]/40 bg-[#150a12]/90 py-2 pl-2.5 pr-4 shadow-[0_10px_40px_rgba(0,0,0,.6)] backdrop-blur-xl sm:right-0 ${
            !music.url
              ? "ring-1 ring-[#c9a35c]/15"
              : ""
          }`}
        >
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#f3d894] to-[#8a5a22] text-[#1d0f04]">
            {music.url && music.playing ? (
              <Pause size={16} />
            ) : (
              <Music size={16} />
            )}

            {!music.url && !open && (
              <span className="absolute -right-0.5 -top-0.5 h-3 w-3 animate-ping rounded-full bg-pink-400/80" />
            )}
          </span>

          <span className="max-w-[155px] truncate text-left text-[12px] font-medium text-white/85">
            {music.url
              ? music.name
              : "Choose our song"}
          </span>

          {/* Equalizer */}

          <span className="flex h-5 items-end gap-[2.5px]">
            {[0, 1, 2, 3].map((index) => (
              <span
                key={index}
                className="w-[3px] rounded-full bg-gradient-to-t from-[#c9a35c] to-pink-300 transition-all duration-150"
                style={{
                  height: music.playing
                    ? `${
                        6 +
                        Math.abs(
                          Math.sin(
                            Date.now() * 0.004 +
                              index * 1.4
                          )
                        ) *
                          14 *
                          (0.5 + level * 0.5)
                      }px`
                    : "4px",
                  opacity: music.playing ? 1 : 0.35,
                }}
              />
            ))}
          </span>
        </motion.button>
      </div>
    </>
  );
}