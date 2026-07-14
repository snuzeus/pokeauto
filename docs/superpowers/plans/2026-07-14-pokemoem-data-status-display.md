# Pokemoem Data Status Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display the exact Pokemoem singles data season and source update time bundled into the app.

**Architecture:** Persist the ranking response's source timestamp in `champions-legal.json`. Expose a typed metadata accessor and KST formatter from the usage repository, then render that static metadata in the existing header.

**Tech Stack:** Next.js, React, TypeScript, Vitest, Node.js ESM.

## Global Constraints

- The header must describe generated local data only; it must not fetch Pokemoem at runtime.
- A missing source timestamp must not render an invalid date.
- The display must use Asia/Seoul time.

---

### Task 1: Persist and expose data metadata

**Files:**
- Modify: `scripts/sync-pokemoem-data.mjs`
- Modify: `lib/data/usageRepository.ts`
- Modify: `tests/calc/usageRepository.test.ts`

**Interfaces:**
- Produces: `getChampionUsageMetadata(): { season?: number; rule?: number; sourceUpdatedAt?: string }`.
- Produces: `formatChampionUsageSourceUpdatedAt(value?: string): string | undefined`.

- [ ] Write failing tests for metadata and KST formatting.
- [ ] Run `npx.cmd vitest run tests/calc/usageRepository.test.ts` and verify the missing exports fail.
- [ ] Store `rankingResponse.source_updated_at ?? null` in generated Champions legal data; implement both repository functions using `Asia/Seoul`.
- [ ] Run `npm.cmd run sync:pokemoem && npx.cmd vitest run tests/calc/usageRepository.test.ts`.

### Task 2: Render the bundled status in the header

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `getChampionUsageMetadata` and `formatChampionUsageSourceUpdatedAt`.

- [ ] Replace the literal season text with generated season, singles rule, and formatted source update time.
- [ ] Run `npm.cmd test && npx.cmd tsc --noEmit && npm.cmd run build`.
- [ ] Commit app, repository, sync script, tests, and generated data with message `Show bundled Pokemoem data status`.
