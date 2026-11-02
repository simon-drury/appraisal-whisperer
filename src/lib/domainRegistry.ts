import { DomainSchema } from '@/types/sfl';

// Vocabulary presets only. No scores, weights or keyword triggers.
export const DOMAIN_SCHEMAS: Record<string, DomainSchema> = {
  product_review: {
    id: 'product_review',
    label: 'Product Review',
    participantRoles: ['Buyer', 'Product', 'Feature', 'Seller'],
    processTypes: ['material', 'mental', 'relational', 'verbal', 'behavioural', 'existential'],
    circumstanceTypes: ['extent', 'location', 'manner', 'cause'],
    defaultConcept: 'product_experience',
  },
  institutional_corporate: {
    id: 'institutional_corporate',
    label: 'Institutional / Corporate Communication',
    participantRoles: ['Gatekeeper', 'Candidate', 'Institution', 'Authority'],
    processTypes: ['material', 'mental', 'relational', 'verbal', 'behavioural', 'existential'],
    circumstanceTypes: ['manner', 'cause', 'role', 'extent'],
    defaultConcept: 'institutional_interaction',
  },
  academic_text: {
    id: 'academic_text',
    label: 'Academic Text',
    participantRoles: ['Researcher', 'Subject', 'Theory', 'Method', 'Finding'],
    processTypes: ['material', 'mental', 'relational', 'verbal', 'behavioural', 'existential'],
    circumstanceTypes: ['manner', 'cause', 'extent', 'location'],
    defaultConcept: 'scholarly_argument',
  },
  music_review: {
    id: 'music_review',
    label: 'Music / Performance Review (legacy)',
    participantRoles: ['Performer', 'Audience', 'Venue', 'Critic'],
    processTypes: ['material', 'mental', 'relational', 'verbal', 'behavioural', 'existential'],
    circumstanceTypes: ['location', 'manner', 'extent'],
    defaultConcept: 'musical_performance',
  },
};

export function getDomainSchema(domain: string): DomainSchema {
  const schema = DOMAIN_SCHEMAS[domain];
  if (!schema) throw new Error(`Unknown domain: ${domain}`);
  return schema;
}

export function listDomains(): Array<{ id: string; label: string }> {
  return Object.values(DOMAIN_SCHEMAS).map(s => ({ id: s.id, label: s.label }));
}
