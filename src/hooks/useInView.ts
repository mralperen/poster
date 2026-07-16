"use client";

import { useEffect, useRef, useState } from "react";

export function useInView<T extends HTMLElement = HTMLElement>(rootMargin = "80px") {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { rootMargin, threshold: 0.15 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin]);

  return { ref, inView };
}
