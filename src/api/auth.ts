// OAuth 2.0 via Google Identity Services (GIS)
// Tokens live in sessionStorage only — cleared on tab close by design.

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
].join(' ');

const TOKEN_KEY = 'inscope_token';
const TOKEN_EXPIRY_KEY = 'inscope_token_expiry';

export interface TokenInfo {
  access_token: string;
  expires_in: number;
}

// Google Identity Services types (loaded via script tag in index.html)
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: TokenInfo & { error?: string }) => void;
          }) => { requestAccessToken: () => void };
          revoke: (token: string, callback: () => void) => void;
        };
      };
    };
  }
}

type TokenCallback = (token: string | null) => void;

let tokenClient: ReturnType<
  NonNullable<Window['google']>['accounts']['oauth2']['initTokenClient']
> | null = null;

let pendingCallback: TokenCallback | null = null;

function initTokenClient(): void {
  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google Identity Services not loaded');
  }
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (response) => {
      if (response.error || !response.access_token) {
        pendingCallback?.(null);
        pendingCallback = null;
        return;
      }
      const expiry = Date.now() + response.expires_in * 1000 - 60_000; // 1min buffer
      sessionStorage.setItem(TOKEN_KEY, response.access_token);
      sessionStorage.setItem(TOKEN_EXPIRY_KEY, String(expiry));
      pendingCallback?.(response.access_token);
      pendingCallback = null;
    },
  });
}

export function requestToken(callback: TokenCallback): void {
  if (!tokenClient) {
    initTokenClient();
  }
  pendingCallback = callback;
  tokenClient!.requestAccessToken();
}

export function getStoredToken(): string | null {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const expiry = sessionStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!token || !expiry) return null;
  if (Date.now() > Number(expiry)) {
    clearToken();
    return null;
  }
  return token;
}

export function clearToken(): void {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (token && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(token, () => {});
  }
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
}

export function isGisReady(): boolean {
  return !!window.google?.accounts?.oauth2;
}
