"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const GAMMA_RANGE = 28;

type PermissionState = "unsupported" | "prompt" | "granted" | "denied";

export function useDeviceOrientation(enabled: boolean) {
  const [permission, setPermission] = useState<PermissionState>("prompt");
  const [supported, setSupported] = useState(false);
  const baselineRef = useRef<number | null>(null);
  const onProgressRef = useRef<(progress: number) => void>(() => {});

  const setProgressHandler = useCallback((handler: (progress: number) => void) => {
    onProgressRef.current = handler;
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") return false;

    const OrientationEvent = window.DeviceOrientationEvent;
    if (!OrientationEvent) {
      setPermission("unsupported");
      setSupported(false);
      return false;
    }

    setSupported(true);

    if (
      "requestPermission" in OrientationEvent &&
      typeof OrientationEvent.requestPermission === "function"
    ) {
      try {
        const result = await OrientationEvent.requestPermission();
        if (result === "granted") {
          setPermission("granted");
          baselineRef.current = null;
          return true;
        }
        setPermission("denied");
        return false;
      } catch {
        setPermission("denied");
        return false;
      }
    }

    setPermission("granted");
    baselineRef.current = null;
    return true;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    queueMicrotask(() => {
      const hasOrientation = "DeviceOrientationEvent" in window;
      setSupported(hasOrientation);

      if (!hasOrientation) {
        setPermission("unsupported");
        return;
      }

      const OrientationEvent = window.DeviceOrientationEvent;
      if (
        !("requestPermission" in OrientationEvent) ||
        typeof OrientationEvent.requestPermission !== "function"
      ) {
        setPermission("granted");
      }
    });
  }, []);

  useEffect(() => {
    if (!enabled || permission !== "granted") return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.gamma == null) return;

      if (baselineRef.current === null) {
        baselineRef.current = event.gamma;
      }

      const delta = event.gamma - baselineRef.current;
      const progress = Math.max(
        0,
        Math.min(1, 0.5 + delta / (GAMMA_RANGE * 2)),
      );
      onProgressRef.current(progress);
    };

    window.addEventListener("deviceorientation", handleOrientation);
    return () => window.removeEventListener("deviceorientation", handleOrientation);
  }, [enabled, permission]);

  const resetBaseline = useCallback(() => {
    baselineRef.current = null;
  }, []);

  return {
    supported,
    permission,
    requestPermission,
    setProgressHandler,
    resetBaseline,
  };
}
