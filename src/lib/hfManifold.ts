// Hugging Face Manifold Client for primus-orbis-sfl-manifold-v001
// Wraps the Gradio /run/predict endpoint with the { data: [...] } payload structure.
// Missing dimensions resolve to null, never to a default value.

export interface HFManifoldVector {
  ideational: number | null;
  field: number | null;
  interpersonal: number | null;
  tenor: number | null;
  textual: number | null;
  mode: number | null;
}

interface GradioResponse {
  data: unknown[];
}

export interface HFManifoldPayload {
  vector?: Partial<HFManifoldVector>;
  dominant_dimension?: string;
  raw_matrix?: number[][];
  clusters?: unknown;
  text?: string;
  [key: string]: unknown;
}

export interface HFManifoldResponse {
  vector: HFManifoldVector;
  dominant_dimension?: string;
  raw_matrix?: number[][];
  clusters?: unknown;
  text?: string;
}

const num = (v: unknown): number | null => (typeof v === 'number' && isFinite(v) ? v : null);

export class HFManifoldClient {
  private endpoint: string;
  private apiKey: string | null;

  constructor(endpoint: string, apiKey?: string | null) {
    this.endpoint = endpoint;
    this.apiKey = apiKey ?? null;
  }

  async analyze(text: string): Promise<HFManifoldResponse> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify({ data: [text] }),
    });

    if (!response.ok) {
      throw new Error(`HF Manifold endpoint error: ${response.status} ${response.statusText}`);
    }

    const gradioResponse: GradioResponse = await response.json();
    const raw = gradioResponse.data?.[0];

    let payload: HFManifoldPayload;
    if (typeof raw === 'string') {
      try {
        payload = JSON.parse(raw);
      } catch {
        payload = { text: raw };
      }
    } else if (raw && typeof raw === 'object') {
      payload = raw as HFManifoldPayload;
    } else {
      payload = {};
    }

    const vector: HFManifoldVector = {
      ideational: num(payload.vector?.ideational ?? payload.ideational),
      field: num(payload.vector?.field ?? payload.field),
      interpersonal: num(payload.vector?.interpersonal ?? payload.interpersonal),
      tenor: num(payload.vector?.tenor ?? payload.tenor),
      textual: num(payload.vector?.textual ?? payload.textual),
      mode: num(payload.vector?.mode ?? payload.mode),
    };

    return {
      vector,
      dominant_dimension: payload.dominant_dimension,
      raw_matrix: payload.raw_matrix,
      clusters: payload.clusters,
      text: payload.text,
    };
  }

  toSFLVector(response: HFManifoldResponse): HFManifoldVector {
    return {
      ideational: response.vector.ideational,
      field: response.vector.field,
      interpersonal: response.vector.interpersonal,
      tenor: response.vector.tenor,
      textual: response.vector.textual,
      mode: response.vector.mode,
    };
  }
}

export function createHFManifoldClient(spaceId: string, hfToken?: string | null): HFManifoldClient {
  const sub = spaceId.toLowerCase().replace(/[/_]/g, '-');
  return new HFManifoldClient(`https://${sub}.hf.space/run/predict`, hfToken);
}