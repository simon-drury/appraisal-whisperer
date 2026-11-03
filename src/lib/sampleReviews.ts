// Illustrative, synthetic sample reviews for demonstration. These are not real Amazon reviews.
export interface SampleReview { id: string; stars: number; label: string; text: string; }

export const SAMPLE_REVIEWS: SampleReview[] = [
  { id: 'A', stars: 5, label: 'Generic 5-star',
    text: 'Great product, five stars. Works well and arrived fast. Would buy again.' },
  { id: 'B', stars: 3, label: '3-star, high-force judgement',
    text: "Three stars only because the screen is decent. The manufacturer's quality control is frankly negligent: mine arrived with a cracked hinge, the support team ignored two emails, and the listing flatly misrepresents the battery life. I expected far better from a brand that charges this much." },
  { id: 'C', stars: 5, label: 'Detailed 5-star, hedged',
    text: "Five stars, though not without reservations. Setup took me twenty minutes, longer than the instructions promise, but the battery has genuinely lasted two days of heavy use and the keyboard is a pleasure to type on. Some reviewers report overheating; I haven't seen it." },
];