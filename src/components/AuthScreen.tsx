import { TargetMark, GoogleG } from './Icons';

interface AuthScreenProps {
  onSignIn: () => void;
  isSigningIn: boolean;
  error: string | null;
}

export function AuthScreen({ onSignIn, isSigningIn, error }: AuthScreenProps) {
  return (
    <div className="auth">
      <div className="auth-inner">
        <div className="auth-mark">
          <TargetMark size={56} stroke={1.2} />
        </div>
        <h1 className="auth-wordmark">inscope</h1>
        <p className="auth-tagline">Your Gmail, in focus.</p>

        <button
          className="primary-button auth-button"
          onClick={onSignIn}
          disabled={isSigningIn}
        >
          <span className="g-mark">
            <GoogleG />
          </span>
          {isSigningIn ? 'Signing in…' : 'Sign in with Google'}
        </button>

        {error && (
          <p style={{ fontSize: 13, color: 'var(--destructive)', marginBottom: 16 }}>
            {error}
          </p>
        )}

        <ul className="auth-trust">
          <li style={{ marginBottom: '0.5rem' }}>Privacy-focused, your data is local on this device.</li>

        </ul>
        <ul className="auth-trust">

          <li>Free. Always.</li>
        </ul>
      </div>
    </div>
  );
}
