/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  SFLAnalysis,
  SFLVector,
  AppraisalAnalysis,
  TransitivityAnalysis,
  MeaningMap,
  MultiagentEvent,
  AnalysisMetadata,
} from '@/types/sfl';
import { getDomainSchema } from '@/lib/domainRegistry';
import { HFManifoldClient, type HFManifoldVector } from '@/lib/hfManifold';

// A value is accepted only if it is a number between 0 and 1; anything else becomes null.
const n01 = (v: unknown): number | null => (typeof v === 'number' && v >= 0 && v <= 1 ? v : null);
const str = (v: unknown): string => (typeof v === 'string' ? v : '');

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

const NULL_MEANING: MeaningMap = {
  experiential: null,
  interpersonal: null,
  textual: null,
  semiotic_torque: null,
  dominant_concept: null,
  derived_meanings: [],
};

function buildVectorFromLLM(v: any): SFLVector {
  if (!v || typeof v !== 'object') return NULL_VECTOR;
  return {
    ideational: n01(v.ideational),
    field: n01(v.field),
    interpersonal: n01(v.interpersonal),
    tenor: n01(v.tenor),
    textual: n01(v.textual),
    mode: n01(v.mode),
  };
}

function buildVectorFromHF(hf: HFManifoldVector): SFLVector {
  return {
    ideational: n01(hf.ideational),
    field: n01(hf.field),
    interpersonal: n01(hf.interpersonal),
    tenor: n01(hf.tenor),
    textual: n01(hf.textual),
    mode: n01(hf.mode),
  };
}

function sanitizeAppraisal(a: any): AppraisalAnalysis {
  if (!a || typeof a !== 'object') return NULL_APPRAISAL;
  return {
    attitude: {
      affect: n01(a.attitude?.affect),
      judgement: n01(a.attitude?.judgement),
      appreciation: n01(a.attitude?.appreciation),
    },
    engagement: {
      monogloss: n01(a.engagement?.monogloss),
      heterogloss: n01(a.engagement?.heterogloss),
    },
    graduation: {
      force: n01(a.graduation?.force),
      focus: n01(a.graduation?.focus),
    },
    raw_appraisal_tokens: Array.isArray(a.raw_appraisal_tokens)
      ? a.raw_appraisal_tokens.filter((t: unknown) => typeof t === 'string')
      : [],
  };
}

function sanitizeTransitivity(t: any): TransitivityAnalysis {
  const list = (x: unknown): any[] => (Array.isArray(x) ? x : []);
  return {
    processes: list(t?.processes).map((p) => ({
      type: str(p?.type),
      confidence: n01(p?.confidence),
      trigger: str(p?.trigger),
    })),
    participants: list(t?.participants).map((p) => ({
      role: str(p?.role),
      entity: str(p?.entity),
      confidence: n01(p?.confidence),
    })),
    circumstances: list(t?.circumstances).map((c) => ({
      type: str(c?.type),
      expression: str(c?.expression),
    })),
  };
}

function sanitizeMeaning(m: any): MeaningMap {
  if (!m || typeof m !== 'object') return NULL_MEANING;
  return {
    experiential: n01(m.experiential),
    interpersonal: n01(m.interpersonal),
    textual: n01(m.textual),
    semiotic_torque: n01(m.semiotic_torque),
    dominant_concept: typeof m.dominant_concept === 'string' ? m.dominant_concept : null,
    derived_meanings: Array.isArray(m.derived_meanings)
      ? m.derived_meanings.filter((d: unknown) => typeof d === 'string')
      : [],
  };
}

export class SFLAnalysisService {
  private static backend: 'proxy' | 'huggingface' = 'proxy';
  private static proxyUrl = '/api/analyze';
  private static demoToken: string | null = null;
  private static hfClient: HFManifoldClient | null = null;

  static setBackend(backend: 'proxy' | 'huggingface') {
    this.backend = backend;
  }

  static setProxy(demoToken: string, url = '/api/analyze') {
    this.demoToken = demoToken;
    this.proxyUrl = url;
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
    const schema = getDomainSchema(domain);
    const timestamp = new Date().toISOString();

    const analysis: SFLAnalysis = {
      id: crypto.randomUUID(),
      timestamp,
      text,
      metadata: {
        source_type: metadata.source_type || 'unknown',
        source_id: metadata.source_id || '',
        domain: schema.id,
        timestamp,
        text_length: text.length,
        language: metadata.language,
      },
      vector: NULL_VECTOR,
      appraisal: NULL_APPRAISAL,
      transitivity: { processes: [], participants: [], circumstances: [] },
      meaning_map: NULL_MEANING,
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
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error ?? `Proxy error ${res.status}`);
    }

    const { llm } = await res.json();
    return {
      ...analysis,
      appraisal: sanitizeAppraisal(llm?.appraisal),
      transitivity: sanitizeTransitivity(llm?.transitivity),
      meaning_map: sanitizeMeaning(llm?.meaning_map),
      vector: buildVectorFromLLM(llm?.vector),
      backend: 'proxy',
    };
  }

  private static async enrichWithHF(analysis: SFLAnalysis): Promise<SFLAnalysis> {
    if (!this.hfClient) {
      throw new Error('Hugging Face manifold client not configured. Call setHfSpace or setHfEndpoint first.');
    }

    const hfResponse = await this.hfClient.analyze(analysis.text);
    const hfVector = this.hfClient.toSFLVector(hfResponse);

    return {
      ...analysis,
      vector: buildVectorFromHF(hfVector),
      meaning_map: {
        ...NULL_MEANING,
        experiential: n01(hfVector.ideational),
        interpersonal: n01(hfVector.interpersonal),
        textual: n01(hfVector.textual),
        dominant_concept: hfResponse.dominant_dimension ?? null,
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
