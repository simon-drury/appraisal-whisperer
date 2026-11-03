import { SFLAnalysis, SFLVector, AppraisalAnalysis, MultiagentEvent, AnalysisMetadata } from '@/types/sfl';
import { HFManifoldClient, HFManifoldVector } from '@/lib/hfManifold';

const NULL_VECTOR: SFLVector = {
  ideational: null,
  field: null,
  interpersonal: null,
  tenor: null,
  textual: null,
  mode: null,
};

const NULL_APPRAISAL: AppraisalAnalysis = {
  attitude: { affect: null, judgement: null, appreciation: null },
  engagement: { monogloss: null, heterogloss: null },
  graduation: { force: null, focus: null },
  raw_appraisal_tokens: [],
};

// Any value outside 0-1 (or non-numeric) becomes null, never a default.
const n01 = (v: unknown): number | null =>
  typeof v === 'number' && v >= 0 && v <= 1 ? v : null;

const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((t): t is string => typeof t === 'string') : [];

interface LLMOutput {
  appraisal?: {
    attitude?: Record<string, unknown>;
    engagement?: Record<string, unknown>;
    graduation?: Record<string, unknown>;
    raw_appraisal_tokens?: unknown;
  };
  transitivity?: {
    processes?: Array<{ type?: unknown; confidence?: unknown; trigger?: unknown }>;
    participants?: Array<{ role?: unknown; entity?: unknown; confidence?: unknown }>;
    circumstances?: Array<{ type?: unknown; expression?: unknown }>;
  };
  meaning_map?: Record<string, unknown>;
  vector?: Record<string, unknown>;
}

function buildVectorFromLLM(v: Record<string, unknown> | null | undefined): SFLVector {
  if (!v) return { ...NULL_VECTOR };
  return {
    ideational: n01(v.ideational),
    field: n01(v.field),
    interpersonal: n01(v.interpersonal),
    tenor: n01(v.tenor),
    textual: n01(v.textual),
    mode: n01(v.mode),
  };
}

function buildVectorFromHF(hfVector: HFManifoldVector | null): SFLVector {
  if (!hfVector) return { ...NULL_VECTOR };
  return {
    ideational: hfVector.ideational,
    field: hfVector.field,
    interpersonal: hfVector.interpersonal,
    tenor: hfVector.tenor,
    textual: hfVector.textual,
    mode: hfVector.mode,
  };
}

function applyLLM(analysis: SFLAnalysis, out: LLMOutput): SFLAnalysis {
  const at = out.appraisal?.attitude ?? {};
  const en = out.appraisal?.engagement ?? {};
  const gr = out.appraisal?.graduation ?? {};
  const mm = out.meaning_map ?? {};

  return {
    ...analysis,
    appraisal: {
      attitude: {
        affect: n01(at.affect),
        judgement: n01(at.judgement),
        appreciation: n01(at.appreciation),
      },
      engagement: { monogloss: n01(en.monogloss), heterogloss: n01(en.heterogloss) },
      graduation: { force: n01(gr.force), focus: n01(gr.focus) },
      raw_appraisal_tokens: strings(out.appraisal?.raw_appraisal_tokens),
    },
    transitivity: {
      processes: (out.transitivity?.processes ?? []).map((p) => ({
        type: String(p.type ?? ''),
        confidence: n01(p.confidence),
        trigger: String(p.trigger ?? ''),
      })),
      participants: (out.transitivity?.participants ?? []).map((p) => ({
        role: String(p.role ?? ''),
        entity: String(p.entity ?? ''),
        confidence: n01(p.confidence),
      })),
      circumstances: (out.transitivity?.circumstances ?? []).map((c) => ({
        type: String(c.type ?? ''),
        expression: String(c.expression ?? ''),
      })),
    },
    meaning_map: {
      experiential: n01(mm.experiential),
      interpersonal: n01(mm.interpersonal),
      textual: n01(mm.textual),
      semiotic_torque: n01(mm.semiotic_torque),
      dominant_concept: typeof mm.dominant_concept === 'string' ? mm.dominant_concept : null,
      derived_meanings: strings(mm.derived_meanings),
    },
    vector: buildVectorFromLLM(out.vector),
    backend: 'proxy',
  };
}

export class SFLAnalysisService {
  private static backend: 'proxy' | 'huggingface' = 'proxy';
  private static proxyUrl = '/api/analyze';
  private static demoToken: string | null = null;
  private static hfClient: HFManifoldClient | null = null;

  static setProxy(demoToken: string, url = '/api/analyze') {
    this.demoToken = demoToken;
    this.proxyUrl = url;
  }

  static setBackend(backend: 'proxy' | 'huggingface') {
    this.backend = backend;
  }

  static setHfEndpoint(endpoint: string, hfToken?: string | null) {
    this.hfClient = new HFManifoldClient(endpoint, hfToken ?? null);
  }

  static setHfSpace(spaceId: string, hfToken?: string | null) {
    const sub = spaceId.toLowerCase().replace(/[/_]/g, '-');
    this.setHfEndpoint(`https://${sub}.hf.space/run/predict`, hfToken);
  }

  static async analyze(
    text: string,
    domain: string,
    metadata: Partial<AnalysisMetadata>
  ): Promise<SFLAnalysis> {
    const timestamp = new Date().toISOString();

    const analysis: SFLAnalysis = {
      id: crypto.randomUUID(),
      timestamp,
      text,
      metadata: {
        source_type: metadata.source_type || 'unknown',
        source_id: metadata.source_id || '',
        domain,
        timestamp,
        text_length: text.length,
        language: metadata.language,
      },
      vector: { ...NULL_VECTOR },
      appraisal: NULL_APPRAISAL,
      transitivity: { processes: [], participants: [], circumstances: [] },
      meaning_map: {
        experiential: null,
        interpersonal: null,
        textual: null,
        semiotic_torque: null,
        dominant_concept: null,
        derived_meanings: [],
      },
      backend: 'pending',
    };

    if (this.backend === 'proxy') return this.enrichWithProxy(analysis);
    return this.enrichWithHF(analysis);
  }

  private static async enrichWithProxy(analysis: SFLAnalysis): Promise<SFLAnalysis> {
    if (!this.demoToken) throw new Error('Access code not set');

    const res = await fetch(this.proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-demo-token': this.demoToken },
      body: JSON.stringify({ text: analysis.text, domain: analysis.metadata.domain }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error ?? `Proxy error ${res.status}`);
    }

    const { llm } = (await res.json()) as { llm: LLMOutput };
    return applyLLM(analysis, llm ?? {});
  }

  private static async enrichWithHF(analysis: SFLAnalysis): Promise<SFLAnalysis> {
    if (!this.hfClient) {
      throw new Error('Hugging Face manifold client not configured. Call setHfEndpoint or setHfSpace first.');
    }

    const hfResponse = await this.hfClient.analyze(analysis.text);
    const hfVector = this.hfClient.toSFLVector(hfResponse);

    return {
      ...analysis,
      vector: buildVectorFromHF(hfVector),
      meaning_map: {
        experiential: hfVector.ideational,
        interpersonal: hfVector.interpersonal,
        textual: hfVector.textual,
        semiotic_torque: null,
        dominant_concept: hfResponse.dominant_dimension ?? null,
        derived_meanings: [],
      },
      backend: 'huggingface',
    };
  }

  static createMultiagentEvent(analysis: SFLAnalysis): MultiagentEvent {
    return {
      type: 'SFL_ANALYSIS_COMPLETE',
      payload: analysis,
      timestamp: new Date().toISOString(),
    };
  }
}
