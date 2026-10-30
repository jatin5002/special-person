import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import MemoryPlayer from "./MemoryPlayer";
import { wrapIndex, type GalleryMedia } from "./galleryMedia";

export default function MemoryLightbox({ items, cursor, onNavigate, onClose, onPlayingChange }: {
  items: GalleryMedia[];
  cursor: number;
  onNavigate: (direction: number) => void;
  onClose: () => void;
  onPlayingChange: (playing: boolean) => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const callbacks = useRef({ onNavigate, onClose });
  callbacks.current = { onNavigate, onClose };
  const reducedMotion = useReducedMotion();
  const index = wrapIndex(cursor, items.length);
  const item = items[index];

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const root = document.getElementById("root");
    const wasInert = root?.hasAttribute("inert") ?? false;
    document.body.style.overflow = "hidden";
    root?.setAttribute("inert", "");
    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.fullscreenElement) {
        event.preventDefault();
        event.stopImmediatePropagation();
        callbacks.current.onClose();
      }
      if (event.target instanceof HTMLInputElement) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        event.stopImmediatePropagation();
        callbacks.current.onNavigate(event.key === "ArrowRight" ? 1 : -1);
      }
      if (event.key === "Tab") {
        const elements = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [tabindex="0"]',
        );
        if (!elements?.length) return;
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = previousOverflow;
      if (!wasInert) root?.removeAttribute("inert");
      previousFocus?.focus({ preventScroll: true });
    };
  }, []);

  const expand = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen?.().catch(() => undefined);
    } else if (dialogRef.current?.requestFullscreen) {
      void dialogRef.current.requestFullscreen().catch(() => undefined);
    } else {
      const video = dialogRef.current?.querySelector("video") as
        (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
      video?.webkitEnterFullscreen?.();
    }
  };

  return createPortal(
    <motion.div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${item.kind === "photo" ? "Photo" : "Video"} viewer: ${item.title}`}
      className="memory-lightbox"
      data-gallery-dialog="true"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={(event) => { if (event.currentTarget === event.target) onClose(); }}
    >
      <div className="memory-lightbox-top">
        <span className="memory-lightbox-brand">for Uhh <span>OUR LITTLE FOREVER</span></span>
        <button ref={closeRef} type="button" className="memory-close" onClick={onClose} aria-label="Close fullscreen viewer">
          <span>Close</span><X size={21} strokeWidth={1.4} />
        </button>
      </div>
      <button type="button" className="memory-lightbox-arrow memory-lightbox-arrow--previous" onClick={() => onNavigate(-1)} aria-label="Previous memory">
        <ArrowLeft size={24} strokeWidth={1} />
      </button>
      <div className={`memory-lightbox-media memory-lightbox-media--${item.kind}`}>
        <AnimatePresence initial={false} mode="wait">
          <motion.div className="memory-lightbox-content" key={item.id}
            initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.98 }}
            animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.25 }}>
            {item.kind === "photo" ? (
              <img src={item.src} alt={item.title} />
            ) : (
              <MemoryPlayer item={item} autoPlay onExpand={expand} onPlayingChange={onPlayingChange} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <button type="button" className="memory-lightbox-arrow memory-lightbox-arrow--next" onClick={() => onNavigate(1)} aria-label="Next memory">
        <ArrowRight size={24} strokeWidth={1} />
      </button>
      <div className="memory-lightbox-caption" aria-live="polite">
        <p>{String(index + 1).padStart(2, "0")} <span>/ {String(items.length).padStart(2, "0")}</span></p>
        <h3>{item.title}</h3>
        <span>{item.note}</span>
      </div>
    </motion.div>,
    document.body,
  );
}