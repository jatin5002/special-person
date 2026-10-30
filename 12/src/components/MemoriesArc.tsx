import {
  useCallback, useEffect, useRef, useState,
  type ChangeEvent, type PointerEvent as ReactPointerEvent,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight,
  Film, Heart, ImagePlus, LoaderCircle, Mouse, Music2, Pause, Play, Plus, X,
} from "lucide-react";
import type { MusicState } from "./MusicBar";
import OrbitRail from "./memories/OrbitRail";
import MemoryPlayer from "./memories/MemoryPlayer";
import MemoryLightbox from "./memories/MemoryLightbox";
import {
  gallerySession, makeLocalVideoPoster, wrapIndex,
  type GalleryMedia, type MediaKind,
} from "./memories/galleryMedia";
import "./memories/memories.css";

function useElementSize() {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (!element) return;
    const measure = () => setSize({ width: element.clientWidth, height: element.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);
  return { setElement, element, ...size };
}

function useDesktop() {
  const [desktop, setDesktop] = useState(() => window.matchMedia("(min-width: 1024px)").matches);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return desktop;
}

function MobileRail({ items, cursor, kind, onSelect, onStep }: {
  items: GalleryMedia[];
  cursor: number;
  kind: MediaKind;
  onSelect: (cursor: number) => void;
  onStep: (direction: number) => void;
}) {
  const { setElement, width, height } = useElementSize();
  return (
    <div className={`memory-mobile-browser memory-mobile-browser--${kind}`}>
      <div className="memory-mobile-browser-label">
        <span>{kind === "photo" ? "THE PHOTO ARCHIVE" : "OUR LITTLE FILMS"}</span>
        <span>{String(wrapIndex(cursor, items.length) + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}</span>
      </div>
      <div ref={setElement} className="memory-mobile-curve">
        <OrbitRail items={items} cursor={cursor} kind={kind} width={width} height={height} horizontal onSelect={onSelect} />
      </div>
      <div className="memory-mobile-browser-controls">
        <button type="button" onClick={() => onStep(-1)} aria-label={`Previous ${kind}`}><ChevronLeft size={17} /></button>
        <span>Swipe to find your favourite</span>
        <button type="button" onClick={() => onStep(1)} aria-label={`Next ${kind}`}><ChevronRight size={17} /></button>
      </div>
    </div>
  );
}

export default function Memories({ onNext, music, setMusic }: {
  onNext: () => void;
  music: MusicState;
  setMusic: (music: MusicState) => void;
}) {
  const desktop = useDesktop();
  const reducedMotion = useReducedMotion();
  const scene = useElementSize();
  const [photos, setPhotos] = useState<GalleryMedia[]>(() => gallerySession.photos);
  const [videos, setVideos] = useState<GalleryMedia[]>(() => gallerySession.videos);
  const [photoCursor, setPhotoCursor] = useState(gallerySession.photoCursor);
  const [videoCursor, setVideoCursor] = useState(gallerySession.videoCursor);
  const [autoplay, setAutoplay] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [lightbox, setLightbox] = useState<{ kind: MediaKind; cursor: number } | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState("");
  const [uploadError, setUploadError] = useState("");
  const photoInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const musicInput = useRef<HTMLInputElement>(null);
  const uploadPanel = useRef<HTMLDivElement>(null);
  const activeSide = useRef<MediaKind>("photo");
  const playingSources = useRef({ inline: false, lightbox: false });
  const pausedSong = useRef<string | null>(null);
  const currentMusic = useRef(music);
  const mounted = useRef(true);
  const wheel = useRef({ amount: 0, lastTime: 0, lastStep: 0 });
  const drag = useRef<{ side: MediaKind; position: number; start: number; moved: boolean } | null>(null);
  const ignoreClick = useRef(false);
  currentMusic.current = music;

  const photo = photos[wrapIndex(photoCursor, photos.length)];
  const video = videos[wrapIndex(videoCursor, videos.length)];

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    gallerySession.photoCursor = photoCursor;
    gallerySession.videoCursor = videoCursor;
  }, [photoCursor, videoCursor]);

  const advance = useCallback((kind: MediaKind, direction: number) => {
    activeSide.current = kind;
    setAutoplay(false);
    if (kind === "photo") setPhotoCursor((cursor) => cursor + direction);
    else setVideoCursor((cursor) => cursor + direction);
  }, []);

  const select = (kind: MediaKind, cursor: number) => {
    activeSide.current = kind;
    setAutoplay(false);
    if (kind === "photo") setPhotoCursor(cursor);
    else setVideoCursor(cursor);
  };

  useEffect(() => {
    if (!autoplay || lightbox || videoPlaying || uploadOpen) return;
    const timer = window.setInterval(() => {
      setPhotoCursor((cursor) => cursor + 1);
      setVideoCursor((cursor) => cursor + 1);
    }, 6200);
    return () => window.clearInterval(timer);
  }, [autoplay, lightbox, videoPlaying, uploadOpen]);

  useEffect(() => {
    if (!scene.element || !desktop || lightbox || uploadOpen) return;
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.target instanceof HTMLInputElement) return;
      if (event.target instanceof Element && event.target.closest(".memory-player")) return;
      // Short desktop windows still need normal page scrolling outside the rails.
      if (scene.element!.clientHeight > window.innerHeight + 4 &&
        event.target instanceof Element && !event.target.closest("[data-orbit-side]")) return;
      const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (!delta) return;
      event.preventDefault();
      const now = performance.now();
      if (now - wheel.current.lastTime > 180) wheel.current.amount = 0;
      wheel.current.lastTime = now;
      if (now - wheel.current.lastStep < 380) return;
      wheel.current.amount += delta * (event.deltaMode === 1 ? 16 : 1);
      if (Math.abs(wheel.current.amount) < 35) return;
      const rect = scene.element!.getBoundingClientRect();
      const kind = event.clientX - rect.left < rect.width / 2 ? "photo" : "video";
      advance(kind, wheel.current.amount > 0 ? 1 : -1);
      wheel.current = { amount: 0, lastTime: now, lastStep: now };
    };
    scene.element.addEventListener("wheel", onWheel, { passive: false });
    return () => scene.element?.removeEventListener("wheel", onWheel);
  }, [scene.element, desktop, lightbox, uploadOpen, advance]);

  useEffect(() => {
    if (lightbox) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof Element && event.target.closest("input, textarea, video, [contenteditable=true], .memory-player")) return;
      if (event.key === "Escape") setUploadOpen(false);
      if (uploadOpen) return;
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
        event.preventDefault();
        advance(activeSide.current, event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, uploadOpen, advance]);

  useEffect(() => {
    if (!uploadOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !uploadPanel.current?.contains(event.target)) setUploadOpen(false);
    };
    window.addEventListener("pointerdown", closeOutside);
    return () => window.removeEventListener("pointerdown", closeOutside);
  }, [uploadOpen]);

  const updatePlaying = useCallback((source: "inline" | "lightbox", playing: boolean) => {
    if (!mounted.current) return;
    playingSources.current[source] = playing;
    const anyPlaying = playingSources.current.inline || playingSources.current.lightbox;
    setVideoPlaying(anyPlaying);
    const song = currentMusic.current;
    if (anyPlaying && song.playing && song.url) {
      pausedSong.current = song.url;
      setMusic({ ...song, playing: false });
    } else if (!anyPlaying && pausedSong.current) {
      if (song.url === pausedSong.current) setMusic({ ...song, playing: true });
      pausedSong.current = null;
    }
  }, [setMusic]);

  const onInlinePlaying = useCallback((playing: boolean) => updatePlaying("inline", playing), [updatePlaying]);
  const onLightboxPlaying = useCallback((playing: boolean) => updatePlaying("lightbox", playing), [updatePlaying]);

  useEffect(() => () => {
    if (pausedSong.current && currentMusic.current.url === pausedSong.current) setMusic({ ...currentMusic.current, playing: true });
  }, [setMusic]);

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (lightbox || event.button !== 0 || !(event.target instanceof Element)) return;
    const target = event.target.closest<HTMLElement>("[data-orbit-side]");
    const mobileRail = event.target.closest(".memory-mobile-curve");
    if (!target && !mobileRail) return;
    const side = (target?.dataset.orbitSide || (mobileRail?.closest(".memory-mobile-browser--photo") ? "photo" : "video")) as MediaKind;
    activeSide.current = side;
    const position = desktop ? event.clientY : event.clientX;
    drag.current = { side, position, start: position, moved: false };
    ignoreClick.current = false;
  };

  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state) return;
    const position = desktop ? event.clientY : event.clientX;
    if (Math.abs(position - state.start) > 8 && !state.moved) {
      state.moved = true;
      ignoreClick.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    const delta = position - state.position;
    if (Math.abs(delta) >= (desktop ? 52 : 42)) {
      advance(state.side, delta < 0 ? 1 : -1);
      state.position = position;
    }
  };

  const stopDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    window.setTimeout(() => { ignoreClick.current = false; }, 0);
  };

  const openViewer = (kind: MediaKind) => {
    setAutoplay(false);
    setLightbox({ kind, cursor: kind === "photo" ? photoCursor : videoCursor });
  };

  const navigateViewer = (direction: number) => {
    if (!lightbox) return;
    const cursor = lightbox.cursor + direction;
    select(lightbox.kind, cursor);
    setLightbox({ ...lightbox, cursor });
  };

  const uploadMedia = async (kind: MediaKind, event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    setAutoplay(false);
    setNotice("");
    setUploadError("");
    const limit = kind === "photo" ? 25 : 200;
    const valid = files.filter((file) => file.type.startsWith(kind === "photo" ? "image/" : "video/") && file.size <= limit * 1024 * 1024);
    if (valid.length !== files.length) setUploadError(`Choose ${kind === "photo" ? "images" : "videos"} smaller than ${limit} MB each. Unsupported files were skipped.`);
    if (!valid.length) return;
    setAdding(true);
    try {
      const added = await Promise.all(valid.map(async (file, index): Promise<GalleryMedia> => {
        const source = URL.createObjectURL(file);
        return {
          id: `local-${kind}-${Date.now()}-${index}`,
          kind,
          src: source,
          poster: kind === "video" ? await makeLocalVideoPoster(source) : undefined,
          title: file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "),
          chapter: "Our personal collection",
          note: "Another little piece of our forever.",
        };
      }));
      if (kind === "photo") {
        const first = gallerySession.photos.length;
        gallerySession.photos = [...gallerySession.photos, ...added];
        gallerySession.photoCursor = first;
        if (mounted.current) { setPhotos(gallerySession.photos); setPhotoCursor(first); }
      } else {
        const first = gallerySession.videos.length;
        gallerySession.videos = [...gallerySession.videos, ...added];
        gallerySession.videoCursor = first;
        if (mounted.current) { setVideos(gallerySession.videos); setVideoCursor(first); }
      }
      if (mounted.current) setNotice(`${added.length} ${kind}${added.length > 1 ? "s" : ""} added to our story.`);
    } catch {
      if (mounted.current) setUploadError("That file could not be opened. Please try another image or MP4 video.");
    } finally {
      if (mounted.current) setAdding(false);
    }
  };

  const uploadSong = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("audio/") || file.size > 100 * 1024 * 1024) {
      setUploadError("Please choose an audio file smaller than 100 MB.");
      return;
    }
    setUploadError("");
    setMusic({ url: URL.createObjectURL(file), name: file.name.replace(/\.[^.]+$/, ""), playing: !videoPlaying });
    setNotice("Our soundtrack is ready. You can pause it below.");
  };

  return (
    <>
      <div ref={scene.setElement} className="memories-gallery" data-gallery="true"
        onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={stopDrag} onPointerCancel={stopDrag}
        onFocusCapture={(event) => {
          if (!(event.target instanceof Element)) return;
          const side = event.target.closest<HTMLElement>("[data-orbit-side]")?.dataset.orbitSide;
          if (side === "photo" || side === "video") activeSide.current = side;
        }}
        onClickCapture={(event) => {
          if (ignoreClick.current) {
            event.preventDefault(); event.stopPropagation(); ignoreClick.current = false;
          }
        }}>
        <h1 className="sr-only">For Uhh, our memories in photographs and films</h1>
        <div className="memories-signature" aria-hidden="true">for Uhh Sweetheart <span>OUR LITTLE FOREVER</span></div>

        <header className="memories-heading memories-heading--photo" onPointerEnter={() => { activeSide.current = "photo"; }}>
          <span className="memories-section-number">01 <i /></span>
          <h2>Images<span>.</span></h2>
          <p>The moments we kept.<br />The feelings that never left.</p>
        </header>

        <figure className="memory-feature memory-feature--photo" onPointerEnter={() => { activeSide.current = "photo"; }} onFocusCapture={() => { activeSide.current = "photo"; }}>
          <button type="button" className="memory-feature-frame memory-photo-frame" onClick={() => openViewer("photo")} aria-label={`View ${photo.title} fullscreen`}>
            <AnimatePresence initial={false}>
              <motion.img key={photo.id} src={photo.src} alt={photo.title} draggable={false} decoding="async"
                initial={{ opacity: 0, scale: reducedMotion ? 1 : 1.035 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.6 }} />
            </AnimatePresence>
          </button>
          <figcaption>
            <div aria-live="polite"><h3>{photo.title}</h3><p>{photo.chapter}</p></div>
            <button type="button" className="memory-view-link" onClick={() => openViewer("photo")}><ArrowRight size={21} strokeWidth={1} /><span>View full</span></button>
          </figcaption>
        </figure>

        {!desktop && <MobileRail items={photos} cursor={photoCursor} kind="photo" onSelect={(cursor) => select("photo", cursor)} onStep={(direction) => advance("photo", direction)} />}

        <header className="memories-heading memories-heading--video" onPointerEnter={() => { activeSide.current = "video"; }}>
          <span className="memories-section-number">02 <i /></span>
          <h2>Videos<span>.</span></h2>
          <p>Our story, a little more alive.<br />Some moments deserve a replay.</p>
        </header>

        {!desktop && <MobileRail items={videos} cursor={videoCursor} kind="video" onSelect={(cursor) => select("video", cursor)} onStep={(direction) => advance("video", direction)} />}

        <figure className="memory-feature memory-feature--video" onPointerEnter={() => { activeSide.current = "video"; }} onFocusCapture={() => { activeSide.current = "video"; }}>
          <div className="memory-feature-frame">
            <MemoryPlayer key={video.id} item={video} suspended={!!lightbox} onExpand={() => openViewer("video")} onPlayingChange={onInlinePlaying} />
          </div>
          <figcaption>
            <div aria-live="polite"><h3>{video.title}</h3><p>{video.chapter} <span className="memory-meta-separator">/</span> In motion</p></div>
            <button type="button" className="memory-view-link" onClick={() => openViewer("video")}><ArrowRight size={21} strokeWidth={1} /><span>Watch full</span></button>
          </figcaption>
        </figure>

        {desktop && (
          <>
            <div className="memories-orbits">
              <OrbitRail kind="photo" items={photos} cursor={photoCursor} width={scene.width} height={scene.height} onSelect={(cursor) => select("photo", cursor)} />
              <OrbitRail kind="video" items={videos} cursor={videoCursor} width={scene.width} height={scene.height} onSelect={(cursor) => select("video", cursor)} />
            </div>
            <button type="button" className="memory-orbit-step memory-orbit-step--photo" onClick={() => advance("photo", -1)} aria-label="Previous photograph" title="Previous photograph"><ArrowLeft size={21} strokeWidth={1} /></button>
            <button type="button" className="memory-orbit-step memory-orbit-step--video" onClick={() => advance("video", 1)} aria-label="Next video" title="Next video"><ArrowRight size={21} strokeWidth={1} /></button>
            <div className="memory-orbit-centre">
              <i />
              <button type="button" onClick={() => setAutoplay((value) => !value)} aria-label={autoplay ? "Pause rotating galleries" : "Automatically rotate galleries"} aria-pressed={autoplay} title={autoplay ? "Pause the orbits" : "Let the memories move"}>
                {autoplay ? <Pause size={13} strokeWidth={1.5} /> : <Heart size={13} strokeWidth={1.5} />}
              </button>
              <i />
            </div>
          </>
        )}

        <footer className="memories-footer">
          <div className="memories-tools" ref={uploadPanel}>
            <button type="button" className="memory-add-button" aria-expanded={uploadOpen} aria-controls="memory-upload-menu" onClick={() => setUploadOpen((value) => !value)}><Plus size={15} strokeWidth={1.4} /> Make it ours</button>
            <button type="button" className={`memory-song-button${music.playing ? " is-playing" : ""}`} title={music.url ? music.name : "Upload a gallery soundtrack"} aria-label={music.url ? `${music.playing ? "Pause" : "Play"} background music` : "Add our song"}
              onClick={() => music.url ? setMusic({ ...music, playing: !music.playing }) : musicInput.current?.click()}>
              {music.playing ? <Pause size={13} /> : <Music2 size={14} strokeWidth={1.4} />}<span>{music.url ? music.name : "Our soundtrack"}</span>
            </button>
            <AnimatePresence>
              {uploadOpen && (
                <motion.div id="memory-upload-menu" className="memory-upload-menu" role="dialog" aria-label="Personalize your memories"
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}>
                  <div className="memory-upload-menu-heading"><span>A little more us.</span><button type="button" onClick={() => setUploadOpen(false)} aria-label="Close upload menu"><X size={16} /></button></div>
                  <button type="button" disabled={adding} onClick={() => photoInput.current?.click()}><ImagePlus size={18} strokeWidth={1.4} /><span>Add our photos<small>Choose one or a few favourites</small></span><Plus size={14} /></button>
                  <button type="button" disabled={adding} onClick={() => videoInput.current?.click()}><Film size={18} strokeWidth={1.4} /><span>Add our videos<small>Your moments, with sound</small></span><Plus size={14} /></button>
                  <button type="button" onClick={() => musicInput.current?.click()}><Music2 size={18} strokeWidth={1.4} /><span>{music.url ? "Change our soundtrack" : "Add our soundtrack"}<small>The song that feels like us</small></span><Plus size={14} /></button>
                  {adding && <p className="memory-upload-progress" role="status"><LoaderCircle size={14} className="animate-spin" /> Getting your memories ready...</p>}
                  {notice && <p className="memory-upload-success" role="status"><Check size={14} />{notice}</p>}
                  {uploadError && <p className="memory-upload-error" role="alert">{uploadError}</p>}
                  <p className="memory-upload-privacy">Files stay in this browser tab. Nothing is uploaded.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="memories-browse-hint">
            <Mouse size={25} strokeWidth={1.1} />
            <p>{desktop ? "Scroll or use arrows" : "Swipe through our story"}<span>to revisit a little forever</span></p>
            {!desktop && <button type="button" className="memory-mobile-auto" onClick={() => setAutoplay((value) => !value)} aria-label={autoplay ? "Pause gallery rotation" : "Start gallery rotation"}>{autoplay ? <Pause size={13} /> : <Play size={13} />}</button>}
          </div>
          <button type="button" className="memories-continue" onClick={onNext}>The next little surprise <ArrowRight size={23} strokeWidth={1} /></button>
        </footer>

        <input ref={photoInput} type="file" accept="image/*" multiple hidden aria-label="Upload personal photos" onChange={(event) => void uploadMedia("photo", event)} />
        <input ref={videoInput} type="file" accept="video/*" multiple hidden aria-label="Upload personal videos" onChange={(event) => void uploadMedia("video", event)} />
        <input ref={musicInput} type="file" accept="audio/*" hidden aria-label="Upload background music" onChange={uploadSong} />
        {!uploadOpen && uploadError && <p className="memory-upload-toast" role="alert">{uploadError}</p>}
      </div>

      <AnimatePresence>
        {lightbox && <MemoryLightbox items={lightbox.kind === "photo" ? photos : videos} cursor={lightbox.cursor} onNavigate={navigateViewer} onClose={() => setLightbox(null)} onPlayingChange={onLightboxPlaying} />}
      </AnimatePresence>
    </>
  );
}