# NutriSync

Personal/family calorie + exercise tracker. South Indian food is a first-class
citizen, not an afterthought. v1 scope only — no workout generator yet.

## Stack

- Monorepo: pnpm workspaces + Turborepo
- apps/api: Express + TypeScript, MongoDB (Atlas)
- apps/web: React 19 + Vite + Tailwind
- apps/mobile: Expo / React Native
- packages/shared: Zod schemas, shared across all three

## Commands

- Install: pnpm install
- Dev all: pnpm turbo run dev (apps/mobile has no `dev` script — run it separately: pnpm --filter mobile start)
- Dev one: pnpm --filter api dev
- Build: pnpm turbo run build
- Lint: pnpm turbo run lint

## Conventions

- TypeScript strict mode everywhere
- All API request/response shapes defined as Zod schemas in packages/shared,
  imported by api/web/mobile — never duplicate a type
- Named exports only, except framework-mandated root entry components
  (apps/web/src/App.tsx, apps/mobile/App.tsx) — these stay default exports
  per Vite/Expo convention
- Conventional commits

## Current phase

Phase 1: scaffold only. No auth, no food data yet.
