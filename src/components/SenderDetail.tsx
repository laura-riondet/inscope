import { useState, useEffect, useRef } from 'react';
import { Avatar } from './Avatar';
import { ThreadRow } from './ThreadRow';
import { parseUnsubscribeHeader } from '../utils/unsubscribe';
import { trashMessages, sendUnsubscribeEmail } from '../api/gmail';
import type { Sender, Thread } from '../types/gmail';

type UnsubState = 'idle' | 'searching' | 'found' | 'none';

interface SenderDetailProps {
  sender: Sender;
  token: string;
  onBack: () => void;
  onUpdate: (email: string, patch: Partial<Sender> | null) => void;
}

export function SenderDetail({ sender, token, onBack, onUpdate }: SenderDetailProps) {
  const [unsubState, setUnsubState] = useState<UnsubState>('idle');
  const [unsubUrl, setUnsubUrl] = useState<{ mailto: string | null; https: string | null } | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [threads, setThreads] = useState<Thread[]>(sender.threads);
  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setThreads(sender.threads);
    setExpandedId(null);
    setUnsubState('idle');
    setUnsubUrl(null);
  }, [sender.email]); // eslint-disable-line react-hooks/exhaustive-deps

  async function findUnsubscribe() {
    if (unsubState === 'searching') return;
    setUnsubState('searching');

    try {
      // Look for a List-Unsubscribe header in the threads we already have
      const headerValue = threads
        .map((t) => t.listUnsubscribe)
        .find((h) => h != null);

      if (headerValue) {
        const parsed = parseUnsubscribeHeader(headerValue);
        if (parsed.mailto || parsed.https) {
          setUnsubUrl(parsed);
          setUnsubState('found');
          return;
        }
      }
      setUnsubState('none');
    } catch {
      setUnsubState('none');
    }
  }

  async function handleUnsubscribe() {
    if (!unsubUrl) return;

    const ids = threads.map((t) => t.id);
    setDeletingIds(new Set(ids));

    try {
      if (unsubUrl.mailto) {
        await sendUnsubscribeEmail(unsubUrl.mailto, token);
      } else if (unsubUrl.https) {
        window.open(unsubUrl.https, '_blank', 'noopener,noreferrer');
      }
      // Also trash all emails from this sender
      await trashMessages(ids, token);
    } catch {
      // Best-effort — UI still removes the sender
    }

    setTimeout(() => {
      onUpdate(sender.email, null);
      onBack();
    }, 380);
  }

  function handleDeleteAllClick() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      confirmTimeoutRef.current = setTimeout(() => setConfirmingDelete(false), 2200);
      return;
    }
    if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);

    const ids = threads.map((t) => t.id);
    setDeletingIds(new Set(ids));

    trashMessages(ids, token).catch(() => {});

    setTimeout(() => {
      setThreads([]);
      setDeletingIds(new Set());
      setConfirmingDelete(false);
      onUpdate(sender.email, { count: 0, threads: [] });
    }, 520);
  }

  async function deleteSingleThread(thread: Thread) {
    setDeletingIds((prev) => new Set(prev).add(thread.id));

    try {
      await trashMessages([thread.id], token);
    } catch {
      // Best-effort
    }

    setTimeout(() => {
      setThreads((prev) => {
        const next = prev.filter((t) => t.id !== thread.id);
        onUpdate(sender.email, { threads: next, count: Math.max(0, sender.count - 1) });
        return next;
      });
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(thread.id);
        return next;
      });
      if (expandedId === thread.id) setExpandedId(null);
    }, 520);
  }

  return (
    <div className="view detail-view">
      <button className="back-button" onClick={onBack}>
        <span className="back-arrow" aria-hidden="true">←</span> Back
      </button>

      <header className="detail-header">
        <div className="detail-identity">
          <Avatar name={sender.name} size={48} />
          <div className="detail-id-text">
            <h2 className="detail-name">{sender.name}</h2>
            <div className="detail-email">{sender.email}</div>
          </div>
        </div>
        <p className="detail-count">
          <span className="mono">{threads.length}</span> unread email
          {threads.length === 1 ? '' : 's'}
        </p>
      </header>

      <div className="action-bar">
        {unsubState === 'idle' && (
          <button className="text-action" onClick={findUnsubscribe}>
            <span className="action-icon" aria-hidden="true">⌖</span>
            Find unsubscribe link
          </button>
        )}
        {unsubState === 'searching' && (
          <button className="text-action" disabled>
            <span className="action-icon searching" aria-hidden="true">⌖</span>
            Searching headers…
          </button>
        )}
        {unsubState === 'found' && (
          <button className="primary-button" onClick={handleUnsubscribe}>
            Unsubscribe ↗
          </button>
        )}
        {unsubState === 'none' && (
          <button className="text-action" disabled>
            No unsubscribe header found
          </button>
        )}

        <button
          className={`destructive-button${confirmingDelete ? ' confirming' : ''}`}
          onClick={handleDeleteAllClick}
          disabled={threads.length === 0}
        >
          {confirmingDelete
            ? `Confirm delete (${threads.length})`
            : `Delete all (${threads.length})`}
        </button>
      </div>

      {unsubState === 'found' && (
        <div className="inline-status fade-in">
          <span className="check" aria-hidden="true">✓</span>
          Unsubscribe link found in{' '}
          <span className="mono">List-Unsubscribe</span> header
        </div>
      )}

      <div className="hairline" />

      {threads.length === 0 ? (
        <div className="empty-zero small">
          <div className="empty-mark">—</div>
          <p className="empty-line">All cleared from this sender.</p>
        </div>
      ) : (
        <ul className="thread-list">
          {threads.map((thread, i) => (
            <ThreadRow
              key={thread.id}
              thread={thread}
              idx={i}
              isExpanded={expandedId === thread.id}
              isDeleting={deletingIds.has(thread.id)}
              onToggle={() => setExpandedId(expandedId === thread.id ? null : thread.id)}
              onDelete={() => deleteSingleThread(thread)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
