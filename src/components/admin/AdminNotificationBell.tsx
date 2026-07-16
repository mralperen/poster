"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type AdminNotification = {
  id: string;
  type: "new_order";
  orderId: string;
  title: string;
  body: string;
  href: string;
  read: boolean;
  createdAt: string;
};

function IconBell() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className="h-[18px] w-[18px]">
      <path
        d="M10 3.5a4 4 0 0 0-4 4v2.2c0 .5-.2 1-.5 1.4L4.5 13h11l-1-2.9c-.3-.4-.5-.9-.5-1.4V7.5a4 4 0 0 0-4-4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M8.5 14a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconOrder() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className="h-4 w-4 shrink-0">
      <path
        d="M4 5.5h12l-1.2 8.5H5.2L4 5.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M7 5.5V4.5a3 3 0 0 1 6 0v1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function formatRelativeTime(value: string): string {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Az önce";
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa önce`;
  return new Date(value).toLocaleString("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminNotificationBell() {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/notifications", { cache: "no-store" });
      if (!response.ok) return;

      const data = (await response.json()) as {
        notifications: AdminNotification[];
        unreadCount: number;
      };

      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
    const timer = window.setInterval(() => {
      void fetchNotifications();
    }, 20000);

    return () => window.clearInterval(timer);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!open) return;

    const handleClick = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const openNotification = async (notification: AdminNotification) => {
    if (!notification.read) {
      await fetch(`/api/admin/notifications/${notification.id}`, { method: "PATCH" });
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, read: true } : item,
        ),
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    }

    setOpen(false);
    router.push(notification.href);
    router.refresh();
  };

  const markAllRead = async () => {
    await fetch("/api/admin/notifications", { method: "PATCH" });
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
  };

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`relative inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors sm:h-auto sm:w-auto sm:rounded-lg sm:px-2 sm:py-1.5 ${
          open || unreadCount > 0
            ? "bg-white/10 text-white"
            : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
        }`}
        aria-label={unreadCount > 0 ? `${unreadCount} yeni bildirim` : "Bildirimler"}
        title="Bildirimler"
      >
        <IconBell />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-black sm:right-0 sm:top-0">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Bildirimleri kapat"
            className="fixed inset-0 z-[90] bg-black/45 sm:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="fixed right-3 top-[3.75rem] z-[100] w-[calc(100vw-1.5rem)] max-w-[360px] overflow-hidden rounded-2xl border border-white/10 bg-[#111113] shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:absolute sm:right-0 sm:top-[calc(100%+8px)] sm:w-[min(100vw-2rem,360px)]">
          <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">Bildirimler</p>
              <p className="text-[11px] text-zinc-500">
                {unreadCount > 0
                  ? `${unreadCount} yeni`
                  : notifications.length > 0
                    ? `${notifications.length} bildirim`
                    : "Yeni bildirim yok"}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="text-[11px] text-amber-300 hover:text-amber-200"
              >
                Tümünü oku
              </button>
            )}
          </div>

          <div className="max-h-[min(60vh,420px)] overflow-y-auto">
            {loading ? (
              <p className="px-4 py-8 text-center text-sm text-zinc-500">Yükleniyor…</p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-zinc-500">
                Henüz bildirim yok.
              </p>
            ) : (
              <ul className="divide-y divide-white/6">
                {notifications.slice(0, 20).map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => void openNotification(notification)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03] ${
                        !notification.read ? "bg-amber-300/[0.04]" : ""
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          !notification.read
                            ? "bg-amber-300/15 text-amber-200"
                            : "bg-white/5 text-zinc-400"
                        }`}
                      >
                        <IconOrder />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm leading-5 ${
                              notification.read ? "text-zinc-300" : "font-medium text-white"
                            }`}
                          >
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-300" />
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-zinc-500">{notification.body}</p>
                        <p className="mt-1 text-[10px] text-zinc-600">
                          {formatRelativeTime(notification.createdAt)}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-white/8 px-4 py-2.5">
            <Link
              href="/admin/orders"
              onClick={() => setOpen(false)}
              className="text-xs text-amber-300 hover:text-amber-200"
            >
              Tüm siparişleri gör →
            </Link>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
