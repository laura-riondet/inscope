// Maps a raw From header to a friendly display name and normalized email.
// e.g. "Substack <no-reply@substack.com>" → { name: "Substack", email: "no-reply@substack.com" }

export interface SenderInfo {
  name: string;
  email: string;
}

export function parseSenderInfo(from: string): SenderInfo {
  const angleMatch = from.match(/^(.*?)\s*<([^>]+)>\s*$/);
  if (angleMatch) {
    const rawName = angleMatch[1].trim().replace(/^["']|["']$/g, '');
    const email = angleMatch[2].trim().toLowerCase();
    const name = rawName || domainLabel(email);
    return { name, email };
  }
  // Just an email address
  const email = from.trim().toLowerCase();
  return { name: domainLabel(email), email };
}

function domainLabel(email: string): string {
  const domain = email.split('@')[1] ?? email;
  // Strip common TLDs and subdomains for a friendlier label
  return domain
    .replace(/^(mail|email|noreply|no-reply|newsletter|news|notifications?)\./i, '')
    .replace(/\.(com|net|org|io|co|app)$/i, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Deterministic muted avatar color in OKLCH narrow chroma band
export function avatarColorFor(name: string): { bg: string; fg: string } {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = ((h * 31) + name.charCodeAt(i)) >>> 0;
  }
  const hue = h % 360;
  return {
    bg: `oklch(0.88 0.04 ${hue})`,
    fg: `oklch(0.32 0.06 ${hue})`,
  };
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
