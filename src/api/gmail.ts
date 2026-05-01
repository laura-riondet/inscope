// All Gmail API calls — direct fetch() to googleapis.com, no SDK.

import type {
  GmailListResponse,
  GmailMessage,
  GmailBatchModifyRequest,
} from '../types/gmail';

const BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

async function req<T>(
  path: string,
  token: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Gmail API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// Fetch unread message IDs — up to 10 pages (1000 messages).
export async function listUnreadMessages(
  token: string
): Promise<Array<{ id: string; threadId: string }>> {
  const allMessages: Array<{ id: string; threadId: string }> = [];
  let pageToken: string | undefined;
  let pages = 0;

  do {
    const params = new URLSearchParams({
      q: 'is:unread in:inbox',
      maxResults: '100',
    });
    if (pageToken) params.set('pageToken', pageToken);

    const data = await req<GmailListResponse>(`/messages?${params}`, token);
    if (data.messages) allMessages.push(...data.messages);
    pageToken = data.nextPageToken;
    pages++;
  } while (pageToken && pages < 10);

  return allMessages;
}

// Fetch message metadata (From, Subject, Date, List-Unsubscribe) — never full body.
export async function getMessageMetadata(
  id: string,
  token: string
): Promise<GmailMessage> {
  const params = new URLSearchParams({
    format: 'metadata',
  });
  ['From', 'Subject', 'Date', 'List-Unsubscribe'].forEach((h) =>
    params.append('metadataHeaders', h)
  );
  return req<GmailMessage>(`/messages/${id}?${params}`, token);
}

// Move messages to Trash in batches of 100.
// Rate: 250 units/s; trash = 5 units each → max 50/batch safely.
export async function trashMessages(ids: string[], token: string): Promise<void> {
  const BATCH_SIZE = 50;
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const chunk = ids.slice(i, i + BATCH_SIZE);
    const body: GmailBatchModifyRequest = {
      ids: chunk,
      addLabelIds: ['TRASH'],
    };
    await req<void>('/messages/batchModify', token, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (i + BATCH_SIZE < ids.length) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
}

// Send a bare-minimum unsubscribe email via mailto: header.
export async function sendUnsubscribeEmail(
  toAddress: string,
  token: string
): Promise<void> {
  const raw = btoa(
    `To: ${toAddress}\r\nSubject: unsubscribe\r\n\r\n`
  )
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  await req<void>('/messages/send', token, {
    method: 'POST',
    body: JSON.stringify({ raw }),
  });
}

// Get the profile email for the signed-in user.
export async function getProfile(token: string): Promise<{ emailAddress: string }> {
  return req<{ emailAddress: string }>('/profile', token);
}
