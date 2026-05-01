// Gmail multipart batch request helper.
// https://developers.google.com/gmail/api/guides/batch

const BATCH_URL = 'https://www.googleapis.com/batch/gmail/v1';

export interface BatchRequest {
  id: string;
  method: string;
  path: string;
  body?: unknown;
}

export interface BatchResponse<T> {
  id: string;
  status: number;
  body: T;
}

export async function batchRequest<T>(
  requests: BatchRequest[],
  token: string
): Promise<BatchResponse<T>[]> {
  const boundary = `batch_inscope_${Date.now()}`;
  const parts = requests.map((r) => {
    const bodyStr = r.body ? JSON.stringify(r.body) : '';
    return [
      `--${boundary}`,
      'Content-Type: application/http',
      `Content-ID: <${r.id}>`,
      '',
      `${r.method} ${r.path} HTTP/1.1`,
      'Content-Type: application/json',
      '',
      bodyStr,
    ].join('\r\n');
  });

  const body = parts.join('\r\n') + `\r\n--${boundary}--`;

  const res = await fetch(BATCH_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/mixed; boundary=${boundary}`,
    },
    body,
  });

  if (!res.ok) {
    throw new Error(`Batch request failed: ${res.status}`);
  }

  const text = await res.text();
  return parseBatchResponse<T>(text);
}

function parseBatchResponse<T>(text: string): BatchResponse<T>[] {
  const results: BatchResponse<T>[] = [];
  const boundaryMatch = text.match(/^--([^\r\n]+)/);
  if (!boundaryMatch) return results;

  const boundary = boundaryMatch[1];
  const parts = text.split(`--${boundary}`).slice(1);

  for (const part of parts) {
    if (part.trim() === '--') break;
    const [, responseText] = part.split(/\r\n\r\n([\s\S]+)/);
    if (!responseText) continue;

    const [httpLine, ...rest] = responseText.trim().split('\r\n');
    const statusMatch = httpLine?.match(/HTTP\/\d+\.\d+\s+(\d+)/);
    if (!statusMatch) continue;

    const status = parseInt(statusMatch[1], 10);
    const bodyStart = rest.join('\r\n').indexOf('\r\n\r\n');
    const bodyText = bodyStart >= 0 ? rest.join('\r\n').slice(bodyStart + 4) : '';

    const idMatch = part.match(/Content-ID:\s*<([^>]+)>/i);
    const id = idMatch?.[1] ?? '';

    let body: T;
    try {
      body = JSON.parse(bodyText) as T;
    } catch {
      body = bodyText as unknown as T;
    }

    results.push({ id, status, body });
  }

  return results;
}
