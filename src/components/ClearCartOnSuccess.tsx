"use client";

import { useEffect } from "react";
import { clearPaySession } from "@/components/CheckoutPayView";
import { useCart } from "@/context/CartContext";

export function ClearCartOnSuccess({ orderId }: { orderId?: string }) {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
    if (orderId) {
      clearPaySession(orderId);
    }
  }, [clearCart, orderId]);

  return null;
}
