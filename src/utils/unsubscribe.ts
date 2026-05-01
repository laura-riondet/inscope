// Parses RFC 2369 List-Unsubscribe header values.
// Header examples:
//   <mailto:unsub@example.com>, <https://example.com/unsub?id=123>
//   <https://example.com/unsub>
//   mailto:unsub@example.com

export interface UnsubscribeOptions {
  mailto: string | null;
  https: string | null;
}

export function parseUnsubscribeHeader(header: string): UnsubscribeOptions {
  const mailto = header.match(/<mailto:([^>]+)>/)?.[1] ?? null;
  const https = header.match(/<(https:\/\/[^>]+)>/)?.[1] ?? null;
  return { mailto, https };
}
