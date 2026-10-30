import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Heart, Images, Play, Sparkles, Upload, Video, X } from "lucide-react";
import { MEMORIES } from "../data/content";
import type { MusicState } from "./MusicBar";

type VideoMemory = {
  id: string;
  title: string;
  note: string;
  src: string;
  poster?: string;
  owner?: boolean;
};

const VIDEO_MEMORIES: VideoMemory[] = [];

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export default function Memories({
  onNext,
  music,
  setMusic,
  audioRef,
}: {
  onNext: () => void;
  music: MusicState;
  setMusic: (m: MusicState) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [videoIndex, setVideoIndex] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [videoLightbox, setVideoLightbox] = useState<number | null>(null);
  const [videos, setVideos] = useState<VideoMemory[]>(VIDEO_MEMORIES);
  const [wasMusicPlaying, setWasMusicPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const activePhoto = MEMORIES[photoIndex];
  const activeVideo = videos[videoIndex];

  const pauseBackgroundMusic = () => {
    const audio = audioRef.current;
    const playing = Boolean(audio && music.playing && !audio.paused);
    setWasMusicPlaying(playing);
    if (playing && audio) audio.pause();
  };

  const resumeBackgroundMusic = async () => {
    const audio = audioRef.current;
    if (!wasMusicPlaying || !audio || !music.url) return;
    try {
      await audio.play();
      setMusic({ ...music, playing: true });
    } catch {
      // Browser may require a user gesture; closing the modal is still fine.
    }
    setWasMusicPlaying(false);
  };

  const openPhoto = (index: number) => {
    setPhotoIndex(index);
    pauseBackgroundMusic();
    setLightbox(index);
  };

  const closePhoto = () => {
    setLightbox(null);
    void resumeBackgroundMusic();
  };

  const openVideo = (index: number) => {
    setVideoIndex(index);
    pauseBackgroundMusic();
    setVideoLightbox(index);
    window.setTimeout(() => {
      videoRef.current?.play().catch(() => undefined);
    }, 80);
  };

  const closeVideo = () => {
    videoRef.current?.pause();
    setVideoLightbox(null);
    void resumeBackgroundMusic();
  };

  const movePhoto = (delta: number) => {
    setPhotoIndex((current) => clamp(current + delta, 0, MEMORIES.length - 1));
  };

  const moveVideo = (delta: number) => {
    if (!videos.length) return;
    setVideoIndex((current) => clamp(current + delta, 0, videos.length - 1));
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (lightbox !== null || videoLightbox !== null) {
        if (event.key === "Escape") {
          if (videoLightbox !== null) closeVideo();
          else closePhoto();
        }
        return;
      }
      if (event.key === "ArrowLeft") movePhoto(-1);
      if (event.key === "ArrowRight") movePhoto(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const photoItems = useMemo(() => {
    return MEMORIES.map((m, i) => ({ ...m, index: i }));
  }, []);

  const uploadVideo = (file: File | undefined) => {
    if (!file || !file.type.startsWith("video/")) {
      if (file) alert("Please select a valid video file.");
      return;
    }
    const src = URL.createObjectURL(file);
    const item: VideoMemory = {
      id: `uploaded-${Date.now()}`,
      title: file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").slice(0, 42),
      note: "A little moving memory, saved just for us.",
      src,
      poster: activePhoto?.img,
      owner: true,
    };
    setVideos((current) => [...current, item]);
    setVideoIndex(videos.length);
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const wheelHandler = (event: React.WheelEvent, move: (delta: number) => void) => {
    event.preventDefault();
    if (Math.abs(event.deltaY) < 3) return;
    move(event.deltaY > 0 ? 1 : -1);
  };

  return (
    <div className="stage-page memories-page relative flex min-h-[100svh] w-full flex-col items-center overflow-hidden px-4 py-10 sm:px-6 lg:py-8">
      <div className="spotlight-beam pointer-events-none absolute inset-x-0 top-0 mx-auto h-[70vh] w-full" />

      <div className="relative z-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#c9a35c]/35 bg-[#170712]/75 px-4 py-1.5 shadow-[0_0_24px_rgba(201,163,92,.2)] backdrop-blur-md">
          <Sparkles size={13} className="text-[#f3d894]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#f3d894]">Chapter 05 • Us, in Frames</span>
          <Sparkles size={13} className="text-[#f3d894]" />
        </div>
        <h2 className="font-display mt-3 text-3xl font-bold sm:text-5xl"><span className="gold-text">Floating Memories Gallery</span></h2>
        <p className="mt-2 font-serif2 text-[18px] italic text-white/70">Scroll through our moments — every frame is a quiet little miracle of us.</p>
      </div>

      <div className="relative z-10 mt-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-white/45">
        <span className="inline-flex items-center gap-1.5"><Images size={13} className="text-pink-200" /> Images</span>
        <span>•</span>
        <span className="inline-flex items-center gap-1.5"><Video size={13} className="text-pink-200" /> Videos</span>
        <span>•</span>
        <span>Scroll / swipe the curves</span>
      </div>

      <div className="relative z-10 mt-5 grid w-full max-w-7xl grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-7">
        {/* IMAGE ARC */}
        <section className="memory-media-panel">
          <div className="memory-panel-heading">
            <div><span>01</span><h3>Images</h3><p>Little pieces of our story, frozen in time.</p></div>
            <span className="memory-counter">{String(photoIndex + 1).padStart(2, "0")} / {String(MEMORIES.length).padStart(2, "0")}</span>
          </div>

          <div
            className="memory-arc-wrap"
            onWheel={(e) => wheelHandler(e, movePhoto)}
            onTouchStart={(e) => ((e.currentTarget as HTMLElement).dataset.touchY = String(e.touches[0].clientY))}
            onTouchEnd={(e) => {
              const start = Number((e.currentTarget as HTMLElement).dataset.touchY || 0);
              const delta = start - e.changedTouches[0].clientY;
              if (Math.abs(delta) > 28) movePhoto(delta > 0 ? 1 : -1);
            }}
          >
            <div className="memory-arc-line memory-arc-line-left" />
            <motion.div className="memory-arc-orbit" animate={{ rotate: photoIndex * -11 }} transition={{ type: "spring", stiffness: 85, damping: 18 }}>
              {photoItems.map((m) => {
                const distance = m.index - photoIndex;
                const abs = Math.abs(distance);
                const visible = abs <= 3;
                const top = 50 + distance * 17;
                const left = 50 + Math.sign(distance || 0) * Math.min(13, abs * 5.5) + (distance === 0 ? 0 : distance * 0.8);
                return (
                  <motion.button
                    key={m.index}
                    type="button"
                    onClick={() => openPhoto(m.index)}
                    animate={{ top: `${top}%`, left: `${left}%`, scale: m.index === photoIndex ? 1.16 : Math.max(.72, 1 - abs * .09), opacity: visible ? (m.index === photoIndex ? 1 : .74) : 0 }}
                    transition={{ type: "spring", stiffness: 110, damping: 18 }}
                    className={`memory-arc-card ${m.index === photoIndex ? "is-active" : ""}`}
                    style={{ zIndex: 20 - abs }}
                    aria-label={`Open ${m.caption}`}
                  >
                    <img src={m.img} alt={m.caption} draggable={false} />
                    <span>{m.date.replace(/^Chapter [IVX]+ — /, "")}</span>
                  </motion.button>
                );
              })}
            </motion.div>

            <div className="memory-feature-card">
              <img src={activePhoto.img} alt={activePhoto.caption} draggable={false} />
              <div className="memory-feature-shade" />
              <div className="memory-feature-copy">
                <span>{activePhoto.date}</span>
                <h4>{activePhoto.caption}</h4>
                <p>{activePhoto.note}</p>
                <button type="button" onClick={() => openPhoto(photoIndex)} className="memory-open-btn">Tap to open full screen <ChevronRight size={14} /></button>
              </div>
            </div>

            <button type="button" onClick={() => movePhoto(-1)} className="memory-arrow memory-arrow-left" aria-label="Previous image"><ChevronLeft size={18} /></button>
            <button type="button" onClick={() => movePhoto(1)} className="memory-arrow memory-arrow-right" aria-label="Next image"><ChevronRight size={18} /></button>
          </div>
        </section>

        {/* VIDEO ARC */}
        <section className="memory-media-panel">
          <div className="memory-panel-heading">
            <div><span>02</span><h3>Videos</h3><p>Watch our little moments come alive with sound.</p></div>
            <button type="button" onClick={() => videoInputRef.current?.click()} className="memory-upload"><Upload size={13} /> Add video</button>
          </div>

          <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => uploadVideo(e.target.files?.[0])} />

          <div
            className="memory-arc-wrap"
            onWheel={(e) => wheelHandler(e, moveVideo)}
            onTouchStart={(e) => ((e.currentTarget as HTMLElement).dataset.touchY = String(e.touches[0].clientY))}
            onTouchEnd={(e) => {
              const start = Number((e.currentTarget as HTMLElement).dataset.touchY || 0);
              const delta = start - e.changedTouches[0].clientY;
              if (Math.abs(delta) > 28) moveVideo(delta > 0 ? 1 : -1);
            }}
          >
            <div className="memory-arc-line memory-arc-line-right" />
            {videos.length > 0 ? (
              <>
                <motion.div className="memory-arc-orbit" animate={{ rotate: videoIndex * 11 }} transition={{ type: "spring", stiffness: 85, damping: 18 }}>
                  {videos.map((v, i) => {
                    const distance = i - videoIndex;
                    const abs = Math.abs(distance);
                    return (
                      <motion.button
                        key={v.id}
                        type="button"
                        onClick={() => openVideo(i)}
                        animate={{ top: `${50 + distance * 17}%`, left: `${50 - Math.sign(distance || 0) * Math.min(13, abs * 5.5)}%`, scale: i === videoIndex ? 1.16 : Math.max(.72, 1 - abs * .09), opacity: abs <= 3 ? (i === videoIndex ? 1 : .74) : 0 }}
                        transition={{ type: "spring", stiffness: 110, damping: 18 }}
                        className={`memory-arc-card video-thumb ${i === videoIndex ? "is-active" : ""}`}
                      >
                        <video src={v.src} poster={v.poster} muted playsInline preload="metadata" />
                        <span className="memory-play-mini"><Play size={13} fill="currentColor" /></span>
                      </motion.button>
                    );
                  })}
                </motion.div>

                <div className="memory-feature-card video-feature-card">
                  <video src={activeVideo.src} poster={activeVideo.poster} muted playsInline preload="metadata" />
                  <div className="memory-feature-shade" />
                  <div className="memory-feature-copy">
                    <span>Video memory {String(videoIndex + 1).padStart(2, "0")}</span>
                    <h4>{activeVideo.title}</h4>
                    <p>{activeVideo.note}</p>
                    <button type="button" onClick={() => openVideo(videoIndex)} className="memory-open-btn"><Play size={13} fill="currentColor" /> Tap to watch full screen</button>
                  </div>
                </div>
                <button type="button" onClick={() => moveVideo(-1)} className="memory-arrow memory-arrow-left" aria-label="Previous video"><ChevronLeft size={18} /></button>
                <button type="button" onClick={() => moveVideo(1)} className="memory-arrow memory-arrow-right" aria-label="Next video"><ChevronRight size={18} /></button>
              </>
            ) : (
              <div className="memory-video-empty">
                <div className="memory-video-empty-icon"><Video size={28} /></div>
                <h4>Your moving memories</h4>
                <p>Upload your first video and it will join this curved reel. Tap it anytime for a full-screen player.</p>
                <button type="button" onClick={() => videoInputRef.current?.click()} className="btn-gold rounded-full px-5 py-2.5 text-[12px] font-bold"><Upload size={14} /> Add your first video</button>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="relative z-10 mt-5 flex flex-wrap items-center justify-center gap-3">
        <span className="flex items-center gap-2 font-script text-[25px] text-pink-200">made of little forevers <Heart size={15} className="fill-pink-400 text-pink-400" /></span>
        <button onClick={onNext} className="btn-gold flex items-center gap-2 rounded-full px-7 py-3 text-[13px] font-bold shadow-[0_10px_35px_rgba(201,163,92,.35)]">I have a game for you <ChevronRight size={16} /></button>
      </div>

      {/* PHOTO FULLSCREEN */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex items-center justify-center bg-[#09030c]/95 p-3 backdrop-blur-xl" onClick={closePhoto}>
            <motion.div initial={{ scale: .92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: .94, opacity: 0 }} className="relative flex h-full w-full items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <img src={MEMORIES[lightbox].img} alt={MEMORIES[lightbox].caption} className="max-h-[94vh] max-w-[94vw] rounded-2xl object-contain shadow-[0_30px_100px_rgba(0,0,0,.8)]" />
              <div className="absolute bottom-5 left-1/2 w-[min(680px,90vw)] -translate-x-1/2 rounded-2xl border border-white/10 bg-black/45 px-5 py-3 text-center backdrop-blur-xl">
                <p className="text-[10px] font-bold uppercase tracking-[.28em] text-[#f3d894]">{MEMORIES[lightbox].date}</p>
                <h3 className="font-serif2 mt-1 text-xl font-semibold text-white">{MEMORIES[lightbox].caption}</h3>
              </div>
              <button type="button" onClick={closePhoto} className="absolute right-3 top-3 rounded-full border border-white/15 bg-black/55 p-3 text-white shadow-xl"><X size={19} /></button>
              <button type="button" onClick={() => { const n = clamp(lightbox - 1, 0, MEMORIES.length - 1); setLightbox(n); setPhotoIndex(n); }} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-black/55 p-3 text-white"><ChevronLeft size={22} /></button>
              <button type="button" onClick={() => { const n = clamp(lightbox + 1, 0, MEMORIES.length - 1); setLightbox(n); setPhotoIndex(n); }} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-black/55 p-3 text-white"><ChevronRight size={22} /></button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VIDEO FULLSCREEN */}
      <AnimatePresence>
        {videoLightbox !== null && activeVideo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] flex items-center justify-center bg-black p-2 sm:p-5" onClick={closeVideo}>
            <motion.div initial={{ scale: .94 }} animate={{ scale: 1 }} exit={{ scale: .96 }} className="relative flex h-full w-full items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <video ref={videoRef} src={activeVideo.src} poster={activeVideo.poster} controls autoPlay playsInline className="max-h-[96vh] max-w-[96vw] rounded-xl object-contain shadow-[0_30px_120px_rgba(0,0,0,.9)]" />
              <button type="button" onClick={closeVideo} className="absolute right-1 top-1 rounded-full border border-white/15 bg-black/70 p-3 text-white shadow-xl sm:right-3 sm:top-3"><X size={19} /></button>
              <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/55 px-4 py-2 text-[11px] font-semibold text-white/80 backdrop-blur-xl">{activeVideo.title}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
