"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

type OrderStatusPollerProps = {
  orderId?: string;
  initialStatus?: string;
};

export function OrderStatusPoller({ orderId, initialStatus }: OrderStatusPollerProps) {
  const router = useRouter();

  useEffect(() => {
    if (!orderId) return;
    if (initialStatus === "paid" || initialStatus === "fulfilled") return;

    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      attempts += 1;
      try {
        const response = await fetch(`/api/orders/${orderId}/status`, {
          cache: "no-store",
        });
        if (!response.ok) return;

        const data = (await response.json()) as { paid?: boolean };
        if (data.paid && !cancelled) {
          router.refresh();
        }
      } catch {
        // ignore transient errors
      }
    };

    const timer = window.setInterval(() => {
      if (attempts >= 20) {
        window.clearInterval(timer);
        return;
      }
      void poll();
    }, 2500);

    void poll();

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [orderId, initialStatus, router]);

  return null;
}
