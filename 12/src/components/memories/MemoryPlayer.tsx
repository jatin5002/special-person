import { useCallback, useEffect, useRef, useState } from "react";
import { Expand, LoaderCircle, Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import type { GalleryMedia } from "./galleryMedia";

const formatTime = (time: number) => {
  if (!Number.isFinite(time)) return "0:00";
  return `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, "0")}`;
};

export default function MemoryPlayer({
  item,
  suspended = false,
  autoPlay = false,
  onExpand,
  onPlayingChange,
}: {
  item: GalleryMedia;
  suspended?: boolean;
  autoPlay?: boolean;
  onExpand: () => void;
  onPlayingChange?: (playing: boolean) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playingCallback = useRef(onPlayingChange);
  const [source, setSource] = useState(item.src);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [message, setMessage] = useState("");
  const wantsPlay = useRef(autoPlay);
  playingCallback.current = onPlayingChange;

  const requestPlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    wantsPlay.current = true;
    setMessage("");
    setLoading(true);
    try {
      await video.play();
    } catch (error) {
      setLoading(false);
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        wantsPlay.current = false;
        setMessage("Tap play to start this memory.");
      }
    }
  }, []);

  useEffect(() => {
    if (autoPlay && !suspended) void requestPlay();
  }, [autoPlay, suspended, requestPlay]);

  useEffect(() => {
    if (suspended) {
      wantsPlay.current = false;
      videoRef.current?.pause();
    }
  }, [suspended]);

  useEffect(() => () => playingCallback.current?.(false), []);

  const togglePlayback = () => {
    if (!videoRef.current || failed) return;
    if (videoRef.current.paused) void requestPlay();
    else {
      wantsPlay.current = false;
      videoRef.current.pause();
    }
  };

  const retry = () => {
    setFailed(false);
    setMessage("");
    wantsPlay.current = true;
    videoRef.current?.load();
    void requestPlay();
  };

  return (
    <div className={`memory-player${playing ? " is-playing" : ""}`}>
      <video
        ref={videoRef}
        src={source}
        poster={item.poster}
        playsInline
        preload="metadata"
        muted={muted}
        aria-label={item.title}
        onClick={togglePlayback}
        onLoadedMetadata={(event) => {
          const value = event.currentTarget.duration;
          setDuration(Number.isFinite(value) ? value : 0);
        }}
        onDurationChange={(event) => {
          const value = event.currentTarget.duration;
          setDuration(Number.isFinite(value) ? value : 0);
        }}
        onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
        onWaiting={() => { if (wantsPlay.current) setLoading(true); }}
        onCanPlay={() => {
          setLoading(false);
          if (wantsPlay.current && !suspended && videoRef.current?.paused) void requestPlay();
        }}
        onPlaying={() => {
          setLoading(false);
          setPlaying(true);
          playingCallback.current?.(true);
        }}
        onPause={() => {
          setPlaying(false);
          setLoading(false);
          playingCallback.current?.(false);
        }}
        onEnded={() => {
          wantsPlay.current = false;
          setPlaying(false);
          playingCallback.current?.(false);
        }}
        onError={() => {
          if (item.fallback && source !== item.fallback) {
            setSource(item.fallback);
            return;
          }
          setFailed(true);
          setLoading(false);
          setPlaying(false);
          playingCallback.current?.(false);
        }}
      />
      {!playing && !failed && (
        <button type="button" className="memory-play-large" onClick={togglePlayback} aria-label={`Play ${item.title}`}>
          {loading ? <LoaderCircle size={26} className="animate-spin" /> : <Play size={25} fill="currentColor" strokeWidth={1} />}
        </button>
      )}
      {failed && (
        <div className="memory-player-error" role="status">
          <p>This reel could not load.</p>
          <button type="button" onClick={retry}><RotateCcw size={14} /> Try again</button>
          <span>You can also add a video from your device.</span>
        </div>
      )}
      {message && <p className="memory-player-message" role="status">{message}</p>}
      <div className="memory-player-controls">
        <button type="button" onClick={togglePlayback} aria-label={playing ? "Pause video" : "Play video"} disabled={failed}>
          {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
        </button>
        <span className="memory-player-time">{formatTime(time)} <span>/ {formatTime(duration)}</span></span>
        <input
          type="range"
          min="0"
          max={duration || 1}
          step="0.1"
          value={Math.min(time, duration || 1)}
          aria-label="Video playback position"
          disabled={!duration || failed}
          onChange={(event) => {
            const value = Number(event.target.value);
            if (videoRef.current) videoRef.current.currentTime = value;
            setTime(value);
          }}
          style={{ background: `linear-gradient(to right, #e8c476 ${duration ? time / duration * 100 : 0}%, rgba(255,255,255,.23) 0%)` }}
        />
        <button type="button" onClick={() => setMuted((value) => !value)} aria-label={muted ? "Unmute video" : "Mute video"}>
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <button type="button" onClick={onExpand} aria-label="View video fullscreen"><Expand size={17} /></button>
      </div>
    </div>
  );
}