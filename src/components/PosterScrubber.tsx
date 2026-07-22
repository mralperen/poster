"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { isUploadImageSrc } from "@/lib/image-version";
import { getViewLabel, getViewWeights } from "@/lib/view-weights";

type PosterScrubberProps = {
  views: string[];
  viewLabels?: string[];
  alt?: string;
  className?: string;
  initialProgress?: number;
  priority?: boolean;
  woodFrame?: boolean;
};

type DragState = {
  x: number;
  y: number;
  progress: number;
  axis: "pending" | "x" | "y";
};

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const DRAG_SENSITIVITY = 1.12;

export function PosterScrubber({
  views,
  viewLabels = [],
  alt = "3D lenticular poster preview",
  className = "",
  initialProgress = 0.5,
  priority = false,
  woodFrame = false,
}: PosterScrubberProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const pendingProgressRef = useRef(initialProgress);
  const dragStart = useRef<DragState>({
    x: 0,
    y: 0,
    progress: initialProgress,
    axis: "pending",
  });
  const progressRef = useRef(initialProgress);

  const [progress, setProgress] = useState(initialProgress);
  const [isDragging, setIsDragging] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const viewCount = views.length;
  const labels =
    viewLabels.length === viewCount
      ? viewLabels
      : views.map((_, i) =>
          i === 0 ? "Sol" : i === viewCount - 1 ? "Sağ" : "Orta",
        );

  const updateProgress = useCallback((value: number) => {
    const next = clamp(value);
    progressRef.current = next;
    pendingProgressRef.current = next;

    if (animationFrameRef.current !== null) return;
    animationFrameRef.current = window.requestAnimationFrame(() => {
      animationFrameRef.current = null;
      setProgress(pendingProgressRef.current);
    });
  }, []);

  const updateProgressFromDelta = useCallback(
    (clientX: number, clientY: number, preventDefault?: () => void) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const deltaX = clientX - dragStart.current.x;
      const deltaY = clientY - dragStart.current.y;

      if (dragStart.current.axis === "pending") {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        if (absX > 6 || absY > 6) {
          dragStart.current.axis = absX >= absY ? "x" : "y";
        }
      }

      if (dragStart.current.axis === "y") return;
      if (dragStart.current.axis === "x") preventDefault?.();

      const next =
        dragStart.current.progress +
        (deltaX / Math.max(rect.width, 1)) * DRAG_SENSITIVITY;
      updateProgress(next);
    },
    [updateProgress],
  );

  const beginDrag = useCallback((clientX: number, clientY: number) => {
    setHasInteracted(true);
    isDraggingRef.current = true;
    setIsDragging(true);
    dragStart.current = {
      x: clientX,
      y: clientY,
      progress: progressRef.current,
      axis: "pending",
    };
  }, []);

  const finishDrag = useCallback(() => {
    isDraggingRef.current = false;
    pointerIdRef.current = null;
    setIsDragging(false);
  }, []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointerIdRef.current = event.pointerId;
    beginDrag(event.clientX, event.clientY);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* Some mobile browsers can refuse capture for synthetic touch paths. */
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || pointerIdRef.current !== event.pointerId) {
      return;
    }
    updateProgressFromDelta(event.clientX, event.clientY, () => {
      event.preventDefault();
    });
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      /* ignore */
    }
    finishDrag();
  };

  const handleTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    beginDrag(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || event.touches.length !== 1) return;
    const touch = event.touches[0];
    updateProgressFromDelta(touch.clientX, touch.clientY, () => {
      event.preventDefault();
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = viewCount === 3 ? 0.08 : 0.05;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setHasInteracted(true);
      updateProgress(progressRef.current - step);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setHasInteracted(true);
      updateProgress(progressRef.current + step);
    }
  };

  useEffect(() => {
    const preload = () => {
      views.slice(1).forEach((src) => {
        const img = new window.Image();
        img.src = src;
      });
    };

    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (idleWindow.requestIdleCallback) {
      const handle = idleWindow.requestIdleCallback(preload);
      return () => idleWindow.cancelIdleCallback?.(handle);
    }

    const timeout = window.setTimeout(preload, 350);
    return () => window.clearTimeout(timeout);
  }, [views]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const weights = getViewWeights(progress, viewCount);
  const currentLabel = getViewLabel(progress, viewCount, labels);
  const activeViewIndex = weights.reduce(
    (best, weight, index) => (weight > weights[best] ? index : best),
    0,
  );
  const initialViewIndex = Math.round(clamp(initialProgress) * Math.max(viewCount - 1, 0));
  const rotateY = (progress - 0.5) * 26;
  const rotateX = isDragging ? (0.5 - progress) * 3 : 0;
  const shineX = 12 + progress * 76;
  const showSwipeCoach = !hasInteracted && !isDragging;

  const scrubberStyle = {
    "--scrub-progress": progress,
    "--shine-x": `${shineX}%`,
  } as CSSProperties;

  return (
    <div className={`min-w-0 select-none ${className}`} style={scrubberStyle}>
      <div
        ref={containerRef}
        role="img"
        aria-label={`${alt}. Sola veya sağa kaydırarak görünümü değiştirin.`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onLostPointerCapture={finishDrag}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={finishDrag}
        onTouchCancel={finishDrag}
        data-grab-cursor="true"
        data-grabbing={isDragging ? "true" : undefined}
        className={`group relative aspect-[3/4] w-full overflow-hidden outline-none touch-pan-y ${
          woodFrame
            ? "rounded-[1px] bg-transparent shadow-none ring-0"
            : "rounded-[6px] bg-zinc-950 shadow-[0_18px_54px_rgba(0,0,0,0.36)] ring-1 ring-white/15"
        } focus-visible:ring-2 focus-visible:ring-amber-300/70 ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{ perspective: "1300px" }}
      >
        <div
          className={`absolute inset-0 [contain:layout_paint_style] ${
            isDragging ? "will-change-transform" : ""
          }`}
          style={{
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${
              isDragging ? 1.018 : 1
            })`,
            transformStyle: "preserve-3d",
            transition: isDragging ? "none" : "transform 180ms ease-out",
          }}
        >
          {views.map((src, index) => (
            <Image
              key={`${src}-${index}`}
              src={src}
              alt={`${alt} - ${labels[index]}`}
              width={900}
              height={1200}
              loading={priority || index === initialViewIndex ? "eager" : "lazy"}
              draggable={false}
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              sizes="(max-width: 768px) 100vw, 560px"
              unoptimized={isUploadImageSrc(src)}
              style={{
                opacity: weights[index],
                transition: isDragging ? "none" : "opacity 140ms linear",
              }}
            />
          ))}

          <div
            className="pointer-events-none absolute inset-0 opacity-[0.08]"
            style={{
              background:
                "repeating-linear-gradient(90deg, rgba(255,255,255,0.22) 0 1px, transparent 1px 5px)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 hidden opacity-20 md:block"
            style={{
              background: `linear-gradient(105deg, transparent calc(var(--shine-x) - 18%), rgba(255,255,255,0.5) var(--shine-x), transparent calc(var(--shine-x) + 18%))`,
            }}
          />
          <div className="pointer-events-none absolute inset-0 rounded-[6px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12),inset_0_0_44px_rgba(0,0,0,0.28)]" />
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent px-4 py-3">
          <span className="rounded-full border border-white/10 bg-black/35 px-2.5 py-1 text-[10px] font-medium tracking-wide text-white/80 uppercase backdrop-blur">
            {viewCount} açı
          </span>
          <span className="rounded-full border border-white/10 bg-black/35 px-2.5 py-1 text-[10px] font-medium tracking-wide text-amber-200 uppercase backdrop-blur">
            {currentLabel}
          </span>
        </div>

        {showSwipeCoach && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6">
            <div className="swipe-coach min-w-44 rounded-full border border-white/15 bg-black/55 px-5 py-2.5 shadow-2xl shadow-black/45 backdrop-blur-md">
              <div className="grid grid-cols-[38px_1fr] items-center gap-4">
                <span className="swipe-touch" aria-hidden>
                  <span className="swipe-touch-core" />
                  <span className="swipe-touch-trail" />
                </span>
                <span className="text-[11px] font-semibold tracking-[0.16em] text-white uppercase">
                  Kaydır
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pointer-events-none mt-3 select-none" aria-hidden>
        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: viewCount }, (_, index) => (
            <span
              key={index}
              className={`rounded-full transition-all duration-200 ${
                index === activeViewIndex
                  ? woodFrame
                    ? "h-1.5 w-5 bg-amber-100/90"
                    : "h-1.5 w-5 bg-white/90"
                  : woodFrame
                    ? "h-1.5 w-1.5 bg-white/22"
                    : "h-1.5 w-1.5 bg-white/25"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
