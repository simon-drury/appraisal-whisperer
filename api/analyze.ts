import { createHash } from 'node:crypto';
import { getDomainSchema } from '../src/lib/domainRegistry.js';
import { buildSystemPrompt } from '../src/lib/prompt.js';

const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_HITS = Number(process.env.RATE_LIMIT_PER_MIN) || 6;
const MAX_CHARS = 3000;

type ApiRequest = {
  method: string;
  headers: Record<string, unknown>;
  body?: Record<string, unknown> | null;
};

type ApiResponse = {
  status(code: number): ApiResponse;
  json(body: unknown): ApiResponse;
};

// Model output may arrive wrapped in a Markdown code fence; strip it before parsing.
const stripFence = (s: string) =>
  s.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

// Server-side proxy: the LLM key never reaches the browser.
// Provider is configurable. Defaults to OpenAI. For Gemini set:
//   LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
//   LLM_API_KEY=<Gemini key>   OPENAI_MODEL=<Gemini model name>
// Rate limiting here is per server instance and best-effort; the real
// protections are DEMO_TOKEN and a spend cap on the key.
// Relative imports carry explicit .js extensions: package.json sets
// "type": "module", so Node ESM cannot resolve extensionless specifiers.
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const key = process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY;
  const token = process.env.DEMO_TOKEN;
  if (!key || !token) return res.status(500).json({ error: 'Server not configured' });
  if (req.headers['x-demo-token'] !== token) return res.status(401).json({ error: 'Invalid access code' });

  const ip = String(req.headers['x-forwarded-for'] ?? 'unknown').split(',')[0].trim();
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_HITS) return res.status(429).json({ error: 'Rate limit' });
  hits.set(ip, [...recent, now]);

  const { text, domain } = req.body ?? {};
  if (typeof text !== 'string' || !text.trim() || text.length > MAX_CHARS) {
    return res.status(400).json({ error: `text required, max ${MAX_CHARS} chars` });
  }

  const schema = getDomainSchema(typeof domain === 'string' ? domain : 'product_review');
  const system = buildSystemPrompt(schema);
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o';
  const baseUrl = (process.env.LLM_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/+$/, '');

  const r = await fetch(`${baseUrl}/chat/completions`, {
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
  if (!r.ok) return res.status(502).json({ error: `Upstream ${r.status}` });

  const data = await r.json();
  let llm;
  try {
    llm = JSON.parse(stripFence(data.choices[0].message.content));
  } catch {
    return res.status(502).json({ error: 'Model returned invalid JSON' });
  }

  return res.status(200).json({
    llm,
    model,
    promptSha: createHash('sha256').update(system).digest('hex').slice(0, 12),
  });
}
