import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CACHED_REVIEWS } from '@/data/cachedReviews';

type Stat = { mean: number; min: number; max: number; n: number } | null;
type Dim = 'ideational' | 'field' | 'interpersonal' | 'tenor' | 'textual' | 'mode';

interface CachedReview {
  id: string;
  label: string;
  stars: number | null;
  model: string;
  promptSha: string;
  generatedAt: string;
  vector: Record<Dim, Stat>;
  judgement: Stat;
  force: Stat;
}

const DIMS: Dim[] = ['ideational', 'field', 'interpersonal', 'tenor', 'textual', 'mode'];
const rows = CACHED_REVIEWS as unknown as readonly CachedReview[];
const pct = (s: Stat | undefined) => (s ? `${(s.mean * 100).toFixed(1)}%` : '—');

export const CachedComparison = () => (
  <Card>
    <CardHeader><CardTitle>Cached results: stars vs. what was said</CardTitle></CardHeader>
    <CardContent className="overflow-x-auto">
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No cached results yet. Run scripts/generate-cache.mjs to populate them.
        </p>
      ) : (
        <>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-3">Review</th><th className="pr-3">Stars</th>
                <th className="pr-3">Judgement</th><th className="pr-3">Force</th>
                {DIMS.map((d) => <th key={d} className="pr-3 capitalize">{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="py-2 pr-3">{r.id} · {r.label}</td>
                  <td className="pr-3">{r.stars ?? '—'}</td>
                  <td className="pr-3">{pct(r.judgement)}</td>
                  <td className="pr-3">{pct(r.force)}</td>
                  {DIMS.map((d) => <td key={d} className="pr-3">{pct(r.vector[d])}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-muted-foreground mt-3">
            Means over {rows[0].vector.ideational?.n ?? '?'} runs per review · model {rows[0].model} · prompt {rows[0].promptSha} · generated {rows[0].generatedAt}. Synthetic reviews; this table makes no live call.
          </p>
        </>
      )}
    </CardContent>
  </Card>
);
