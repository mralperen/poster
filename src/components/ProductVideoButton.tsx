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
        aria-label="Video"
        title="Video"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
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
