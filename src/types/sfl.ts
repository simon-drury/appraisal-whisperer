// SFL (Systemic Functional Linguistics) Type Definitions — 6-Element Test Model
// Metafunctions (Ideational, Interpersonal, Textual) and Register Variables
// (Field, Tenor, Mode) are DISTINCT strata. All six are independent.

export type Metafunction = 'ideational' | 'interpersonal' | 'textual';
export type RegisterVariable = 'field' | 'tenor' | 'mode';

export type SFLVector = {
  ideational: number | null;
  field: number | null;
  interpersonal: number | null;
  tenor: number | null;
  textual: number | null;
  mode: number | null;
};

export interface DomainSchema {
  id: string;
  label: string;
  participantRoles: string[];
  processTypes: string[];
  circumstanceTypes: string[];
  attitudeTypes: ('affect' | 'judgement' | 'appreciation')[];
  engagementTypes: ('monogloss' | 'heterogloss')[];
  graduationTypes: ('force' | 'focus')[];
  defaultConcept: string;
  processTriggerMap: Record<string, string[]>;
  participantTriggerMap: Record<string, string[]>;
}

export interface AnalysisMetadata {
  source_type: string;
  source_id: string;
  domain: string;
  timestamp: string;
  text_length: number;
  language?: string;
}

export interface AppraisalAnalysis {
  attitude: {
    affect: number | null;
    judgement: number | null;
    appreciation: number | null;
  };
  engagement: {
    monogloss: number | null;
    heterogloss: number | null;
  };
  graduation: {
    force: number | null;
    focus: number | null;
  };
  raw_appraisal_tokens: string[];
}

export interface TransitivityAnalysis {
  processes: Array<{
    type: string;
    confidence: number | null;
    trigger: string;
  }>;
  participants: Array<{
    role: string;
    entity: string;
    confidence: number | null;
  }>;
  circumstances: Array<{
    type: string;
    expression: string;
  }>;
}

export interface MeaningMap {
  experiential: number | null;
  interpersonal: number | null;
  textual: number | null;
  semiotic_torque: number | null;
  dominant_concept: string | null;
  derived_meanings: string[];
}

export interface SFLAnalysis {
  id: string;
  timestamp: string;
  text: string;
  metadata: AnalysisMetadata;
  vector: SFLVector;
  appraisal: AppraisalAnalysis;
  transitivity: TransitivityAnalysis;
  meaning_map: MeaningMap;
  backend: 'proxy' | 'huggingface' | 'pending';
}

export interface MultiagentEvent {
  type: 'SFL_ANALYSIS_COMPLETE';
  payload: SFLAnalysis;
  timestamp: string;
}