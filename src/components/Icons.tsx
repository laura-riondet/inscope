// Inline SVG marks used throughout the app

interface TargetMarkProps {
  size?: number;
  stroke?: number;
}

export function TargetMark({ size = 22, stroke = 1.4 }: TargetMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="target-mark"
    >
      <line x1="12" y1="0.5" x2="12" y2="4.2" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" />
      <line x1="12" y1="19.8" x2="12" y2="23.5" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" />
      <line x1="0.5" y1="12" x2="4.2" y2="12" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" />
      <line x1="19.8" y1="12" x2="23.5" y2="12" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" />
      <circle cx="12" cy="12" r="7.8" fill="none" stroke="currentColor" strokeWidth={stroke} />
      <circle cx="12" cy="12" r="3.8" fill="none" stroke="currentColor" strokeWidth={stroke} />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" />
    </svg>
  );
}

interface GmailMarkProps {
  size?: number;
}

export function GmailMark({ size = 14 }: GmailMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 5.5A2.5 2.5 0 0 1 5.5 3h13A2.5 2.5 0 0 1 21 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18.5v-13Zm2 .8v12.2c0 .28.22.5.5.5H7V10.4l5 3.75 5-3.75V19h1.5a.5.5 0 0 0 .5-.5V6.3L12 11.1 5 6.3Z"
      />
    </svg>
  );
}

export function GoogleG() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="currentColor" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.13 4.13 0 0 1-1.79 2.71v2.26h2.9c1.7-1.56 2.69-3.87 2.69-6.6z"/>
      <path fill="currentColor" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.81.54-1.83.86-3.06.86-2.36 0-4.36-1.59-5.07-3.73H.96v2.34A9 9 0 0 0 9 18z"/>
      <path fill="currentColor" d="M3.93 10.69a5.4 5.4 0 0 1 0-3.43V4.92H.96a9 9 0 0 0 0 8.07l2.97-2.3z"/>
      <path fill="currentColor" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.92l2.97 2.34C4.64 5.17 6.64 3.58 9 3.58z"/>
    </svg>
  );
}
