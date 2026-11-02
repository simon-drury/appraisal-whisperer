import { SFLAnalysis, SFLVector, AppraisalAnalysis, MultiagentEvent, DomainSchema, AnalysisMetadata } from '@/types/sfl';
import { getDomainSchema } from '@/lib/domainRegistry';
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

function buildVectorFromLLM(llmVector: Record<string, number | null> | null): SFLVector {
  if (!llmVector) return NULL_VECTOR;
  return {
    ideational: llmVector.ideational ?? null,
    field: llmVector.field ?? null,
    interpersonal: llmVector.interpersonal ?? null,
    tenor: llmVector.tenor ?? null,
    textual: llmVector.textual ?? null,
    mode: llmVector.mode ?? null,
  };
}

function buildVectorFromHF(hfVector: HFManifoldVector | null): SFLVector {
  if (!hfVector) return NULL_VECTOR;
  return {
    ideational: hfVector.ideational,
    field: hfVector.field,
    interpersonal: hfVector.interpersonal,
    tenor: hfVector.tenor,
    textual: hfVector.textual,
    mode: hfVector.mode,
  };
}

export class SFLAnalysisService {
  private static apiKey: string | null = null;
  private static backend: 'openai' | 'huggingface' | 'hybrid' = 'openai';
  private static hfEndpoint: string | null = null;
  private static hfClient: HFManifoldClient | null = null;

  static setApiKey(key: string) { this.apiKey = key; }
  static setBackend(backend: 'openai' | 'huggingface' | 'hybrid') { this.backend = backend; }

  static setHfEndpoint(endpoint: string, hfToken?: string | null) {
    this.hfEndpoint = endpoint;
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
        domain,
        timestamp,
        text_length: text.length,
        language: metadata.language,
      } as AnalysisMetadata,
      vector: NULL_VECTOR,
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

    if (this.backend === 'openai' || this.backend === 'hybrid') {
      if (!this.apiKey) {
        throw new Error('OpenAI API key not set');
      }
      return this.enrichWithOpenAI(analysis, schema);
    }

    if (this.backend === 'huggingface') {
      if (!this.hfClient) {
        throw new Error('Hugging Face manifold client not configured. Call setHfEndpoint or setHfSpace first.');
      }
      return this.enrichWithHF(analysis);
    }

    return analysis;
  }

  private static async enrichWithOpenAI(analysis: SFLAnalysis, schema: DomainSchema): Promise<SFLAnalysis> {
    const systemPrompt = this.buildSystemPrompt(schema);
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this text:\n\n${analysis.text}` },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json();
    const llmOutput = JSON.parse(data.choices[0].message.content);

    return {
      ...analysis,
      appraisal: llmOutput.appraisal || NULL_APPRAISAL,
      transitivity: {
        processes: llmOutput.transitivity?.processes || [],
        participants: llmOutput.transitivity?.participants || [],
        circumstances: llmOutput.transitivity?.circumstances || [],
      },
      meaning_map: llmOutput.meaning_map || {
        experiential: null,
        interpersonal: null,
        textual: null,
        semiotic_torque: null,
        dominant_concept: schema.defaultConcept,
        derived_meanings: [],
      },
      vector: buildVectorFromLLM(llmOutput.vector),
      backend: 'openai',
    };
  }

  private static async enrichWithHF(analysis: SFLAnalysis): Promise<SFLAnalysis> {
    if (!this.hfClient) {
      throw new Error('Hugging Face manifold client not configured');
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

  private static buildSystemPrompt(schema: DomainSchema): string {
    return `You are an expert Systemic Functional Linguistics (SFL) analyst applying Halliday's Transitivity and Martin & White's Appraisal Framework to any domain of text.

CRITICAL THEORETICAL DISTINCTION:
  Metafunctions (Ideational, Interpersonal, Textual) and Register Variables (Field, Tenor, Mode)
  are DISTINCT strata. They resonate but are NEVER identical or bound to each other.
  You must evaluate ALL SIX dimensions as INDEPENDENT float values between 0 and 1.

THE SIX DIMENSIONS:
  1. Ideational    — Lexicogrammatical representation of experience (Transitivity)
  2. Field         — Contextual domain / social activity score
  3. Interpersonal — Mood, Modality, and Appraisal stance
  4. Tenor         — Institutional power, role distance, and solidarity score
  5. Textual       — Theme-Rheme architecture, information flow
  6. Mode          — Medium, channel, and rhetorical orientation

APPRAISAL (Martin & White):
  Attitude: Affect (emotion), Judgement (social evaluation of people), Appreciation (evaluation of things)
  Engagement: Monogloss (single voice) vs Heterogloss (multiple voices, attribution, contraction/expansion)
  Graduation: Force (intensity) vs Focus (boundary sharpening/softening)

TRANSITIVITY (Halliday):
  Process types: material, mental, relational, verbal, behavioural, existential
  Participant roles: ${schema.participantRoles.join(', ')}
  Circumstances: extent, location, manner, cause, accompaniment, matter, role

DOMAIN SCHEMA: ${schema.label} (${schema.id})
  Default concept: ${schema.defaultConcept}
  Participant roles: ${schema.participantRoles.join(', ')}
  Process types: ${schema.processTypes.join(', ')}

Do NOT assume a music or performance domain. Do NOT couple ideational=field, interpersonal=tenor, or textual=mode.
Each dimension receives its own independent score based on the text evidence.

Output JSON with this exact structure:
{
  "appraisal": {
    "attitude": {"affect": 0-1, "judgement": 0-1, "appreciation": 0-1},
    "engagement": {"monogloss": 0-1, "heterogloss": 0-1},
    "graduation": {"force": 0-1, "focus": 0-1},
    "raw_appraisal_tokens": ["token1", "token2"]
  },
  "transitivity": {
    "processes": [{"type": "...", "confidence": 0-1, "trigger": "..."}],
    "participants": [{"role": "...", "entity": "...", "confidence": 0-1}],
    "circumstances": [{"type": "...", "expression": "..."}]
  },
  "meaning_map": {
    "experiential": 0-1,
    "interpersonal": 0-1,
    "textual": 0-1,
    "semiotic_torque": 0-1,
    "dominant_concept": "...",
    "derived_meanings": ["..."]
  },
  "vector": {
    "ideational": 0-1,
    "field": 0-1,
    "interpersonal": 0-1,
    "tenor": 0-1,
    "textual": 0-1,
    "mode": 0-1
  }
}

All values are floats between 0 and 1. Be precise, domain-agnostic, and grounded in the actual text.`;
  }

  static createMultiagentEvent(analysis: SFLAnalysis): MultiagentEvent {
    return {
      type: 'SFL_ANALYSIS_COMPLETE',
      payload: analysis,
      timestamp: new Date().toISOString(),
    };
  }
}