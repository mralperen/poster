import { listEmailLogs } from "@/lib/db/email-log-store";
import { listInboxEmails } from "@/lib/db/inbox-store";
import { filterCustomerInboxEmails } from "@/lib/inbox-filters";
import type { OrderStatus } from "@/lib/db/orders-store";
import { listPaytrCallbacks } from "@/lib/db/orders-store";
import { getProducts, productHasAllViews } from "@/lib/db/products-store";
import { listAllReviews } from "@/lib/db/reviews-store";
import { isRemoteStorage } from "@/lib/db/storage";
import { isOrderEmailConfigured } from "@/lib/order-email";
import { isPaytrConfigured } from "@/lib/paytr";
import { listOrdersWithReconciliation } from "@/lib/reconcile-orders";

export type AdminDashboardData = {
  stats: {
    revenueTotal: number;
    revenueThisMonth: number;
    ordersPending: number;
    ordersPaid: number;
    ordersFulfilled: number;
    ordersFailed: number;
    productsTotal: number;
    productsLive: number;
    productsDraft: number;
    unreadEmails: number;
    inboxTotal: number;
    sentEmails: number;
    reviewsPending: number;
    reviewsTotal: number;
    avgRating: number;
    callbacksTotal: number;
  };
  system: {
    paytr: boolean;
    email: boolean;
    storage: boolean;
    testMode: boolean;
  };
  recentOrders: Array<{
    id: string;
    ref: string;
    customerName: string;
    total: number;
    status: OrderStatus;
    createdAt: string;
  }>;
  recentInbox: Array<{
    id: string;
    from: string;
    subject: string;
    read: boolean;
    receivedAt: string;
  }>;
  recentReviews: Array<{
    id: string;
    authorName: string;
    rating: number;
    body: string;
    published: boolean;
    createdAt: string;
  }>;
  recentCallbacks: Array<{
    id: string;
    status: string;
    totalAmount: string;
    receivedAt: string;
  }>;
};

function orderRef(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

function isThisMonth(iso: string): boolean {
  const date = new Date(iso);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
  );
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const [
    products,
    orders,
    allInboxEmails,
    sentEmails,
    reviews,
    callbacks,
  ] = await Promise.all([
    getProducts(),
    listOrdersWithReconciliation(),
    listInboxEmails(),
    listEmailLogs(),
    listAllReviews(),
    listPaytrCallbacks(),
  ]);

  const inboxEmails = filterCustomerInboxEmails(allInboxEmails);
  const unreadEmails = inboxEmails.filter((email) => !email.read).length;

  const readyFlags = await Promise.all(
    products.map(async (product) => ({
      id: product.id,
      ready: await productHasAllViews(product),
    })),
  );
  const readyMap = Object.fromEntries(readyFlags.map((item) => [item.id, item.ready]));

  let productsLive = 0;
  let productsDraft = 0;

  for (const product of products) {
    const ready = readyMap[product.id];
    const isDraft = product.published === false || !ready;
    if (isDraft) productsDraft += 1;
    else productsLive += 1;
  }

  const paidOrders = orders.filter(
    (order) => order.status === "paid" || order.status === "fulfilled",
  );
  const revenueTotal = paidOrders.reduce((sum, order) => sum + order.totals.total, 0);
  const revenueThisMonth = paidOrders
    .filter((order) => isThisMonth(order.createdAt))
    .reduce((sum, order) => sum + order.totals.total, 0);

  const publishedReviews = reviews.filter((review) => review.published);
  const avgRating =
    publishedReviews.length > 0
      ? publishedReviews.reduce((sum, review) => sum + review.rating, 0) /
        publishedReviews.length
      : 0;

  return {
    stats: {
      revenueTotal,
      revenueThisMonth,
      ordersPending: orders.filter((order) => order.status === "pending_payment").length,
      ordersPaid: orders.filter((order) => order.status === "paid").length,
      ordersFulfilled: orders.filter((order) => order.status === "fulfilled").length,
      ordersFailed: orders.filter((order) => order.status === "failed").length,
      productsTotal: products.length,
      productsLive,
      productsDraft,
      unreadEmails,
      inboxTotal: inboxEmails.length,
      sentEmails: sentEmails.length,
      reviewsPending: reviews.filter((review) => !review.published).length,
      reviewsTotal: reviews.length,
      avgRating,
      callbacksTotal: callbacks.length,
    },
    system: {
      paytr: isPaytrConfigured(),
      email: isOrderEmailConfigured(),
      storage: isRemoteStorage() || !process.env.VERCEL,
      testMode: process.env.PAYTR_TEST_MODE === "1",
    },
    recentOrders: orders.slice(0, 5).map((order) => ({
      id: order.id,
      ref: orderRef(order.id),
      customerName: order.customer.name,
      total: order.totals.total,
      status: order.status,
      createdAt: order.createdAt,
    })),
    recentInbox: inboxEmails.slice(0, 5).map((email) => ({
      id: email.id,
      from: email.from,
      subject: email.subject,
      read: email.read,
      receivedAt: email.receivedAt,
    })),
    recentReviews: reviews.slice(0, 5).map((review) => ({
      id: review.id,
      authorName: review.authorName,
      rating: review.rating,
      body: review.body,
      published: review.published,
      createdAt: review.createdAt,
    })),
    recentCallbacks: callbacks.slice(0, 5).map((callback) => ({
      id: callback.id,
      status: callback.status,
      totalAmount: callback.totalAmount,
      receivedAt: callback.receivedAt,
    })),
  };
}
