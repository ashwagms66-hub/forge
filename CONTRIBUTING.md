# Contributing to Forge

Thanks for your interest in contributing! Forge is an early-stage beta, so expect things to move quickly — small, focused contributions are the easiest to review and merge.

## Getting Started

1. Fork the repository and clone your fork.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment example (optional — only needed to test AI-generated refactor drafts):
   ```bash
   cp .env.example .env.local
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) and confirm the app runs.

## Making a Change

1. Create a branch for your change:
   ```bash
   git checkout -b your-branch-name
   ```
2. Make your change, keeping it focused on a single concern.
3. Verify the build passes before opening a PR:
   ```bash
   npm run build
   ```
4. Commit with a clear, descriptive message explaining *why* the change was made.
5. Push your branch and open a pull request against `main`, describing what changed and why.

## Reporting Issues

If you find a bug or have a feature request, please open a GitHub issue with:

- What you expected to happen
- What actually happened
- Steps to reproduce (for bugs)

## Code Style

- TypeScript throughout; keep new code typed rather than falling back to `any`.
- Match the existing code style in the file you're editing (Tailwind for styling, no new UI libraries without discussion).
- Avoid adding new dependencies unless necessary for the change.

## Security

Never commit real API keys or secrets. `.env.local` is git-ignored — use `.env.example` as the template for any new environment variables and leave the value blank there.
