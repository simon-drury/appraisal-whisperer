# Appraisal Whisperer

SFL (Systemic Functional Linguistics) analysis of any text, ranked on what people said, not on stars. Paste a review or any other text and the app returns appraisal, transitivity, a meaning map and a six-element SFL vector.

## What it does

- **Appraisal:** attitude (affect, judgement, appreciation), engagement (monogloss, heterogloss) and graduation (force, focus), plus the raw appraisal tokens.
- **Transitivity:** process types, participant roles and circumstances.
- **Meaning map:** experiential, interpersonal and textual scores, semiotic torque, dominant concept and derived meanings.
- **Six-element vector:** ideational, field, interpersonal, tenor, textual and mode, each scored 0 to 1. Metafunctions and register variables are distinct strata and are scored independently; none is bound to another.
- **Compare samples A-C:** runs three synthetic reviews (generic 5-star, 3-star with high-force judgement, hedged detailed 5-star) and tabulates stars against judgement, force and the six scores.
- **Export:** every analysis can be exported as a multi-agent event (JSON).

Any value the model returns outside 0 to 1 is shown as missing (a dash). It is never replaced by a default.

## Architecture

- The browser calls `SFLAnalysisService`, which posts the text and domain to `/api/analyze` with an `x-demo-token` header.
- `api/analyze.ts` runs server-side. It checks the token, limits text to 3000 characters, applies a rate limit, builds the system prompt from `src/lib/prompt.ts` and calls the OpenAI chat completions API with `temperature: 0` and JSON mode. The OpenAI key never reaches the browser.
- The response contains `llm` (the model output), `model` and `promptSha` (a short hash of the system prompt) for provenance.
- An experimental second backend calls a Hugging Face Gradio Space (default `simondrury/sfl-manifold-demo`) and returns only the vector.

## Configuration

Set these as environment variables on the server (for example in Vercel, Preview and Production scopes):

| Variable | Required | Meaning |
|---|---|---|
| `OPENAI_API_KEY` | yes | OpenAI key used by the proxy |
| `DEMO_TOKEN` | yes | Access code the UI sends in `x-demo-token` |
| `OPENAI_MODEL` | no | Model name, default `gpt-4o` |
| `RATE_LIMIT_PER_MIN` | no | Calls per rolling 60 s window per client IP, default 6 |

Proxy responses: 405 for non-POST, 401 for a wrong token, 400 for empty or over-long text, 429 when rate limited, 502 for an upstream error or invalid model JSON, 500 if the server is not configured. The rate limiter is in memory and per server instance, so it is best-effort. The real protections are `DEMO_TOKEN` and a spend cap on the OpenAI key.

## Development

```bash
npm ci
npm run dev        # local dev server (the /api route needs a Vercel-style runtime)
npm run lint
npm run verify     # typecheck, then production build
npm run build
```

## Cached results

`scripts/generate-cache.mjs` runs the sample reviews through a deployed proxy several times and writes `src/data/cachedReviews.ts` with provenance (model, prompt hash, timestamp, per-dimension mean, min, max and n). The `CachedComparison` table on the page reads that file and makes no live call.

```bash
DEMO_TOKEN=... node scripts/generate-cache.mjs https://your-deployment.example 3
```

`PAUSE_MS` (default 11000) sets the pause between calls. On HTTP 429 the script waits 20 s and retries, up to 3 attempts. Keep `DEMO_TOKEN` in an environment file rather than on the command line.

## Project structure

```
api/analyze.ts                      server-side proxy
scripts/generate-cache.mjs          cache generator
scripts/reviews.input.json          sample reviews for the generator
src/components/AppraisalMapperAgent.tsx   main UI
src/components/CachedComparison.tsx       cached results table
src/data/cachedReviews.ts           generated cache (empty until generated)
src/lib/                            prompt, domain registry, sample reviews, Hugging Face client
src/services/sflAnalysisService.ts  backend selection and response parsing
src/types/sfl.ts                    type definitions
docs/BUILD_VERIFICATION.md          recorded typecheck and build output
```

## Status

- Typecheck and production build pass (see `docs/BUILD_VERIFICATION.md`).
- Not yet deployed. The live endpoint, including Node ESM resolution of `api/analyze.ts` on Vercel, is untested.
- The cache has not been generated, so the cached table is empty.
- The Hugging Face backend is experimental and its Space route is not verified.
- `npm audit` reports vulnerabilities that have not been addressed.

## SFL background

SFL organises meaning into three metafunctions (ideational, interpersonal, textual) and three register variables (field, tenor, mode). Appraisal (Martin and White) and Transitivity (Halliday) supply the interpersonal and ideational analysis. This project scores the six elements as independent values and does not assume that any metafunction maps onto any register variable.

## Licence

GNU Affero General Public License v3.
