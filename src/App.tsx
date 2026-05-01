import { useEffect, useState } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { TopNav } from './components/TopNav';
import { SenderList } from './components/SenderList';
import { SenderDetail } from './components/SenderDetail';
import { useAuth } from './hooks/useAuth';
import { useGmail } from './hooks/useGmail';
import type { Sender } from './types/gmail';

export function App() {
  const { account, token, signIn, signOut, isSigningIn, error: authError } = useAuth();
  const { senders, syncState, error: gmailError, sync, updateSender } = useGmail(token);
  const [currentSenderEmail, setCurrentSenderEmail] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const signedIn = !!account && !!token;

  // Trigger sync once signed in
  useEffect(() => {
    if (signedIn) {
      sync();
    }
  }, [signedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSignOut() {
    setSigningOut(true);
    setTimeout(() => {
      signOut();
      setCurrentSenderEmail(null);
      setSigningOut(false);
    }, 280);
  }

  function openSender(sender: Sender) {
    setCurrentSenderEmail(sender.email);
  }

  function closeSender() {
    setCurrentSenderEmail(null);
  }

  const currentSender = senders.find((s) => s.email === currentSenderEmail) ?? null;
  const isLoading = syncState === 'syncing' || syncState === 'idle';

  return (
    <div className={`app${signingOut ? ' signing-out' : ''}`}>
      <TopNav
        signedIn={signedIn}
        email={account?.email ?? ''}
        syncState={syncState}
        onSignOut={handleSignOut}
      />

      {!signedIn ? (
        <AuthScreen onSignIn={signIn} isSigningIn={isSigningIn} error={authError} />
      ) : (
        <main className="main">
          <div
            className={`view-stack${currentSender ? ' is-detail' : ' is-list'}`}
          >
            <div className={`view-pane list-pane`}>
              <SenderList
                senders={senders}
                loading={isLoading}
                error={gmailError}
                onOpenSender={openSender}
                onDeleteSender={(email) => updateSender(email, null)}
                onRetry={sync}
              />
            </div>
            {currentSender && token && (
              <div className="view-pane detail-pane">
                <SenderDetail
                  key={currentSender.email}
                  sender={currentSender}
                  token={token}
                  onBack={closeSender}
                  onUpdate={updateSender}
                />
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  );
}
