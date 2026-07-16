import { randomUUID } from "node:crypto";
import { readTextFile, writeTextFile } from "@/lib/db/storage";

export type InboxAttachment = {
  id: string;
  filename: string;
  contentType: string;
  size?: number;
};

export type InboxEmail = {
  id: string;
  resendEmailId: string;
  from: string;
  to: string[];
  subject: string;
  text: string;
  html: string;
  read: boolean;
  receivedAt: string;
  attachments: InboxAttachment[];
};

const DATA_FILE = "data/inbox.json";
const MAX_ENTRIES = 300;

async function readAll(): Promise<InboxEmail[]> {
  const raw = await readTextFile(DATA_FILE);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as InboxEmail[]) : [];
  } catch {
    return [];
  }
}

async function writeAll(entries: InboxEmail[]): Promise<void> {
  await writeTextFile(DATA_FILE, `${JSON.stringify(entries, null, 2)}\n`);
}

export async function listInboxEmails(): Promise<InboxEmail[]> {
  const entries = await readAll();
  return entries.sort(
    (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime(),
  );
}

export async function getInboxEmailById(id: string): Promise<InboxEmail | undefined> {
  const entries = await readAll();
  return entries.find((entry) => entry.id === id);
}

export async function getInboxEmailByResendId(
  resendEmailId: string,
): Promise<InboxEmail | undefined> {
  const entries = await readAll();
  return entries.find((entry) => entry.resendEmailId === resendEmailId);
}

export async function recordInboxEmail(
  input: Omit<InboxEmail, "id" | "read">,
): Promise<InboxEmail> {
  const existing = await getInboxEmailByResendId(input.resendEmailId);
  if (existing) return existing;

  const entries = await readAll();
  const entry: InboxEmail = {
    ...input,
    id: randomUUID(),
    read: false,
  };

  entries.unshift(entry);
  await writeAll(entries.slice(0, MAX_ENTRIES));
  return entry;
}

export async function markInboxEmailRead(id: string): Promise<InboxEmail | undefined> {
  const entries = await readAll();
  const index = entries.findIndex((entry) => entry.id === id);
  if (index === -1) return undefined;

  entries[index] = { ...entries[index], read: true };
  await writeAll(entries);
  return entries[index];
}

export async function countUnreadInboxEmails(): Promise<number> {
  const entries = await readAll();
  return entries.filter((entry) => !entry.read).length;
}
