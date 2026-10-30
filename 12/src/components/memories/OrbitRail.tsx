import { useEffect } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { Film, Play } from "lucide-react";
import {
  clamp,
  thumbnailSource,
  wrapIndex,
  type GalleryMedia,
  type MediaKind,
} from "./galleryMedia";

type Geometry = {
  radius: number;
  cx: number;
  cy: number;
  step: number;
  thumbWidth: number;
  horizontal: boolean;
  direction: number;
};

export function getRailGeometry(
  width: number,
  height: number,
  kind: MediaKind,
  horizontal = false,
): Geometry {
  if (horizontal) {
    const radius = Math.max(300, width * 1.25);
    const thumbWidth = clamp(width * 0.15, 46, 64);
    const direction = kind === "photo" ? 1 : -1;
    return {
      radius,
      cx: width / 2,
      cy: kind === "photo" ? 74 - radius : 56 + radius,
      step: (thumbWidth + 18) / radius,
      thumbWidth,
      horizontal,
      direction,
    };
  }
  const radius = Math.max(height * 0.75, width * 0.48);
  const thumbWidth = clamp(width * 0.042, 44, 78);
  const direction = kind === "photo" ? 1 : -1;
  return {
    radius,
    cx: kind === "photo" ? width * 0.43 - radius : width * 0.57 + radius,
    cy: height * 0.485,
    step: Math.min(height * 0.1025, thumbWidth * 1.66) / radius,
    thumbWidth,
    horizontal,
    direction,
  };
}

function pointAt(angle: number, geometry: Geometry, radius = geometry.radius) {
  const { cx, cy, direction, horizontal } = geometry;
  return horizontal
    ? { x: cx + Math.sin(angle) * radius, y: cy + direction * Math.cos(angle) * radius }
    : { x: cx + direction * Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
}

function railPath(geometry: Geometry, radius: number) {
  return Array.from({ length: 81 }, (_, index) => {
    const angle = -1.2 + (index / 80) * 2.4;
    const point = pointAt(angle, geometry, radius);
    return `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`;
  }).join(" ");
}

function OrbitThumbnail({
  item,
  kind,
  virtualIndex,
  cursor,
  geometry,
  onSelect,
}: {
  item: GalleryMedia;
  kind: MediaKind;
  virtualIndex: number;
  cursor: number;
  geometry: Geometry;
  onSelect: (index: number) => void;
}) {
  const reduceMotion = useReducedMotion();
  const targetAngle = (virtualIndex - cursor) * geometry.step;
  const angle = useMotionValue(targetAngle);
  const height = geometry.thumbWidth * 1.34;
  const selected = virtualIndex === cursor;
  const visible = Math.abs(virtualIndex - cursor) <= (geometry.horizontal ? 3 : 4);

  // Animate an angle, not x/y: every thumbnail stays on the actual circle.
  const x = useTransform(() => pointAt(angle.get(), geometry).x - geometry.thumbWidth / 2);
  const y = useTransform(() => pointAt(angle.get(), geometry).y - height / 2);
  const rotate = useTransform(() =>
    (angle.get() * 180 / Math.PI) * geometry.direction * (geometry.horizontal ? -1 : 1),
  );
  const opacity = useTransform(() => {
    const offset = Math.abs(angle.get() / geometry.step);
    const edge = geometry.horizontal ? 3 : 4;
    return offset > edge ? clamp(1 - (offset - edge), 0, 1) : 1;
  });

  useEffect(() => {
    if (reduceMotion) {
      angle.set(targetAngle);
      return;
    }
    const animation = animate(angle, targetAngle, {
      type: "spring",
      stiffness: 115,
      damping: 25,
      mass: 0.8,
    });
    return () => animation.stop();
  }, [angle, targetAngle, reduceMotion]);

  const source = thumbnailSource(item);

  return (
    <motion.button
      type="button"
      className={`orbit-thumb${selected ? " is-selected" : ""}`}
      data-orbit-side={kind}
      aria-label={`${kind === "photo" ? "View photo" : "Select video"}: ${item.title}`}
      aria-current={selected ? "true" : undefined}
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      onClick={() => onSelect(virtualIndex)}
      style={{
        x, y, rotate, opacity,
        width: geometry.thumbWidth,
        height,
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      {source ? (
        <img src={source} alt="" loading="eager" decoding="async" draggable={false} />
      ) : (
        <span className="orbit-thumb-placeholder"><Film size={24} strokeWidth={1} /></span>
      )}
      {kind === "video" && (
        <span className="orbit-thumb-play"><Play size={12} fill="currentColor" /></span>
      )}
    </motion.button>
  );
}

export default function OrbitRail({
  items,
  cursor,
  kind,
  width,
  height,
  horizontal = false,
  onSelect,
}: {
  items: GalleryMedia[];
  cursor: number;
  kind: MediaKind;
  width: number;
  height: number;
  horizontal?: boolean;
  onSelect: (index: number) => void;
}) {
  if (width <= 0 || !items.length) return null;
  const geometry = getRailGeometry(width, height, kind, horizontal);
  const borderOffset = geometry.thumbWidth / 2 + (horizontal ? 16 : 12);
  const extent = horizontal ? 4 : 5;
  const virtualIndices = Array.from({ length: extent * 2 + 1 }, (_, i) => cursor + i - extent);

  return (
    <div className={`orbit-rail orbit-rail--${kind}${horizontal ? " orbit-rail--horizontal" : ""}`}>
      <svg className="orbit-lines" width={width} height={height} aria-hidden="true">
        <path
          d={railPath(geometry, geometry.radius)}
          className="orbit-drag-lane"
          data-orbit-side={kind}
          strokeWidth={geometry.thumbWidth + 38}
        />
        <path d={railPath(geometry, geometry.radius - borderOffset)} className="orbit-line orbit-line--inner" />
        <path d={railPath(geometry, geometry.radius + borderOffset)} className="orbit-line orbit-line--outer" />
      </svg>
      {virtualIndices.map((index) => (
        <OrbitThumbnail
          key={`${kind}-${index}`}
          item={items[wrapIndex(index, items.length)]}
          kind={kind}
          virtualIndex={index}
          cursor={cursor}
          geometry={geometry}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}