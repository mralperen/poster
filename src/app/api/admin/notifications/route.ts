import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  listAdminNotifications,
  markAllNotificationsRead,
  syncNotificationsFromPaidOrders,
} from "@/lib/db/admin-notifications-store";
import { listOrders } from "@/lib/db/orders-store";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
  }

  const orders = await listOrders();
  await syncNotificationsFromPaidOrders(orders);

  const notifications = await listAdminNotifications();
  const unreadCount = notifications.filter((item) => !item.read).length;

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
  }

  await markAllNotificationsRead();
  return NextResponse.json({ ok: true });
}
