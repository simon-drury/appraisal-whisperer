# Build verification

Ran on `copilot/phase-2-hf-manifold-integration` after `npm ci`.

## `npm ci`

```text
added 398 packages, and audited 399 packages in 8s

73 packages are looking for funding
  run `npm fund` for details

26 vulnerabilities (2 low, 7 moderate, 17 high)

To address issues that do not require attention, run:
  npm audit fix

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.
```

## `npm run verify`

```text
> vite_react_shadcn_ts@0.0.0 verify
> npm run typecheck && npm run build


> vite_react_shadcn_ts@0.0.0 typecheck
> tsc --noEmit -p tsconfig.app.json


> vite_react_shadcn_ts@0.0.0 build
> vite build

vite v5.4.10 building for production...
transforming...
Browserslist: browsers data (caniuse-lite) is 25 months old. Please run:
  npx update-browserslist-db@latest
  Why you should do it regularly: https://github.com/browserslist/update-db#readme
✓ 1685 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   1.01 kB │ gzip:   0.43 kB
dist/assets/index-BlCWYTk9.css   60.11 kB │ gzip:  10.68 kB
dist/assets/index-DN0dSNVc.js   340.14 kB │ gzip: 107.89 kB
✓ built in 2.02s
```

## `npm run build`

```text
> vite_react_shadcn_ts@0.0.0 build
> vite build

vite v5.4.10 building for production...
transforming...
Browserslist: browsers data (caniuse-lite) is 25 months old. Please run:
  npx update-browserslist-db@latest
  Why you should do it regularly: https://github.com/browserslist/update-db#readme
✓ 1685 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   1.01 kB │ gzip:   0.43 kB
dist/assets/index-BlCWYTk9.css   60.11 kB │ gzip:  10.68 kB
dist/assets/index-DN0dSNVc.js   340.14 kB │ gzip: 107.89 kB
✓ built in 2.06s
```

`npm run lint` now exits successfully with 0 errors and 8 existing warnings. The lint errors were fixed by replacing the API `any` parameters with request/response types (type-only), replacing `any` in the Hugging Face response boundary with `unknown`, replacing two empty interfaces with equivalent type aliases, and importing the Tailwind plugin as ESM. No API runtime behavior was changed.

The empty cached-review stub and a representative `scripts/generate-cache.mjs`-shaped populated cache both pass TypeScript typechecking. The API's explicit `.js` imports remain unchanged and resolve to their TypeScript sources with `moduleResolution: "bundler"`; their extensions remain suitable for the package's Node ESM setup.
