import { TargetMark, GmailMark } from './Icons';
import type { SyncState } from '../types/gmail';

interface TopNavProps {
  signedIn: boolean;
  email: string;
  syncState: SyncState;
  onSignOut: () => void;
}

export function TopNav({ signedIn, email, syncState, onSignOut }: TopNavProps) {
  return (
    <nav className="topnav">
      <div className="topnav-inner">
        <div className="wordmark">
          <span className="wordmark-mark">
            <TargetMark size={20} />
          </span>
          <span className="wordmark-text">inscope</span>
        </div>

        {signedIn && (
          <div className="account-cluster">
            <div
              className={`sync-pill sync-${syncState}`}
              title={
                syncState === 'syncing'
                  ? 'Syncing with Gmail'
                  : syncState === 'live'
                  ? 'Connected to Gmail'
                  : 'Offline'
              }
            >
              <span className="sync-gmark">
                <GmailMark size={13} />
              </span>
              <span className="sync-dot" aria-hidden="true" />
              <span className="sync-email mono">{email}</span>
            </div>
            <button className="text-button" onClick={onSignOut}>
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
