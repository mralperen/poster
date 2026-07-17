"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type ProductVideoButtonProps = {
  src?: string;
  title: string;
};

export function ProductVideoButton({ src, title }: ProductVideoButtonProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!src) return null;

  const modal =
    mounted && open
      ? createPortal(
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
            <button
              type="button"
              aria-label="Videoyu kapat"
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-[10px] border border-white/10 bg-black shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <p className="truncate pr-4 text-sm font-medium text-white">{title}</p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Kapat"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white"
                >
                  ×
                </button>
              </div>
              <video
                src={src}
                controls
                autoPlay
                playsInline
                className="aspect-video w-full bg-black"
              />
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Video izle"
        title="Video izle"
        className="product-video-btn group relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-300 text-black shadow-[0_0_0_1px_rgba(251,191,36,0.35),0_0_20px_rgba(251,191,36,0.35)] transition-transform duration-200 hover:scale-105 hover:bg-amber-200 hover:shadow-[0_0_0_1px_rgba(251,191,36,0.5),0_0_28px_rgba(251,191,36,0.55)] active:scale-95"
      >
        <span
          className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-amber-300/40"
          style={{ animationDuration: "2.2s" }}
          aria-hidden
        />
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className="relative z-[1] translate-x-px"
        >
          <path
            d="M8 6.5v11l9-5.5-9-5.5Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {modal}
    </>
  );
}
