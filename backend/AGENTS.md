# Chef-AI — Backend (`chef-ai/backend`)

This directory owns mobile HTTP APIs (`app/api`), provider integration, Supabase server clients, migrations and email templates. The mobile client is the sibling `../mobile/` directory in the same Git repository. Marketing remains in the separate `chef-ai-web` repository.

- Run backend npm commands in this directory. Keep its package/lock files and node_modules independent of mobile; no hoisting or shared runtime imports.
- Read relevant installed Next docs under `node_modules/next/dist/docs/` before code changes.
- Keep existing HTTP paths/auth/contracts compatible. Never import server code into mobile or add it to Metro's input.
- `.env.local` is private0600 and Git ignored. Gemini/service-role/webhook/cron keys are server-only. Never print them or place them in root/mobile/public environment variables.
- Local development uses only staging Supabase `vcyqtbzhfanbpclfhibv`. No production dotenv fallback.
- Existing hosted staging URL/project is unchanged. `vercel.json` disables cron and indexing for staging. Future Git-based Vercel deployment from this monorepo must use Root Directory `backend`; CLI commands run here. Do not change remote configuration or deploy while the no-build instruction is active.
- No new builds, deployments, paid services or automatic scanner account setup. Preserve the user's other uncommitted work.
- Historical three-repo documents are superseded by `docs/MONOREPO.md`. The old standalone remote is a historical snapshot, not the active source.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
