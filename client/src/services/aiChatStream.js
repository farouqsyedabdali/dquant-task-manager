import { API_BASE_URL } from '../config/api';

/**
 * POST /ai/chat-stream (SSE). Invokes callbacks for each event until done/error.
 * @param {string} message
 * @param {{ role: 'user'|'assistant', content: string }[]} history
 * @param {{ signal?: AbortSignal; onDelta?: (t: string) => void; onMeta?: (p: { phase: string }) => void; onDone?: (p: { response: string; proposals: unknown[] }) => void; onError?: (m: string) => void }} handlers
 */
export async function consumeAiChatStream(message, history = [], handlers = {}) {
  const { signal, onDelta, onMeta, onDone, onError } = handlers;
  const token = localStorage.getItem('token');

  const res = await fetch(`${API_BASE_URL}/ai/chat-stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, history }),
    signal,
  });

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    let errMsg = `Request failed (${res.status})`;
    try {
      const j = await res.json();
      if (j.error) errMsg = j.error;
    } catch {
      /* ignore */
    }
    throw new Error(errMsg);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() || '';

    for (const block of chunks) {
      const line = block.split('\n').find((l) => l.startsWith('data: '));
      if (!line) continue;
      let payload;
      try {
        payload = JSON.parse(line.slice(6));
      } catch {
        continue;
      }

      if (payload.type === 'delta' && typeof payload.text === 'string' && onDelta) {
        onDelta(payload.text);
      } else if (payload.type === 'meta' && onMeta) {
        onMeta(payload);
      } else if (payload.type === 'done') {
        onDone?.({
          response: typeof payload.response === 'string' ? payload.response : '',
          proposals: Array.isArray(payload.proposals) ? payload.proposals : [],
        });
        return;
      } else if (payload.type === 'error') {
        const m = typeof payload.message === 'string' ? payload.message : 'Stream error';
        onError?.(m);
        throw new Error(m);
      }
    }
  }

  throw new Error('Stream ended without completion');
}
