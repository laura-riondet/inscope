import { useState, useCallback, useEffect } from 'react';
import { requestToken, getStoredToken, clearToken, isGisReady } from '../api/auth';
import type { Account } from '../types/gmail';
import { getProfile } from '../api/gmail';

export interface AuthState {
  account: Account | null;
  token: string | null;
  signIn: () => void;
  signOut: () => void;
  isSigningIn: boolean;
  error: string | null;
}

export function useAuth(): AuthState {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [account, setAccount] = useState<Account | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resolve account email once we have a token
  useEffect(() => {
    if (!token) {
      setAccount(null);
      return;
    }
    getProfile(token)
      .then((profile) => setAccount({ email: profile.emailAddress }))
      .catch(() => {
        // Token may have expired between page loads
        clearToken();
        setToken(null);
      });
  }, [token]);

  const signIn = useCallback(() => {
    setError(null);
    setIsSigningIn(true);

    // GIS script may still be loading — poll briefly
    const attempt = () => {
      if (!isGisReady()) {
        setTimeout(attempt, 200);
        return;
      }
      requestToken((newToken) => {
        setIsSigningIn(false);
        if (!newToken) {
          setError('Sign-in was cancelled or failed. Please try again.');
          return;
        }
        setToken(newToken);
      });
    };
    attempt();
  }, []);

  const signOut = useCallback(() => {
    clearToken();
    setToken(null);
    setAccount(null);
    setError(null);
  }, []);

  return { account, token, signIn, signOut, isSigningIn, error };
}
