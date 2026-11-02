import {
  SFLAnalysis, SFLVector, AppraisalAnalysis, MultiagentEvent, DomainSchema, AnalysisMetadata,
} from '@/types/sfl';
import { getDomainSchema } from '@/lib/domainRegistry';
import { HFManifoldClient, createHFManifoldClient } from '@/lib/hfManifold';

const nullVector = (): SFLVector => ({
  ideational: null, field: null, interpersonal: null, tenor: null, textual: null, mode: null,
});

const nullAppraisal = (): AppraisalAnalysis => ({
  attitude: { affect: null, judgement: null, appreciation: null },
  engagement: { monogloss: null, heterogloss: null },
  graduation: { force: null, focus: null },
  raw_appraisal_tokens: [],
});

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function vectorFromLLM(v: any): SFLVector {
  return {
    ideational: num(v?.ideational), field: num(v?.field), interpersonal: num(v?.interpersonal),
    tenor: num(v?.tenor), textual: num(v?.textual), mode: num(v?.mode),
  };
}

export class SFLAnalysisService {
  private static openaiKey: string | null = null;
  private static backend: 'openai' | 'huggingface' = 'openai';
  private static hfClient: HFManifoldClient | null = null;

  static setApiKey(key: string) { this.openaiKey = key; }
  static setBackend(backend: 'openai' | 'huggingface') { this.backend = backend; }
  static setHfEndpoint(endpoint: string, hfToken: string | null = null) {
    this.hfClient = new HFManifoldClient(endpoint, hfToken);
  }
  static setHfSpace(spaceId: string, hfToken: string | null = null) {
    this.hfClient = createHFManifoldClient(spaceId, hfToken);
  }

  static async analyze(text: string, domain: string, metadata: Partial<AnalysisMetadata> = {}): Promise<SFLAnalysis> {
    const schema = getDomainSchema(domain);
    const timestamp = new Date().toISOString();
    const base: SFLAnalysis = {
      id: crypto.randomUUID(),
      timestamp,
      text,
      metadata: {
        source_type: metadata.source_type ?? 'unknown',
        source_id: metadata.source_id ?? '',
        domain,
        timestamp,
        text_length: text.length,
        language: metadata.language,
      },
      vector: nullVector(),
      appraisal: nullAppraisal(),
      transitivity: { processes: [], participants: [], circumstances: [] },
      meaning_map: {
        experiential: null, interpersonal: null, textual: null,
        semiotic_torque: null, dominant_concept: null, derived_meanings: [],
      },
      backend: 'pending',
    };

    if (this.backend === 'openai') {
      if (!this.openaiKey) throw new Error('OpenAI API key not set');
      return this.enrichWithOpenAI(base, schema);
    }
    if (!this.hfClient) throw new Error('Hugging Face manifold not configured: call setHfSpace or setHfEndpoint');
    return this.enrichWithHF(base);
  }

  private static async enrichWithOpenAI(a: SFLAnalysis, schema: DomainSchema): Promise<SFLAnalysis> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.openaiKey}` },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: this.buildSystemPrompt(schema) },
          { role: 'user', content: `Analyze this text:\n\n${a.text}` },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });
    if (!res.ok) throw new Error(`OpenAI error: ${res.status} ${res.statusText}`);
    const data = await res.json();
    const out = JSON.parse(data.choices[0].message.content);
    const mm = out.meaning_map ?? {};
    return {
      ...a,
      appraisal: out.appraisal ?? a.appraisal,
      transitivity: {
        processes: out.transitivity?.processes ?? [],
        participants: out.transitivity?.participants ?? [],
        circumstances: out.transitivity?.circumstances ?? [],
      },
      meaning_map: {
        experiential: num(mm.experiential), interpersonal: num(mm.interpersonal), textual: num(mm.textual),
        semiotic_torque: num(mm.semiotic_torque),
        dominant_concept: typeof mm.dominant_concept === 'string' ? mm.dominant_concept : null,
        derived_meanings: Array.isArray(mm.derived_meanings) ? mm.derived_meanings : [],
      },
      vector: vectorFromLLM(out.vector),
      backend: 'openai',
    };
  }

  private static async enrichWithHF(a: SFLAnalysis): Promise<SFLAnalysis> {
    const r = await this.hfClient!.analyze(a.text);
    return {
      ...a,
      vector: r.vector,
      meaning_map: { ...a.meaning_map, dominant_concept: r.dominant_dimension },
      backend: 'huggingface',
    };
  }

  private static buildSystemPrompt(schema: DomainSchema): string {
    const shape = {
      appraisal: {
        attitude: { affect: 0, judgement: 0, appreciation: 0 },
        engagement: { monogloss: 0, heterogloss: 0 },
        graduation: { force: 0, focus: 0 },
        raw_appraisal_tokens: [],
      },
      transitivity: {
        processes: [{ type: '', confidence: 0, trigger: '' }],
        participants: [{ role: '', entity: '', confidence: 0 }],
        circumstances: [{ type: '', expression: '' }],
      },
      meaning_map: { experiential: 0, interpersonal: 0, textual: 0, semiotic_torque: 0, dominant_concept: '', derived_meanings: [] },
      vector: { ideational: 0, field: 0, interpersonal: 0, tenor: 0, textual: 0, mode: 0 },
    };
    return [
      'You are an expert Systemic Functional Linguistics analyst applying Halliday Transitivity and Martin & White Appraisal to any text.',
      'Metafunctions (ideational, interpersonal, textual) and register variables (field, tenor, mode) are distinct strata. They resonate but are never identical or bound. Score all six independently as floats in [0,1], from evidence in the text:',
      '- ideational: lexicogrammatical representation of experience (Transitivity)',
      '- field: contextual domain / social activity',
      '- interpersonal: mood, modality and appraisal stance',
      '- tenor: institutional power, role distance, solidarity',
      '- textual: Theme-Rheme architecture, information flow',
      '- mode: medium, channel, rhetorical orientation',
      `Domain: ${schema.label}. Participant roles: ${schema.participantRoles.join(', ')}. Process types: ${schema.processTypes.join(', ')}. Circumstances: ${schema.circumstanceTypes.join(', ')}.`,
      'Do not assume a music or performance domain. Cite the actual words that trigger each process, participant and appraisal item. If a dimension cannot be judged from the text, return null for it.',
      `Return JSON only, in this shape: ${JSON.stringify(shape)}`,
    ].join('\n');
  }

  static createMultiagentEvent(analysis: SFLAnalysis): MultiagentEvent {
    return { type: 'SFL_ANALYSIS_COMPLETE', payload: analysis, timestamp: new Date().toISOString() };
  }
}
