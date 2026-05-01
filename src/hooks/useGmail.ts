import { useState, useCallback } from 'react';
import { listUnreadMessages, getMessageMetadata } from '../api/gmail';
import { parseSenderInfo } from '../utils/senderLabel';
import type { Sender, Thread, SyncState } from '../types/gmail';

export interface GmailState {
  senders: Sender[];
  syncState: SyncState;
  error: string | null;
  sync: () => void;
  updateSender: (email: string, patch: Partial<Sender> | null) => void;
}

// Format raw internalDate (ms since epoch string) to "Apr 28" style
function formatDate(internalDate: string | undefined): string {
  if (!internalDate) return '';
  const d = new Date(Number(internalDate));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function useGmail(token: string | null): GmailState {
  const [senders, setSenders] = useState<Sender[]>([]);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [error, setError] = useState<string | null>(null);

  const sync = useCallback(async () => {
    if (!token) return;
    setSyncState('syncing');
    setError(null);

    try {
      const messageRefs = await listUnreadMessages(token);
      if (messageRefs.length === 0) {
        setSenders([]);
        setSyncState('live');
        return;
      }

      // Fetch metadata in parallel, up to 10 at a time
      const CONCURRENCY = 10;
      const metadataResults: Awaited<ReturnType<typeof getMessageMetadata>>[] = [];

      for (let i = 0; i < messageRefs.length; i += CONCURRENCY) {
        const chunk = messageRefs.slice(i, i + CONCURRENCY);
        const results = await Promise.all(
          chunk.map((ref) => getMessageMetadata(ref.id, token))
        );
        metadataResults.push(...results);
        // Respect quota — small pause between chunks
        if (i + CONCURRENCY < messageRefs.length) {
          await new Promise((r) => setTimeout(r, 80));
        }
      }

      // Group by normalized sender email
      const senderMap = new Map<string, Sender>();

      for (const msg of metadataResults) {
        const headers = msg.payload?.headers ?? [];
        const fromHeader = headers.find((h) => h.name.toLowerCase() === 'from')?.value ?? '';
        const subjectHeader =
          headers.find((h) => h.name.toLowerCase() === 'subject')?.value ?? '(no subject)';
        const unsubHeader =
          headers.find((h) => h.name.toLowerCase() === 'list-unsubscribe')?.value;

        const { name, email } = parseSenderInfo(fromHeader);
        const thread: Thread = {
          id: msg.id,
          subject: subjectHeader,
          snippet: msg.snippet ?? '',
          date: formatDate(msg.internalDate),
          listUnsubscribe: unsubHeader,
        };

        const existing = senderMap.get(email);
        if (existing) {
          existing.count++;
          existing.threads.push(thread);
          if (unsubHeader) existing.hasUnsub = true;
        } else {
          senderMap.set(email, {
            name,
            email,
            count: 1,
            hasUnsub: !!unsubHeader,
            threads: [thread],
          });
        }
      }

      // Sort by count descending
      const sorted = Array.from(senderMap.values()).sort((a, b) => b.count - a.count);
      setSenders(sorted);
      setSyncState('live');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sync Gmail';
      setError(message);
      setSyncState('error');
    }
  }, [token]);

  const updateSender = useCallback(
    (email: string, patch: Partial<Sender> | null) => {
      setSenders((prev) => {
        if (patch === null) return prev.filter((s) => s.email !== email);
        return prev.map((s) => (s.email === email ? { ...s, ...patch } : s));
      });
    },
    []
  );

  return { senders, syncState, error, sync, updateSender };
}
