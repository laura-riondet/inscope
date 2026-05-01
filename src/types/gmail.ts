// Gmail API response shapes and app state types

export type SyncState = 'idle' | 'syncing' | 'live' | 'error';

export interface Account {
  email: string;
}

export interface Thread {
  id: string;
  subject: string;
  snippet: string;
  date: string;
  listUnsubscribe?: string;
}

export interface Sender {
  name: string;
  email: string;
  count: number;
  hasUnsub: boolean;
  threads: Thread[];
}

// Raw Gmail API shapes

export interface GmailMessageHeader {
  name: string;
  value: string;
}

export interface GmailMessagePart {
  headers?: GmailMessageHeader[];
}

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload?: GmailMessagePart;
  internalDate?: string;
}

export interface GmailThread {
  id: string;
  messages?: GmailMessage[];
}

export interface GmailListResponse {
  messages?: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

export interface GmailBatchModifyRequest {
  ids: string[];
  addLabelIds?: string[];
  removeLabelIds?: string[];
}
