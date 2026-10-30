import { MEMORIES, MEMORY_VIDEOS } from "../../data/content";

export type MediaKind = "photo" | "video";

export type GalleryMedia = {
  id: string;
  kind: MediaKind;
  src: string;
  poster?: string;
  fallback?: string;
  title: string;
  chapter: string;
  note: string;
};

export const wrapIndex = (index: number, length: number) =>
  ((index % length) + length) % length;

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

// Keep locally added memories when another birthday chapter is visited.
export const gallerySession = {
  photos: MEMORIES.map((memory, index): GalleryMedia => ({
    id: `photo-${index}`,
    kind: "photo",
    src: memory.img,
    title: memory.caption,
    chapter: memory.date,
    note: memory.note,
  })),
  videos: MEMORY_VIDEOS.map((memory, index): GalleryMedia => ({
    id: `video-${index}`,
    kind: "video",
    src: memory.video,
    fallback: memory.fallback,
    poster: memory.poster,
    title: memory.caption,
    chapter: memory.date,
    note: memory.note,
  })),
  photoCursor: 1,
  videoCursor: 1,
};

export function thumbnailSource(item: GalleryMedia) {
  const source = item.kind === "photo" ? item.src : item.poster;
  if (!source || !source.startsWith("https://images.pexels.com/")) return source;
  const url = new URL(source);
  url.searchParams.set("w", "220");
  url.searchParams.set("h", "280");
  return url.toString();
}

export function makeLocalVideoPoster(source: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    let settled = false;
    const finish = (poster?: string) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      video.onloadeddata = null;
      video.onerror = null;
      video.removeAttribute("src");
      video.load();
      resolve(poster);
    };
    const timeout = window.setTimeout(() => finish(), 6000);
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.onloadeddata = () => {
      if (!video.videoWidth || !video.videoHeight) return finish();
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = Math.round((400 * video.videoHeight) / video.videoWidth);
      const context = canvas.getContext("2d");
      if (!context) return finish();
      try {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        finish(canvas.toDataURL("image/jpeg", 0.8));
      } catch {
        finish();
      }
    };
    video.onerror = () => finish();
    video.src = source;
  });
}