// Usage:
//   Proxy mode:  DEMO_TOKEN=... node scripts/generate-cache.mjs <base-url> [runs]
//   Direct mode: LLM_API_KEY=... [LLM_BASE_URL=...] [OPENAI_MODEL=...] [JSON_MODE=off] \
//                npx tsx scripts/generate-cache.mjs direct [runs]
// Direct mode calls the LLM provider from this machine using the same prompt as the proxy,
// so nothing needs to be deployed. It needs tsx because it imports the TypeScript prompt.
// Optional: PAUSE_MS (default 11000) sets the pause between calls.
// Runs each review several times and writes the real outputs, with provenance,
// to src/data/cachedReviews.ts, including per-cell statistics for the 3x3 matrix
// (rows ideational, interpersonal, textual; columns field, tenor, mode) and its row/column means.
//
// Rate-limit arithmetic (proxy mode): the proxy allows RATE_LIMIT_PER_MIN (default 6) calls
// in any sliding 60 s window. A pause of 11 s keeps at most 5 retained hits at the moment of a new call.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

const [base, runsArg] = process.argv.slice(2);
const direct = base === 'direct';
const token = process.env.DEMO_TOKEN;
if (!base || (!direct && !token)) {
  console.error('Usage: DEMO_TOKEN=... node scripts/generate-cache.mjs <base-url> [runs]');
  console.error('   or: LLM_API_KEY=... npx tsx scripts/generate-cache.mjs direct [runs]');
  process.exit(1);
}

const runs = Number(runsArg ?? 3);
const pauseMs = Number(process.env.PAUSE_MS ?? 11000);
const reviews = JSON.parse(readFileSync('scripts/reviews.input.json', 'utf8'));
const DIMS = ['ideational', 'field', 'interpersonal', 'tenor', 'textual', 'mode'];
const MROWS = ['ideational', 'interpersonal', 'textual'];
const MCOLS = ['field', 'tenor', 'mode'];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const inRange = (x) => typeof x === 'number' && x >= 0 && x <= 1;
const stripFence = (s) => s.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

let lib;
async function loadLib() {
  if (!lib) {
    const prompt = await import('../src/lib/prompt.ts');
    const domains = await import('../src/lib/domainRegistry.ts');
    lib = { build: prompt.buildSystemPrompt, schema: domains.getDomainSchema };
  }
  return lib;
}

async function callDirect(review) {
  const key = process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!key) throw new Error('Set LLM_API_KEY');
  const { build, schema } = await loadLib();
  const system = build(schema('product_review'));
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o';
  const baseUrl = (process.env.LLM_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/+$/, '');
  const body = {
    model,
    temperature: 0,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: `Analyze this text:\n\n${review.text}` },
    ],
  };
  if (process.env.JSON_MODE !== 'off') body.response_format = { type: 'json_object' };
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) return { status: res.status, detail: (await res.text()).slice(0, 300) };
  const data = await res.json();
  let llm;
  try {
    llm = JSON.parse(stripFence(data.choices[0].message.content));
  } catch {
    return { status: 502, detail: 'model returned invalid JSON' };
  }
  const promptSha = createHash('sha256').update(system).digest('hex').slice(0, 12);
  return { status: 200, body: { llm, model, promptSha } };
}

async function callProxy(review) {
  const res = await fetch(`${base}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-demo-token': token },
    body: JSON.stringify({ text: review.text, domain: 'product_review' }),
  });
  if (!res.ok) return { status: res.status, detail: (await res.text()).slice(0, 300) };
  return { status: 200, body: await res.json() };
}

async function call(review, label) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const r = await (direct ? callDirect(review) : callProxy(review));
    if (r.status === 429) {
      console.warn(`${label}: HTTP 429, waiting 20 s (attempt ${attempt}/3)`);
      await sleep(20000);
      continue;
    }
    if (r.status !== 200) throw new Error(`${label}: HTTP ${r.status} ${r.detail ?? ''}`);
    return r.body;
  }
  throw new Error(`${label}: still rate limited after 3 attempts`);
}

const total = reviews.length * runs;
let done = 0;
const out = [];

for (const r of reviews) {
  const results = [];
  for (let i = 0; i < runs; i++) {
    results.push(await call(r, `${r.id} run ${i + 1}`));
    done++;
    console.log(`${done}/${total} done`);
    if (done < total) await sleep(pauseMs);
  }

  const stat = (get) => {
    const v = results.map(get).filter(inRange);
    return v.length
      ? { mean: v.reduce((a, b) => a + b, 0) / v.length, min: Math.min(...v), max: Math.max(...v), n: v.length }
      : null;
  };
  const cells = (x, keys, pick) => {
    const c = keys.map(pick(x));
    return c.every(inRange) ? c.reduce((a, b) => a + b, 0) / c.length : undefined;
  };

  const entry = {
    ...r,
    model: results[0].model,
    promptSha: results[0].promptSha,
    generatedAt: new Date().toISOString(),
    runs: results.map((x) => x.llm),
    vector: Object.fromEntries(DIMS.map((d) => [d, stat((x) => x.llm?.vector?.[d])])),
    judgement: stat((x) => x.llm?.appraisal?.attitude?.judgement),
    force: stat((x) => x.llm?.appraisal?.graduation?.force),
    matrix: Object.fromEntries(
      MROWS.map((i) => [i, Object.fromEntries(MCOLS.map((j) => [j, stat((x) => x.llm?.matrix?.[i]?.[j])]))])
    ),
    marginals: {
      rows: Object.fromEntries(
        MROWS.map((i) => [i, stat((x) => cells(x, MCOLS, (y) => (j) => y.llm?.matrix?.[i]?.[j]))])
      ),
      cols: Object.fromEntries(
        MCOLS.map((j) => [j, stat((x) => cells(x, MROWS, (y) => (i) => y.llm?.matrix?.[i]?.[j]))])
      ),
    },
  };
  out.push(entry);

  const f = (s) => (s ? s.mean.toFixed(2) : ' -- ');
  console.log(`\nReview ${r.id} (${r.stars} stars): judgement ${f(entry.judgement)}, force ${f(entry.force)}`);
  console.table(
    Object.fromEntries(MROWS.map((i) => [i, Object.fromEntries(MCOLS.map((j) => [j, f(entry.matrix[i][j])]))]))
  );
  console.log(
    'vector     :', DIMS.map((d) => `${d} ${f(entry.vector[d])}`).join(' | '),
    '\nrow means  :', MROWS.map((i) => `${i} ${f(entry.marginals.rows[i])}`).join(' | '),
    '\ncol means  :', MCOLS.map((j) => `${j} ${f(entry.marginals.cols[j])}`).join(' | ')
  );
}

mkdirSync('src/data', { recursive: true });
writeFileSync(
  'src/data/cachedReviews.ts',
  `// GENERATED by scripts/generate-cache.mjs. Do not edit by hand.\nexport const CACHED_REVIEWS = ${JSON.stringify(out, null, 2)} as const;\n`
);
console.log(`Wrote ${out.length} reviews x ${runs} runs`);
