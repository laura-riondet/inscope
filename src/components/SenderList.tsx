import { useState, useMemo, useRef } from 'react';
import { Avatar } from './Avatar';
import { TargetMark } from './Icons';
import type { Sender } from '../types/gmail';

// Skeleton row for loading state
function SkeletonRow({ delay }: { delay: number }) {
  return (
    <li className="sender-row skeleton" style={{ animationDelay: `${delay}ms` }}>
      <div className="sk-avatar" />
      <div className="sk-info">
        <div className="sk-line sk-line-1" />
        <div className="sk-line sk-line-2" />
      </div>
      <div className="sk-count" />
    </li>
  );
}

interface SenderRowProps {
  sender: Sender;
  idx: number;
  isDeleting: boolean;
  onOpen: (sender: Sender) => void;
  onDeleteAll: (sender: Sender) => void;
}

function SenderRow({ sender, idx, isDeleting, onOpen, onDeleteAll }: SenderRowProps) {
  const isHot = sender.count >= 20;
  const [confirming, setConfirming] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirming) {
      setConfirming(true);
      timeoutRef.current = setTimeout(() => setConfirming(false), 2200);
      return;
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    onDeleteAll(sender);
  }

  function handleMouseLeave() {
    if (confirming) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setConfirming(false), 600);
    }
  }

  return (
    <li
      className={`sender-row${isDeleting ? ' row-deleting' : ''}`}
      style={{ animationDelay: `${Math.min(idx, 10) * 40}ms` }}
      onClick={() => !isDeleting && onOpen(sender)}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={0}
      aria-label={`Open emails from ${sender.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !isDeleting) onOpen(sender);
      }}
    >
      <span className="row-reticle" aria-hidden="true">
        <TargetMark size={28} stroke={1.4} />
      </span>
      <Avatar name={sender.name} />
      <div className="sender-info">
        <div className="sender-name">{sender.name}</div>
        <div className="sender-email">{sender.email}</div>
      </div>
      <button
        className={`row-delete${confirming ? ' confirming' : ''}`}
        onClick={handleDelete}
        title={
          confirming
            ? 'Click again to confirm'
            : `Delete all ${sender.count} from ${sender.name}`
        }
        aria-label={
          confirming ? `Confirm delete ${sender.count} emails` : `Delete all from ${sender.name}`
        }
      >
        {confirming ? `Confirm (${sender.count})` : 'Delete all'}
      </button>
      <div className={`sender-count${isHot ? ' hot' : ''}`}>{sender.count}</div>
    </li>
  );
}

interface SenderListProps {
  senders: Sender[];
  loading: boolean;
  error: string | null;
  onOpenSender: (sender: Sender) => void;
  onDeleteSender: (email: string) => void;
  onRetry: () => void;
}

export function SenderList({
  senders,
  loading,
  error,
  onOpenSender,
  onDeleteSender,
  onRetry,
}: SenderListProps) {
  const [query, setQuery] = useState('');
  const [deletingEmails, setDeletingEmails] = useState<Set<string>>(new Set());

  function handleDeleteSender(sender: Sender) {
    setDeletingEmails((prev) => new Set(prev).add(sender.email));
    setTimeout(() => {
      onDeleteSender(sender.email);
      setDeletingEmails((prev) => {
        const next = new Set(prev);
        next.delete(sender.email);
        return next;
      });
    }, 520);
  }

  const filtered = useMemo(() => {
    if (!query.trim()) return senders;
    const q = query.toLowerCase();
    return senders.filter(
      (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }, [senders, query]);

  const totalUnread = useMemo(
    () => senders.reduce((sum, s) => sum + s.count, 0),
    [senders]
  );

  return (
    <div className="view list-view">
      <header className="list-header">
        <div className="list-header-row">
          <div className="list-titles">
            <h1 className="page-title">Inbox</h1>
            <p className="page-subtitle">
              {loading ? (
                '—'
              ) : (
                <>
                  <span className="mono">{totalUnread.toLocaleString()}</span> unread across{' '}
                  <span className="mono">{senders.length}</span> senders
                </>
              )}
            </p>
            <div className="filter-wrap">
              <input
                type="text"
                className="filter-input"
                placeholder="filter…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                spellCheck={false}
                autoComplete="off"
                aria-label="Filter senders"
              />
            </div>
          </div>

          <aside className="postit" aria-label="Privacy note">
            <span className="postit-tape" aria-hidden="true" />
            <p className="postit-body">
              <strong>No backend. No data harvest.</strong> Your inbox is read directly from
              the Gmail API in this browser tab — nothing is sent to, or stored on, any server
              we run.
            </p>
          </aside>
        </div>
        <div className="hairline" />
      </header>

      {error ? (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={onRetry}>Retry</button>
        </div>
      ) : loading ? (
        <ul className="sender-list">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonRow key={i} delay={i * 60} />
          ))}
        </ul>
      ) : senders.length === 0 ? (
        <div className="empty-zero">
          <div className="empty-mark">—</div>
          <p className="empty-line">Nothing out of scope.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-filter">
          <p>No senders match &ldquo;{query}&rdquo;</p>
        </div>
      ) : (
        <ul className="sender-list">
          {filtered.map((sender, idx) => (
            <SenderRow
              key={sender.email}
              sender={sender}
              idx={idx}
              isDeleting={deletingEmails.has(sender.email)}
              onDeleteAll={handleDeleteSender}
              onOpen={onOpenSender}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
