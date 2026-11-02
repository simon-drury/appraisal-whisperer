import { SFLVector } from '@/types/sfl';

const DIMS = ['ideational', 'field', 'interpersonal', 'tenor', 'textual', 'mode'] as const;

export interface HFManifoldResult {
  vector: SFLVector;
  dominant_dimension: string | null;
}

function extractVector(src: any): SFLVector | null {
  if (!src || typeof src !== 'object') return null;
  const out: any = {};
  for (const d of DIMS) {
    const v = src[d];
    if (typeof v !== 'number' || !Number.isFinite(v)) return null;
    out[d] = v;
  }
  return out as SFLVector;
}

// Gradio contract: request { data: [text] }, response { data: [output, ...] }.
// The Space must return a JSON object (or JSON string) with the six dimension keys,
// either at top level or under `vector`. Anything else throws; no values are invented.
export class HFManifoldClient {
  constructor(private endpoint: string, private token: string | null = null) {}

  async analyze(text: string): Promise<HFManifoldResult> {
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
      body: JSON.stringify({ data: [text] }),
    });
    if (!res.ok) throw new Error(`HF manifold error: ${res.status} ${res.statusText}`);

    const body = await res.json();
    let raw = body?.data?.[0];
    if (typeof raw === 'string') {
      try { raw = JSON.parse(raw); } catch { throw new Error('HF manifold returned non-JSON text; the Space must return the six-dimension vector as JSON'); }
    }
    const vector = extractVector(raw?.vector) ?? extractVector(raw);
    if (!vector) throw new Error('HF manifold response is missing one or more of the six dimensions');
    return { vector, dominant_dimension: typeof raw?.dominant_dimension === 'string' ? raw.dominant_dimension : null };
  }
}

// 'simondrury/sfl-manifold-demo' -> https://simondrury-sfl-manifold-demo.hf.space/run/predict
export function createHFManifoldClient(spaceId: string, token: string | null = null): HFManifoldClient {
  const sub = spaceId.replace('/', '-').replace(/_/g, '-').toLowerCase();
  return new HFManifoldClient(`https://${sub}.hf.space/run/predict`, token);
}
