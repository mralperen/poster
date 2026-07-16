import { AdminMailPanel } from "@/components/admin/AdminMailPanel";
import { listEmailLogs } from "@/lib/db/email-log-store";
import { listInboxEmails } from "@/lib/db/inbox-store";
import { filterCustomerInboxEmails } from "@/lib/inbox-filters";
import { getOrderEmailConfigSummary, isOrderEmailConfigured } from "@/lib/order-email";

type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function AdminEmailsPage({ searchParams }: PageProps) {
  const { tab } = await searchParams;
  const [inboxEmails, sentEmails] = await Promise.all([
    listInboxEmails(),
    listEmailLogs(),
  ]);
  const customerInbox = filterCustomerInboxEmails(inboxEmails);

  const initialTab = tab === "sent" ? "sent" : "inbox";
  const emailConfig = getOrderEmailConfigSummary();

  return (
    <AdminMailPanel
      inboxEmails={customerInbox}
      sentEmails={sentEmails}
      configured={isOrderEmailConfigured()}
      supportEmail={emailConfig.notifyEmail}
      initialTab={initialTab}
    />
  );
}
