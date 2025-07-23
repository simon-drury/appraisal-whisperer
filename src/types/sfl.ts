// SFL (Systemic Functional Linguistics) Type Definitions

export interface SFLAnalysis {
  id: string;
  timestamp: string;
  text: string;
  appraisal: AppraisalAnalysis;
  transitivity: TransitivityAnalysis;
  meaningMap: MeaningMap;
  metadata: AnalysisMetadata;
}

export interface AppraisalAnalysis {
  attitude: {
    affect: AttitudeScore;
    judgement: AttitudeScore;
    appreciation: AttitudeScore;
  };
  engagement: {
    monogloss: number;
    heterogloss: number;
  };
  graduation: {
    force: number;
    focus: number;
  };
  polarity: 'positive' | 'negative' | 'neutral';
  intensity: number;
}

export interface AttitudeScore {
  score: number;
  indicators: string[];
  strength: 'low' | 'medium' | 'high';
}

export interface TransitivityAnalysis {
  processes: Process[];
  participants: Participant[];
  circumstances: Circumstance[];
  clauseComplexity: number;
  dominantProcessType: ProcessType;
}

export interface Process {
  type: ProcessType;
  text: string;
  intensity: number;
  position: [number, number];
}

export interface Participant {
  role: ParticipantRole;
  text: string;
  agency: number;
  position: [number, number];
}

export interface Circumstance {
  type: CircumstanceType;
  text: string;
  relevance: number;
  position: [number, number];
}

export type ProcessType = 
  | 'material' 
  | 'mental' 
  | 'relational' 
  | 'behavioral' 
  | 'verbal' 
  | 'existential';

export type ParticipantRole =
  | 'actor'
  | 'goal'
  | 'senser'
  | 'phenomenon'
  | 'carrier'
  | 'attribute'
  | 'sayer'
  | 'receiver';

export type CircumstanceType =
  | 'extent'
  | 'location'
  | 'manner'
  | 'cause'
  | 'contingency'
  | 'accompaniment'
  | 'role'
  | 'matter'
  | 'angle';

export interface MeaningMap {
  experiential: ExperientialMeaning[];
  interpersonal: InterpersonalMeaning[];
  textual: TextualMeaning[];
  semioticTorque: SemioticTorque[];
}

export interface ExperientialMeaning {
  concept: string;
  strength: number;
  connections: string[];
  evidence: string[];
}

export interface InterpersonalMeaning {
  stance: string;
  modality: number;
  engagement: number;
  evidence: string[];
}

export interface TextualMeaning {
  theme: string;
  coherence: number;
  flow: string[];
}

export interface SemioticTorque {
  pivot: string;
  recursionDepth: number;
  pivotStrength: number;
  derivedMeanings: string[];
}

export interface AnalysisMetadata {
  source: string;
  artist: string;
  event: string;
  reviewLength: number;
  confidenceScore: number;
  processingTime: number;
}

export interface MultiagentEvent {
  eventType: 'SFL_ANALYSIS_COMPLETE' | 'MEANING_MAP_GENERATED' | 'ERROR';
  agentId: 'AppraisalMapperAgent';
  timestamp: string;
  data: SFLAnalysis | ErrorEvent;
  metadata: {
    conversationId: string;
    userId?: string;
    requestId: string;
  };
}

export interface ErrorEvent {
  error: string;
  code: string;
  details?: any;
}

export interface AgentRequest {
  requestId: string;
  type: 'ANALYZE_REVIEWS' | 'GENERATE_MEANING_MAP';
  data: {
    artist?: string;
    event?: string;
    reviews?: string[];
    options?: AnalysisOptions;
  };
}

export interface AnalysisOptions {
  deepAppraisal: boolean;
  generateMeaningMap: boolean;
  enableSemioticTorque: boolean;
  followUpFlow: boolean;
}