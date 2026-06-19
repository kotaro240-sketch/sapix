const MODEL = 'claude-sonnet-4-20250514';

// Vercel serverless function を経由してClaude APIを呼ぶ
// APIキーはサーバー側（Vercel環境変数）に安全に保管されるため、
// ブラウザ（iPad）側にはAPIキーが露出しない
export async function callClaude(messages, maxTokens = 1800) {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API error: ${res.status}`);
  }

  const data = await res.json();
  return (data.content || []).map(b => b.text || '').join('');
}

export async function callWithImage(base64, mimeType, prompt, maxTokens = 2500) {
  return callClaude([{
    role: 'user',
    content: [
      { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
      { type: 'text', text: prompt },
    ],
  }], maxTokens);
}
