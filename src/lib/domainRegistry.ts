import type { DomainSchema } from '../types/sfl';

export const DOMAIN_SCHEMAS: Record<string, DomainSchema> = {
  product_review: {
    id: 'product_review',
    label: 'Product Review',
    participantRoles: ['Buyer', 'Product', 'Feature', 'Seller', 'Reviewer'],
    processTypes: ['material', 'mental', 'relational', 'verbal', 'existential'],
    circumstanceTypes: ['extent', 'location', 'manner', 'cause'],
    attitudeTypes: ['affect', 'judgement', 'appreciation'],
    engagementTypes: ['monogloss', 'heterogloss'],
    graduationTypes: ['force', 'focus'],
    defaultConcept: 'product_experience',
    processTriggerMap: {
      material: ['break', 'work', 'last', 'fit', 'charge', 'connect', 'fail', 'arrive'],
      mental: ['like', 'love', 'hate', 'think', 'feel', 'recommend', 'regret'],
      relational: ['is', 'are', 'seem', 'become', 'cost', 'weigh', 'measure'],
      verbal: ['say', 'tell', 'claim', 'state', 'warn', 'promise'],
      existential: ['there is', 'there are', 'exists', 'includes'],
    },
    participantTriggerMap: {
      Buyer: ['I', 'we', 'customer', 'user', 'buyer'],
      Product: ['it', 'this', 'that', 'the product', 'the item'],
      Feature: ['battery', 'screen', 'camera', 'size', 'color', 'weight'],
      Seller: ['they', 'the company', 'support', 'service'],
      Reviewer: ['I', 'me', 'my', 'mine'],
    },
  },
  institutional_corporate: {
    id: 'institutional_corporate',
    label: 'Institutional / Corporate Communication',
    participantRoles: ['Gatekeeper', 'Candidate', 'Institution', 'Department', 'Authority'],
    processTypes: ['material', 'mental', 'relational', 'verbal', 'behavioural'],
    circumstanceTypes: ['manner', 'cause', 'role', 'extent'],
    attitudeTypes: ['affect', 'judgement', 'appreciation'],
    engagementTypes: ['monogloss', 'heterogloss'],
    graduationTypes: ['force', 'focus'],
    defaultConcept: 'institutional_interaction',
    processTriggerMap: {
      material: ['process', 'handle', 'review', 'approve', 'reject', 'schedule'],
      mental: ['consider', 'believe', 'assume', 'expect', 'prefer'],
      relational: ['is', 'are', 'represents', 'constitutes', 'defines'],
      verbal: ['state', 'inform', 'notify', 'advise', 'require'],
      behavioural: ['respond', 'act', 'behave', 'perform'],
    },
    participantTriggerMap: {
      Gatekeeper: ['manager', 'director', 'HR', 'recruiter', 'committee'],
      Candidate: ['I', 'applicant', 'candidate', 'we'],
      Institution: ['the company', 'the university', 'the department', 'the organization'],
      Authority: ['policy', 'regulation', 'requirement', 'standard'],
    },
  },
  academic_text: {
    id: 'academic_text',
    label: 'Academic Text',
    participantRoles: ['Researcher', 'Subject', 'Theory', 'Method', 'Finding'],
    processTypes: ['material', 'mental', 'relational', 'verbal', 'existential'],
    circumstanceTypes: ['manner', 'cause', 'extent', 'location'],
    attitudeTypes: ['affect', 'judgement', 'appreciation'],
    engagementTypes: ['monogloss', 'heterogloss'],
    graduationTypes: ['force', 'focus'],
    defaultConcept: 'scholarly_argument',
    processTriggerMap: {
      material: ['demonstrate', 'show', 'reveal', 'indicate', 'suggest'],
      mental: ['argue', 'claim', 'propose', 'hypothesize', 'conclude'],
      relational: ['is', 'are', 'defines', 'constitutes', 'represents'],
      verbal: ['state', 'assert', 'maintain', 'contend'],
      existential: ['there is', 'there are', 'exists'],
    },
    participantTriggerMap: {
      Researcher: ['we', 'I', 'the author', 'this study'],
      Subject: ['it', 'this phenomenon', 'the data', 'the sample'],
      Theory: ['theory', 'framework', 'model', 'paradigm'],
      Method: ['method', 'approach', 'procedure', 'technique'],
      Finding: ['finding', 'result', 'conclusion', 'evidence'],
    },
  },
  music_review: {
    id: 'music_review',
    label: 'Music / Performance Review (Legacy)',
    participantRoles: ['Performer', 'Audience', 'Venue', 'Artist', 'Critic'],
    processTypes: ['material', 'mental', 'relational', 'verbal', 'behavioural'],
    circumstanceTypes: ['location', 'manner', 'extent'],
    attitudeTypes: ['affect', 'judgement', 'appreciation'],
    engagementTypes: ['monogloss', 'heterogloss'],
    graduationTypes: ['force', 'focus'],
    defaultConcept: 'musical_performance',
    processTriggerMap: {
      material: ['play', 'perform', 'sing', 'conduct', 'lead'],
      mental: ['hear', 'feel', 'enjoy', 'dislike', 'impress'],
      relational: ['is', 'are', 'sounds', 'seems'],
      verbal: ['say', 'state', 'remark'],
      behavioural: ['dance', 'applaud', 'react'],
    },
    participantTriggerMap: {
      Performer: ['artist', 'band', 'singer', 'musician', 'conductor'],
      Audience: ['crowd', 'audience', 'fans', 'listeners'],
      Venue: ['hall', 'stage', 'theatre', 'arena'],
    },
  },
};

export function getDomainSchema(domain: string): DomainSchema {
  return DOMAIN_SCHEMAS[domain] || DOMAIN_SCHEMAS.product_review;
}

export function listDomains(): Array<{ id: string; label: string }> {
  return Object.values(DOMAIN_SCHEMAS).map(s => ({ id: s.id, label: s.label }));
}
