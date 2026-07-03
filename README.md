# Forge

**Forge is an AI engineering partner for analyzing, scoring, and refactoring React codebases.**

Point it at a single component, a zipped project, or a public GitHub repository, and Forge parses your TypeScript/React source, scores it, flags structural problems, and drafts a prioritized refactor plan — with optional AI-generated refactor drafts when an OpenAI key is configured.

> 🚧 **Beta** — Forge is an early-stage MVP under active development. Behavior, scoring thresholds, and the UI are still evolving. A waitlist is available on the landing page for early access to new capabilities.

---

## What Forge is

Forge answers three questions about a React codebase:

1. **What's actually here?** — components, hooks, lines of code, JSX structure.
2. **How healthy is it?** — a quality score per component and a health score per project, with clear grades (A+–F).
3. **What should I fix first?** — a ranked list of concrete, explained recommendations and a prioritized refactor queue, with a preview of what an AI-assisted refactor would look like.

It works at two levels: a **single component** (drag in one `.tsx`/`.ts` file) or an **entire project** (upload a ZIP or point it at a public GitHub repo URL).

## Key Features

- **Single component analysis** — parses one file and reports lines of code, hook usage, function count, prop count, and JSX nesting depth.
- **Quality scoring** — a 0–100 score with letter grade, color-coded severity, and a plain-English explanation, calibrated so trivial files score high and genuinely complex ones score low.
- **Rule-based suggestions** — flags components that are too large, too deeply nested, too hook-heavy, or have too many functions/props/effects, each with a severity and category.
- **Refactor drafts** — a local, rule-based draft plan (summary + numbered steps) generated instantly, or a real AI-generated draft when `OPENAI_API_KEY` is set — with automatic, transparent fallback to the local draft if the AI call fails or no key is configured.
- **Project-wide scanning** — upload a `.zip` of a project or paste a public GitHub repo URL; Forge extracts and analyzes every `.ts`/`.tsx` file (skipping `node_modules`, `dist`, `build`, `.next`, `coverage`).
- **Architecture insights** — folder-by-folder breakdown, the largest folder and largest component, and dedicated lists of large / hook-heavy / deeply-nested components.
- **Project health score** — an aggregate 0–100 health score and grade for the whole project, with a human-readable summary of what's driving it.
- **Prioritized recommendations** — the top project-wide issues, ranked by severity and estimated impact.
- **Refactor queue** — the files most worth refactoring first, ranked by size, hook usage, JSX depth, and how many problem categories they hit at once — each with an estimated score, time, and impact, and a one-click "Generate AI Refactor Draft" action.
- **AI draft preview** — generated drafts (summary, numbered steps, notes) are shown in a dedicated preview panel, clearly marked "preview only — no files changed." Forge never writes to disk or applies a diff.
- **Dashboard-style results** — Project Health, Key Metrics, Architecture Insights, Top Recommendations, and the Refactor Queue are laid out as a responsive dashboard after every scan.

## Current MVP Capabilities

What Forge does today:

- Analyze a single `.ts`/`.tsx` file, a ZIP archive, or a public GitHub repository.
- Compute component-level and project-level metrics, scores, and suggestions entirely server-side, in memory (nothing is written to disk or persisted between requests).
- Generate refactor **drafts** — plain-text plans, not code diffs — either from local rules or from OpenAI, with automatic fallback.

What Forge does **not** do yet (see [Roadmap](#roadmap)):

- Generate or apply real code diffs.
- Write, modify, or commit any files.
- Persist scan history, accounts, or the beta waitlist (the waitlist form is local-only UI with no backend, database, or email integration).
- Require authentication — there are no user accounts.

## Tech Stack

- **[Next.js 16](https://nextjs.org/)** (App Router, Turbopack) + **React 19** + **TypeScript**
- **[Tailwind CSS 4](https://tailwindcss.com/)** for styling
- **[ts-morph](https://ts-morph.com/)** for TypeScript/JSX AST parsing (server-only)
- **[JSZip](https://stuk.github.io/jszip/)** for in-memory ZIP extraction (project and GitHub scans)
- **OpenAI API** (optional) for AI-generated refactor drafts, called via `fetch` — no SDK dependency, no key required to use the app

## How to Run Locally

```bash
# Install dependencies
npm install

# (Optional) enable AI-generated refactor drafts
echo "OPENAI_API_KEY=sk-..." > .env.local
# without a key, Forge automatically uses its local rule-based draft generator

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For a production build:

```bash
npm run build
npm start
```

## Roadmap

- Real code diff generation from refactor drafts (beyond text plans).
- An "apply" workflow — review a diff and open a pull request, rather than just previewing.
- Persistent scan history and a real waitlist/auth backend.
- CI integration (e.g. a GitHub Action that runs Forge on every pull request).
- Broader framework/language support beyond React + TypeScript.
- Team/workspace features for tracking codebase health over time.

## Beta Note

Forge is in active development. Scoring thresholds, UI, and supported workflows will change as the product matures. Feedback is very welcome — if something looks wrong or you want a feature prioritized, that's exactly the kind of signal that shapes the roadmap above.
