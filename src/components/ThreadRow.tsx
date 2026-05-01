import { useState, useRef } from 'react';
import { TargetMark } from './Icons';
import type { Thread } from '../types/gmail';

interface ThreadRowProps {
  thread: Thread;
  idx: number;
  isExpanded: boolean;
  isDeleting: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

export function ThreadRow({
  thread,
  idx,
  isExpanded,
  isDeleting,
  onToggle,
  onDelete,
}: ThreadRowProps) {
  const [confirming, setConfirming] = useState(false);
  const confirmRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastClickRef = useRef(0);

  function handleClick(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('.thread-actions, .thread-expanded-body, .thread-delete-btn')) {
      return;
    }
    const now = Date.now();
    if (now - lastClickRef.current < 280) {
      lastClickRef.current = 0;
      onDelete();
      return;
    }
    lastClickRef.current = now;
    setTimeout(() => {
      if (Date.now() - lastClickRef.current >= 280 && lastClickRef.current !== 0) {
        onToggle();
        lastClickRef.current = 0;
      }
    }, 290);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') onToggle();
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (!confirming) {
        setConfirming(true);
        confirmRef.current = setTimeout(() => setConfirming(false), 2200);
      } else {
        if (confirmRef.current) clearTimeout(confirmRef.current);
        onDelete();
      }
    }
    if (e.key === 'Escape') {
      if (isExpanded) onToggle();
    }
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirming) {
      setConfirming(true);
      confirmRef.current = setTimeout(() => setConfirming(false), 2200);
      return;
    }
    if (confirmRef.current) clearTimeout(confirmRef.current);
    onDelete();
  }

  return (
    <li
      className={`thread-row${isExpanded ? ' expanded' : ''}${isDeleting ? ' deleting' : ''}`}
      style={{ animationDelay: `${Math.min(idx, 8) * 30}ms` }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-expanded={isExpanded}
      aria-label={thread.subject}
    >
      <span className="thread-reticle" aria-hidden="true">
        <TargetMark size={28} stroke={1.4} />
      </span>
      <div className="thread-main">
        <div className="thread-subject">{thread.subject}</div>
        <div className="thread-snippet">{thread.snippet}</div>
        {isExpanded && (
          <div className="thread-expanded-body">
            <p>
              {thread.snippet} — inscope reads message metadata only. Open in Gmail for the
              full email.
            </p>
            <div className="thread-actions">
              <button
                className={`thread-delete-btn${confirming ? ' confirming' : ''}`}
                onClick={handleDeleteClick}
              >
                {confirming ? 'Confirm delete' : 'Delete this email'}
              </button>
              <span className="thread-hint">double-click row to delete instantly</span>
            </div>
          </div>
        )}
      </div>
      <div className="thread-date">{thread.date}</div>
    </li>
  );
}
