# Repository Guidelines

## Project Structure & Module Organization
- Current repository is docs-first: `docs/需求文档.md`, `docs/技术方案.md`.
- Follow the planned module boundaries:
- `content/` site adapters and send interception.
- `core/` rule engine, masking, risk decisions.
- `background/` extension service worker tasks.
- `options/` settings UI.
- `shared/` types and message contracts.
- `tests/` unit, integration, cross-browser checks.
- Keep modules cohesive and separated: no site DOM logic inside `core/`.

## Build, Test, and Development Commands
- No toolchain is committed yet. When scaffolding, expose:
- `npm run dev` local extension development.
- `npm run build` production bundle.
- `npm test` automated tests.
- `npm run lint` static checks.
- Planning helpers: `rg --files`, `Get-Content docs/技术方案.md`.

## Coding Style & Naming Conventions
- Prefer TypeScript for runtime and shared contracts.
- Use 2-space indentation.
- Keep code minimal and readable; avoid over-abstraction.
- Enforce high cohesion and low coupling across modules.
- Naming: `camelCase` (vars/functions), `PascalCase` (types/classes), `kebab-case` (files, e.g. `pre-send-guard.ts`).
- `preSendGuard` stays the single send gateway; no bypass paths.
- Add concise English comments on critical logic only (risk decision, interception, masking, fallback branches).
- Use ESLint + Prettier when available.

## Testing Guidelines
- Add tests with every executable module.
- Suggested layout: `tests/unit/*.test.ts`, `tests/integration/*.test.ts`.
- For rule changes, include positive/negative samples, IME/send-trigger regressions, and ~2000-char performance baselines.

## Commit & Pull Request Guidelines
- Git history is unavailable in this snapshot; use Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`).
- PRs must include scope summary, linked requirement section, test evidence, and privacy/permission impact notes.

## Security & Privacy Notes
- Never store or transmit raw user input.
- Keep permissions minimal (no `<all_urls>`); use explicit host allowlists.
- Log only anonymized metadata (type, count, time, action), not sensitive payloads.

## Agent Collaboration Notes
- Assistant replies should be in Chinese and address the user as `主人`.
- Prefer direct, actionable answers and avoid unnecessary wording.
