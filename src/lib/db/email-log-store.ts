import { randomUUID } from "node:crypto";
import { readTextFile, writeTextFile } from "@/lib/db/storage";

export type EmailLogType =
  | "order_confirmation"
  | "admin_order_notification"
  | "support";

export type EmailLogEntry = {
  id: string;
  type: EmailLogType;
  orderId?: string;
  to: string;
  subject: string;
  html: string;
  status: "sent" | "failed";
  error?: string;
  sentAt: string;
};

const DATA_FILE = "data/email-log.json";
const MAX_ENTRIES = 200;

async function readAll(): Promise<EmailLogEntry[]> {
  const raw = await readTextFile(DATA_FILE);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as EmailLogEntry[]) : [];
  } catch {
    return [];
  }
}

async function writeAll(entries: EmailLogEntry[]): Promise<void> {
  await writeTextFile(DATA_FILE, `${JSON.stringify(entries, null, 2)}\n`);
}

export async function listEmailLogs(): Promise<EmailLogEntry[]> {
  const entries = await readAll();
  return entries.sort(
    (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
  );
}

export async function recordEmailLog(
  input: Omit<EmailLogEntry, "id" | "sentAt">,
): Promise<EmailLogEntry> {
  const entries = await readAll();
  const entry: EmailLogEntry = {
    ...input,
    id: randomUUID(),
    sentAt: new Date().toISOString(),
  };

  entries.unshift(entry);
  await writeAll(entries.slice(0, MAX_ENTRIES));
  return entry;
}
