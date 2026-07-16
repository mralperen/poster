import { randomUUID } from "node:crypto";
import { readTextFile, writeTextFile } from "@/lib/db/storage";
import type { StoredOrder } from "@/lib/db/orders-store";
import { formatPrice } from "@/lib/format";

export type AdminNotificationType = "new_order";

export type AdminNotification = {
  id: string;
  type: AdminNotificationType;
  orderId: string;
  title: string;
  body: string;
  href: string;
  read: boolean;
  createdAt: string;
};

const DATA_FILE = "data/admin-notifications.json";
const MAX_ENTRIES = 150;

async function readAll(): Promise<AdminNotification[]> {
  const raw = await readTextFile(DATA_FILE);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AdminNotification[]) : [];
  } catch {
    return [];
  }
}

async function writeAll(entries: AdminNotification[]): Promise<void> {
  await writeTextFile(DATA_FILE, `${JSON.stringify(entries, null, 2)}\n`);
}

function orderRef(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

export async function listAdminNotifications(): Promise<AdminNotification[]> {
  const entries = await readAll();
  return entries.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function countUnreadAdminNotifications(): Promise<number> {
  const entries = await readAll();
  return entries.filter((entry) => !entry.read).length;
}

export async function getNotificationByOrderId(
  orderId: string,
): Promise<AdminNotification | undefined> {
  const entries = await readAll();
  return entries.find((entry) => entry.orderId === orderId && entry.type === "new_order");
}

export async function createOrderNotification(
  order: StoredOrder,
): Promise<AdminNotification | null> {
  if (order.status !== "paid" && order.status !== "fulfilled") return null;

  const existing = await getNotificationByOrderId(order.id);
  if (existing) return existing;

  const ref = orderRef(order.id);
  const entry: AdminNotification = {
    id: randomUUID(),
    type: "new_order",
    orderId: order.id,
    title: `Yeni sipariş · #${ref}`,
    body: `${order.customer.name} · ${formatPrice(order.totals.total)}`,
    href: "/admin/orders",
    read: false,
    createdAt: order.updatedAt || new Date().toISOString(),
  };

  const entries = await readAll();
  entries.unshift(entry);
  await writeAll(entries.slice(0, MAX_ENTRIES));
  return entry;
}

export async function markNotificationRead(
  id: string,
): Promise<AdminNotification | undefined> {
  const entries = await readAll();
  const index = entries.findIndex((entry) => entry.id === id);
  if (index === -1) return undefined;

  entries[index] = { ...entries[index], read: true };
  await writeAll(entries);
  return entries[index];
}

export async function markAllNotificationsRead(): Promise<void> {
  const entries = await readAll();
  const updated = entries.map((entry) => ({ ...entry, read: true }));
  await writeAll(updated);
}

export async function syncNotificationsFromPaidOrders(
  orders: StoredOrder[],
): Promise<void> {
  const paidOrders = orders.filter(
    (order) => order.status === "paid" || order.status === "fulfilled",
  );

  for (const order of paidOrders) {
    await createOrderNotification(order);
  }
}
