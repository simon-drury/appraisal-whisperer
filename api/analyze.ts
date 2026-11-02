import { createHash } from 'node:crypto';
import { getDomainSchema } from '../src/lib/domainRegistry';
import { buildSystemPrompt } from '../src/lib/prompt';

// Server-side proxy: the OpenAI key never reaches the browser.
// Required env vars: OPENAI_API_KEY, DEMO_TOKEN. Optional: OPENAI_MODEL.
// The rate limit is per server instance and best-effort; the real protection
// is DEMO_TOKEN plus a spend cap set on the OpenAI key itself.

const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_HITS = 6;
const MAX_CHARS = 3000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const key = process.env.OPENAI_API_KEY;
  const token = process.env.DEMO_TOKEN;
  if (!key || !token) return res.status(500).json({ error: 'Server not configured' });
  if (req.headers['x-demo-token'] !== token) return res.status(401).json({ error: 'Invalid access code' });

  const ip = String(req.headers['x-forwarded-for'] ?? 'unknown').split(',')[0].trim();
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_HITS) return res.status(429).json({ error: 'Rate limit reached, try again shortly' });
  hits.set(ip, [...recent, now]);

  const { text, domain } = req.body ?? {};
  if (typeof text !== 'string' || !text.trim() || text.length > MAX_CHARS) {
    return res.status(400).json({ error: `text required, max ${MAX_CHARS} characters` });
  }

  const schema = getDomainSchema(typeof domain === 'string' ? domain : 'product_review');
  const system = buildSystemPrompt(schema);
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o';

  const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `Analyze this text:\n\n${text}` },
      ],
    }),
  });
  if (!upstream.ok) return res.status(502).json({ error: `Upstream error ${upstream.status}` });

  const data = await upstream.json();
  let llm;
  try {
    llm = JSON.parse(data.choices[0].message.content);
  } catch {
    return res.status(502).json({ error: 'Model returned invalid JSON' });
  }

  return res.status(200).json({
    llm,
    model,
    promptSha: createHash('sha256').update(system).digest('hex').slice(0, 12),
  });
}
