"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { EmailLogEntry, EmailLogType } from "@/lib/db/email-log-store";
import type { InboxEmail } from "@/lib/db/inbox-store";

const sentTypeLabels: Record<EmailLogType, string> = {
  order_confirmation: "Müşteri onayı",
  admin_order_notification: "Admin bildirimi",
  support: "Destek",
};

type MailTab = "inbox" | "sent";
type ComposeMode = null | "reply" | "new";

type AdminMailPanelProps = {
  inboxEmails: InboxEmail[];
  sentEmails: EmailLogEntry[];
  configured: boolean;
  supportEmail: string;
  initialTab?: MailTab;
};

function stripHtmlToText(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function replySubject(subject: string): string {
  if (/^re:\s/i.test(subject.trim())) return subject.trim();
  return `Re: ${subject.trim()}`;
}

export function AdminMailPanel({
  inboxEmails,
  sentEmails,
  configured,
  supportEmail,
  initialTab = "inbox",
}: AdminMailPanelProps) {
  const router = useRouter();
  const [tab, setTab] = useState<MailTab>(initialTab);

  const [inboxFilter, setInboxFilter] = useState<"all" | "unread">("all");
  const [sentFilter, setSentFilter] = useState<"all" | EmailLogType>("all");
  const [selectedInboxId, setSelectedInboxId] = useState<string | null>(
    inboxEmails[0]?.id ?? null,
  );
  const [selectedSentId, setSelectedSentId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [composeMode, setComposeMode] = useState<ComposeMode>(null);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeMessage, setComposeMessage] = useState("");
  const [composeName, setComposeName] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);

  const unreadCount = inboxEmails.filter((email) => !email.read).length;

  const visibleInbox = useMemo(() => {
    if (inboxFilter === "unread") return inboxEmails.filter((email) => !email.read);
    return inboxEmails;
  }, [inboxEmails, inboxFilter]);

  const visibleSent = sentEmails.filter(
    (entry) => sentFilter === "all" || entry.type === sentFilter,
  );

  const selectedInbox =
    visibleInbox.find((email) => email.id === selectedInboxId) ??
    inboxEmails.find((email) => email.id === selectedInboxId);

  const selectedSent =
    visibleSent.find((entry) => entry.id === selectedSentId) ??
    sentEmails.find((entry) => entry.id === selectedSentId);

  useEffect(() => {
    if (composeMode === "reply" && selectedInbox) {
      setComposeTo(selectedInbox.from);
      setComposeSubject(replySubject(selectedInbox.subject));
    }
  }, [composeMode, selectedInbox]);

  const openInboxEmail = async (email: InboxEmail) => {
    setSelectedInboxId(email.id);
    setComposeMode(null);
    setSendError(null);
    setSendSuccess(false);
    if (email.read) return;

    setLoadingId(email.id);
    try {
      await fetch(`/api/admin/inbox/${email.id}`, { method: "PATCH" });
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  };

  const startReply = () => {
    if (!selectedInbox) return;
    setComposeMode("reply");
    setComposeTo(selectedInbox.from);
    setComposeSubject(replySubject(selectedInbox.subject));
    setComposeMessage("");
    setComposeName("");
    setSendError(null);
    setSendSuccess(false);
  };

  const startCompose = () => {
    setTab("inbox");
    setComposeMode("new");
    setComposeTo("");
    setComposeSubject("");
    setComposeMessage("");
    setComposeName("");
    setSendError(null);
    setSendSuccess(false);
  };

  const cancelCompose = () => {
    setComposeMode(null);
    setSendError(null);
    setSendSuccess(false);
  };

  const handleSend = async () => {
    setSending(true);
    setSendError(null);
    setSendSuccess(false);

    try {
      const body =
        composeMode === "reply"
          ? {
              mode: "reply" as const,
              inboxId: selectedInbox?.id,
              subject: composeSubject,
              message: composeMessage,
            }
          : {
              mode: "compose" as const,
              to: composeTo,
              subject: composeSubject,
              message: composeMessage,
              recipientName: composeName || undefined,
            };

      const response = await fetch("/api/admin/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setSendError(data.error || "E-posta gönderilemedi.");
        return;
      }

      setSendSuccess(true);
      setComposeMode(null);
      setComposeMessage("");
      setTab("sent");
      router.refresh();
    } catch {
      setSendError("Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">E-postalar</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Gelen mesajlar ve gönderilen sipariş bildirimleri.
          </p>
        </div>
        <button
          type="button"
          onClick={startCompose}
          disabled={!configured}
          className="rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm font-medium text-amber-100 transition-colors hover:bg-amber-300/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          + Yeni destek e-postası
        </button>
      </div>

      {!configured && (
        <div className="mt-5 rounded-[8px] border border-amber-200/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
          RESEND_API_KEY tanımlı değil. Ödeme ayarlarından yapılandırın.
        </div>
      )}

      {sendSuccess && (
        <div className="mt-5 rounded-[8px] border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
          E-posta gönderildi. Gönderilen sekmesinde görüntüleyebilirsiniz.
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setTab("inbox");
            setComposeMode(null);
          }}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
            tab === "inbox"
              ? "border-white/30 bg-white text-black"
              : "border-white/10 text-zinc-400 hover:text-white"
          }`}
        >
          Gelen ({inboxEmails.length}
          {unreadCount > 0 ? ` · ${unreadCount} yeni` : ""})
        </button>
        <button
          type="button"
          onClick={() => setTab("sent")}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
            tab === "sent"
              ? "border-white/30 bg-white text-black"
              : "border-white/10 text-zinc-400 hover:text-white"
          }`}
        >
          Gönderilen ({sentEmails.length})
        </button>
      </div>

      {tab === "inbox" && (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setInboxFilter("all")}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              inboxFilter === "all"
                ? "border-white/20 bg-white/10 text-white"
                : "border-white/10 text-zinc-500"
            }`}
          >
            Tümü
          </button>
          <button
            type="button"
            onClick={() => setInboxFilter("unread")}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              inboxFilter === "unread"
                ? "border-white/20 bg-white/10 text-white"
                : "border-white/10 text-zinc-500"
            }`}
          >
            Okunmamış ({unreadCount})
          </button>
        </div>
      )}

      {tab === "sent" && (
        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              { key: "all" as const, label: "Tümü" },
              { key: "support" as const, label: "Destek" },
              { key: "order_confirmation" as const, label: "Müşteri" },
              { key: "admin_order_notification" as const, label: "Admin" },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setSentFilter(item.key)}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                sentFilter === item.key
                  ? "border-white/20 bg-white/10 text-white"
                  : "border-white/10 text-zinc-500"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="max-h-[70vh] space-y-2 overflow-y-auto">
          {tab === "inbox" ? (
            visibleInbox.length === 0 ? (
              <EmptyState text="Henüz gelen e-posta yok." />
            ) : (
              visibleInbox.map((email) => (
                <MailListButton
                  key={email.id}
                  active={selectedInboxId === email.id}
                  onClick={() => openInboxEmail(email)}
                  disabled={loadingId === email.id}
                >
                  <div className="flex items-center gap-2">
                    {!email.read && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-amber-300" />
                    )}
                    <p className="truncate text-sm font-medium text-white">{email.from}</p>
                  </div>
                  <p className="mt-1 truncate text-sm text-zinc-300">{email.subject}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                    {email.text || stripHtmlToText(email.html) || "—"}
                  </p>
                  <p className="mt-2 text-[10px] text-zinc-600">
                    {new Date(email.receivedAt).toLocaleString("tr-TR")}
                  </p>
                </MailListButton>
              ))
            )
          ) : visibleSent.length === 0 ? (
            <EmptyState text="Henüz gönderilen e-posta yok." />
          ) : (
            visibleSent.map((entry) => (
              <MailListButton
                key={entry.id}
                active={selectedSentId === entry.id}
                onClick={() => {
                  setSelectedSentId(entry.id);
                  setComposeMode(null);
                }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      entry.status === "sent"
                        ? "bg-emerald-300/10 text-emerald-200"
                        : "bg-red-300/10 text-red-200"
                    }`}
                  >
                    {entry.status === "sent" ? "Gönderildi" : "Başarısız"}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {sentTypeLabels[entry.type]}
                  </span>
                </div>
                <p className="mt-2 truncate text-sm font-medium text-white">{entry.subject}</p>
                <p className="mt-1 truncate text-xs text-zinc-500">{entry.to}</p>
                <p className="mt-2 text-[10px] text-zinc-600">
                  {new Date(entry.sentAt).toLocaleString("tr-TR")}
                </p>
              </MailListButton>
            ))
          )}
        </div>

        <div className="min-h-[420px] rounded-[8px] border border-white/10 bg-white/[0.025] p-4 sm:p-5">
          {composeMode ? (
            <MailComposer
              mode={composeMode}
              supportEmail={supportEmail}
              composeTo={composeTo}
              composeSubject={composeSubject}
              composeMessage={composeMessage}
              composeName={composeName}
              sending={sending}
              sendError={sendError}
              onToChange={setComposeTo}
              onSubjectChange={setComposeSubject}
              onMessageChange={setComposeMessage}
              onNameChange={setComposeName}
              onCancel={cancelCompose}
              onSend={handleSend}
            />
          ) : tab === "inbox" && selectedInbox ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <MailHeader
                  subject={selectedInbox.subject}
                  from={selectedInbox.from}
                  to={selectedInbox.to.join(", ")}
                  date={selectedInbox.receivedAt}
                />
                <button
                  type="button"
                  onClick={startReply}
                  disabled={!configured}
                  className="shrink-0 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Cevapla
                </button>
              </div>
              {selectedInbox.html ? (
                <EmailPreview html={selectedInbox.html} />
              ) : (
                <pre className="mt-4 whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                  {selectedInbox.text || "İçerik yok."}
                </pre>
              )}
            </>
          ) : tab === "sent" && selectedSent ? (
            <>
              <MailHeader
                subject={selectedSent.subject}
                from="The Posterist"
                to={selectedSent.to}
                date={selectedSent.sentAt}
              />
              <EmailPreview html={selectedSent.html} />
            </>
          ) : (
            <p className="text-sm text-zinc-500">Okumak için soldan bir e-posta seçin.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MailComposer({
  mode,
  supportEmail,
  composeTo,
  composeSubject,
  composeMessage,
  composeName,
  sending,
  sendError,
  onToChange,
  onSubjectChange,
  onMessageChange,
  onNameChange,
  onCancel,
  onSend,
}: {
  mode: "reply" | "new";
  supportEmail: string;
  composeTo: string;
  composeSubject: string;
  composeMessage: string;
  composeName: string;
  sending: boolean;
  sendError: string | null;
  onToChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onCancel: () => void;
  onSend: () => void;
}) {
  return (
    <div>
      <div className="border-b border-white/8 pb-4">
        <h2 className="text-lg font-semibold text-white">
          {mode === "reply" ? "Cevap yaz" : "Yeni destek e-postası"}
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Marka şablonu ve logo ile gönderilir. Yanıtlar {supportEmail} adresine gelir.
        </p>
      </div>

      <div className="mt-4 space-y-4">
        {mode === "new" && (
          <>
            <Field label="Alıcı e-posta">
              <input
                type="email"
                value={composeTo}
                onChange={(event) => onToChange(event.target.value)}
                placeholder="musteri@ornek.com"
                className={inputClass}
              />
            </Field>
            <Field label="Alıcı adı (isteğe bağlı)">
              <input
                type="text"
                value={composeName}
                onChange={(event) => onNameChange(event.target.value)}
                placeholder="Ayşe"
                className={inputClass}
              />
            </Field>
          </>
        )}

        {mode === "reply" && (
          <Field label="Kime">
            <p className="text-sm text-zinc-300">{composeTo}</p>
          </Field>
        )}

        <Field label="Konu">
          <input
            type="text"
            value={composeSubject}
            onChange={(event) => onSubjectChange(event.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Mesaj">
          <textarea
            value={composeMessage}
            onChange={(event) => onMessageChange(event.target.value)}
            rows={8}
            placeholder="Mesajınızı yazın…"
            className={`${inputClass} resize-y`}
          />
        </Field>

        {sendError && (
          <p className="text-sm text-red-300">{sendError}</p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onSend}
            disabled={sending || !composeMessage.trim() || !composeSubject.trim()}
            className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sending ? "Gönderiliyor…" : "Gönder"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={sending}
            className="rounded-full border border-white/15 px-5 py-2 text-sm font-medium text-zinc-300 transition-colors hover:text-white"
          >
            İptal
          </button>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-[8px] border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-amber-300/40 focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-zinc-500">{label}</span>
      {children}
    </label>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[8px] border border-white/10 bg-white/[0.025] p-6 text-center text-sm text-zinc-500">
      {text}
    </div>
  );
}

function MailListButton({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-[8px] border p-3 text-left transition-colors ${
        active
          ? "border-amber-300/30 bg-amber-300/5"
          : "border-white/10 bg-white/[0.025] hover:border-white/20"
      }`}
    >
      {children}
    </button>
  );
}

function MailHeader({
  subject,
  from,
  to,
  date,
}: {
  subject: string;
  from: string;
  to: string;
  date: string;
}) {
  return (
    <div className="border-b border-white/8 pb-4">
      <h2 className="text-lg font-semibold text-white">{subject}</h2>
      <p className="mt-2 text-sm text-zinc-400">
        <span className="text-zinc-500">Kimden:</span> {from}
      </p>
      <p className="mt-1 text-sm text-zinc-500">
        <span className="text-zinc-600">Kime:</span> {to}
      </p>
      <p className="mt-1 text-xs text-zinc-600">
        {new Date(date).toLocaleString("tr-TR")}
      </p>
    </div>
  );
}

function EmailPreview({ html }: { html: string }) {
  return (
    <div className="mt-4 overflow-hidden rounded-[8px] border border-white/10 bg-white">
      <iframe
        title="E-posta önizleme"
        srcDoc={html}
        className="h-[480px] w-full bg-white"
        sandbox=""
      />
    </div>
  );
}
