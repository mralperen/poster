"use client";

import { useEffect, useState } from "react";

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      const narrow = window.innerWidth < 768;
      setIsMobile(coarse || narrow);
    };

    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
}
