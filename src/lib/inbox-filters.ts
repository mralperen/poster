import type { InboxEmail } from "@/lib/db/inbox-store";

/** Sipariş sisteminin kendi gönderdiği admin bildirimleri gelen kutusunda gösterilmez. */
export function isSystemOrderInboxEmail(email: InboxEmail): boolean {
  const subject = email.subject.trim();
  const from = email.from.toLowerCase();

  if (/^yeni sipariş\s*[—-]/i.test(subject)) return true;
  if (from.includes("siparis@") && subject.toLowerCase().includes("sipariş")) return true;

  return false;
}

export function filterCustomerInboxEmails(emails: InboxEmail[]): InboxEmail[] {
  return emails.filter((email) => !isSystemOrderInboxEmail(email));
}
