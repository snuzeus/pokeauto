# Pokemon Champions 메타 계산기 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 내 포켓몬 샘플 세트와 상대 Pokemon Champions 메타 대표 세트를 로컬 JSON 기반으로 계산하고 비교하는 Next.js MVP를 만든다.

**Architecture:** App Router 기반 Next.js 앱에서 UI는 `components/`에 두고, 데이터 로딩은 `lib/data/`, 계산 로직은 `lib/calc/`의 순수 함수로 분리한다. MVP는 외부 fetch 없이 `data/master`, `data/sample`, `data/my-team` JSON만 사용하며, 이후 fetch/cache는 repository 인터페이스 뒤에 붙인다.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Vitest

---

## File Structure

- Create: `package.json` - scripts and dependencies.
- Create: `next.config.ts` - Next.js config.
- Create: `tsconfig.json` - TypeScript config with JSON module imports.
- Create: `postcss.config.mjs` - Tailwind PostCSS config.
- Create: `tailwind.config.ts` - Tailwind content paths and theme.
- Create: `vitest.config.ts` - Vitest config.
- Create: `app/layout.tsx` - app shell metadata.
- Create: `app/globals.css` - global styles.
- Create: `app/page.tsx` - main calculator screen.
- Create: `types/master.ts` - master data types.
- Create: `types/usage.ts` - usage JSON types.
- Create: `types/team.ts` - my team set types.
- Create: `types/calc.ts` - calculated result types.
- Create: `data/master/pokemon.json` - minimal Garchomp master data.
- Create: `data/master/moves.json` - minimal move master data for listed moves.
- Create: `data/master/items.json` - minimal item master data.
- Create: `data/master/natures.json` - minimal nature master data.
- Create: `data/sample/0445-00.json` - Garchomp usage sample.
- Create: `data/my-team/sample.json` - user's sample team set.
- Create: `lib/data/pokemonRepository.ts` - name to `pokeKey` lookup.
- Create: `lib/data/moveRepository.ts` - move lookup by key.
- Create: `lib/data/itemRepository.ts` - item lookup by key.
- Create: `lib/data/natureRepository.ts` - nature lookup by key.
- Create: `lib/data/usageRepository.ts` - local usage sample lookup.
- Create: `lib/data/myTeamRepository.ts` - local my team sample lookup.
- Create: `lib/calc/stats.ts` - stat calculation.
- Create: `lib/calc/power.ts` - offensive power calculation.
- Create: `lib/calc/speed.ts` - speed calculation helpers.
- Create: `lib/calc/bulk.ts` - bulk calculation.
- Create: `components/PokemonSearch.tsx` - opponent search form.
- Create: `components/MyTeamPanel.tsx` - my sample set display.
- Create: `components/UsageSummary.tsx` - opponent meta set summary.
- Create: `components/StatCard.tsx` - compact metric card.
- Create: `components/PowerTable.tsx` - move power table.
- Create: `components/ComparisonPanel.tsx` - my set vs opponent comparison.
- Create: `tests/calc/stats.test.ts` - stat tests.
- Create: `tests/calc/speed.test.ts` - speed tests.
- Create: `tests/calc/bulk.test.ts` - bulk tests.
- Create: `tests/calc/power.test.ts` - power tests.

## Task 1: Project Skeleton

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `vitest.config.ts`
- Create: `app/layout.tsx`
- Create: `app/globals.css`

- [ ] **Step 1: Create package and config files**

Create `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "lint": "next lint",
    "test": "vitest run"
  },
  "dependencies": {
    "@next/env": "latest",
    "next": "latest",
    "react": "latest",
    "react-dom": "latest",
    "lucide-react": "latest"
  },
  "devDependencies": {
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "autoprefixer": "latest",
    "postcss": "latest",
    "tailwindcss": "latest",
    "typescript": "latest",
    "vitest": "latest"
  }
}
```

Create `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Create `postcss.config.mjs`:

```js
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};

export default config;
```

Create `tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {}
  },
  plugins: []
};

export default config;
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"]
  },
  resolve: {
    alias: {
      "@": new URL(".", import.meta.url).pathname
    }
  }
});
```

- [ ] **Step 2: Create app shell**

Create `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pokemon Champions Calc",
  description: "개인용 Pokemon Champions 메타 계산기"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

Create `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: light;
}

body {
  margin: 0;
  background: #f6f7f9;
  color: #111827;
}
```

- [ ] **Step 3: Install dependencies**

Run: `npm install`

Expected: dependencies installed and `package-lock.json` created.

- [ ] **Step 4: Commit skeleton**

Run:

```bash
git add package.json package-lock.json next.config.ts tsconfig.json postcss.config.mjs tailwind.config.ts vitest.config.ts app/layout.tsx app/globals.css
git commit -m "chore: scaffold next app"
```

## Task 2: Types and Local JSON Data

**Files:**
- Create: `types/master.ts`
- Create: `types/usage.ts`
- Create: `types/team.ts`
- Create: `types/calc.ts`
- Create: `data/master/pokemon.json`
- Create: `data/master/moves.json`
- Create: `data/master/items.json`
- Create: `data/master/natures.json`
- Create: `data/sample/0445-00.json`
- Create: `data/my-team/sample.json`

- [ ] **Step 1: Create type files**

Create `types/master.ts`:

```ts
export type StatKey = "hp" | "atk" | "def" | "spa" | "spd" | "spe";

export type PokemonMaster = {
  pokeKey: string;
  dexNo: number;
  formNo: number;
  koreanName: string;
  japaneseName?: string;
  englishName?: string;
  types: string[];
  baseStats: Record<StatKey, number>;
};

export type MoveMaster = {
  key: number;
  koreanName: string;
  japaneseName?: string;
  englishName?: string;
  type: string;
  category: "physical" | "special" | "status";
  power: number | null;
  accuracy?: number | null;
};

export type ItemMaster = {
  key: number;
  koreanName: string;
  japaneseName?: string;
  englishName?: string;
  effectType?: "life_orb" | "choice_band" | "choice_specs" | "choice_scarf" | "none";
  multiplier?: number;
};

export type NatureMaster = {
  key: number;
  koreanName: string;
  japaneseName?: string;
  englishName?: string;
  up?: Exclude<StatKey, "hp">;
  down?: Exclude<StatKey, "hp">;
};
```

Create `types/usage.ts`:

```ts
export type UsageRankEntry = {
  rank: number;
  key: number;
  name: string;
  rate: number;
};

export type UsageStatPoint = {
  rank: number;
  label: string;
  raw: string;
  pct: number;
  rep_ev: {
    H: number;
    A: number;
    B: number;
    C: number;
    D: number;
    S: number;
  };
};

export type PokemonUsage = {
  season: number;
  rule: number;
  poke_key: string;
  version: "champions";
  source: string;
  data: {
    items: UsageRankEntry[];
    abilities: UsageRankEntry[];
    natures: UsageRankEntry[];
    moves: UsageRankEntry[];
    teammates: UsageRankEntry[];
    battle_teammates: UsageRankEntry[];
    stat_points: {
      skeletons: UsageStatPoint[];
      raw: unknown[];
      marginals: unknown[];
    };
    win_moves: UsageRankEntry[];
    lose_moves: UsageRankEntry[];
    win_pokemons: UsageRankEntry[];
    lose_pokemons: UsageRankEntry[];
    mega: UsageRankEntry[];
    updated_at: string;
  };
  created: number;
  synced_at: number;
};
```

Create `types/team.ts`:

```ts
export type EffortValues = {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
};

export type MyPokemonSet = {
  id: string;
  pokeKey: string;
  nickname?: string;
  level: number;
  natureKey: number;
  itemKey?: number;
  abilityKey?: number;
  evs: EffortValues;
  moves: number[];
};
```

Create `types/calc.ts`:

```ts
import type { MoveMaster } from "./master";

export type CalculatedStats = {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
};

export type MovePowerResult = {
  move: MoveMaster;
  power: number;
  stab: number;
  itemMultiplier: number;
  offensiveStat: number;
};

export type BulkResult = {
  physical: number;
  special: number;
};
```

- [ ] **Step 2: Create minimal master JSON**

Create `data/master/pokemon.json`:

```json
[
  {
    "pokeKey": "0445-00",
    "dexNo": 445,
    "formNo": 0,
    "koreanName": "한카리아스",
    "japaneseName": "ガブリアス",
    "englishName": "Garchomp",
    "types": ["dragon", "ground"],
    "baseStats": {
      "hp": 108,
      "atk": 130,
      "def": 95,
      "spa": 80,
      "spd": 85,
      "spe": 102
    }
  }
]
```

Create `data/master/moves.json`:

```json
[
  { "key": 89, "koreanName": "지진", "japaneseName": "じしん", "englishName": "Earthquake", "type": "ground", "category": "physical", "power": 100, "accuracy": 100 },
  { "key": 446, "koreanName": "스텔스록", "japaneseName": "ステルスロック", "englishName": "Stealth Rock", "type": "rock", "category": "status", "power": null, "accuracy": null },
  { "key": 200, "koreanName": "역린", "japaneseName": "げきりん", "englishName": "Outrage", "type": "dragon", "category": "physical", "power": 120, "accuracy": 100 },
  { "key": 317, "koreanName": "암석봉인", "japaneseName": "がんせきふうじ", "englishName": "Rock Tomb", "type": "rock", "category": "physical", "power": 60, "accuracy": 95 },
  { "key": 799, "koreanName": "스케일샷", "japaneseName": "スケイルショット", "englishName": "Scale Shot", "type": "dragon", "category": "physical", "power": 25, "accuracy": 90 }
]
```

Create `data/master/items.json`:

```json
[
  { "key": 275, "koreanName": "기합의띠", "japaneseName": "きあいのタスキ", "englishName": "Focus Sash", "effectType": "none", "multiplier": 1 },
  { "key": 287, "koreanName": "구애스카프", "japaneseName": "こだわりスカーフ", "englishName": "Choice Scarf", "effectType": "choice_scarf", "multiplier": 1.5 },
  { "key": 158, "koreanName": "자뭉열매", "japaneseName": "オボンのみ", "englishName": "Sitrus Berry", "effectType": "none", "multiplier": 1 },
  { "key": 270, "koreanName": "생명의구슬", "japaneseName": "いのちのたま", "englishName": "Life Orb", "effectType": "life_orb", "multiplier": 1.3 }
]
```

Create `data/master/natures.json`:

```json
[
  { "key": 13, "koreanName": "명랑", "japaneseName": "ようき", "englishName": "Jolly", "up": "spe", "down": "spa" },
  { "key": 3, "koreanName": "고집", "japaneseName": "いじっぱり", "englishName": "Adamant", "up": "atk", "down": "spa" }
]
```

- [ ] **Step 3: Create usage and my team sample JSON**

Create `data/sample/0445-00.json`:

```json
{
  "season": 3,
  "rule": 10,
  "poke_key": "0445-00",
  "version": "champions",
  "source": "official",
  "data": {
    "items": [
      { "rank": 1, "key": 275, "name": "기합의띠", "rate": 37.8 },
      { "rank": 2, "key": 287, "name": "구애스카프", "rate": 23.6 },
      { "rank": 3, "key": 158, "name": "자뭉열매", "rate": 23.0 },
      { "rank": 4, "key": 270, "name": "생명의구슬", "rate": 5.1 }
    ],
    "abilities": [],
    "natures": [
      { "rank": 1, "key": 13, "name": "ようき", "rate": 57.2 },
      { "rank": 2, "key": 3, "name": "いじっぱり", "rate": 23.1 }
    ],
    "moves": [
      { "rank": 1, "key": 89, "name": "じしん", "rate": 99.5 },
      { "rank": 2, "key": 446, "name": "ステルスロック", "rate": 48.8 },
      { "rank": 3, "key": 200, "name": "げきりん", "rate": 45.6 },
      { "rank": 4, "key": 317, "name": "がんせきふうじ", "rate": 34.5 },
      { "rank": 5, "key": 799, "name": "スケイルショット", "rate": 30.6 }
    ],
    "teammates": [],
    "battle_teammates": [],
    "stat_points": {
      "skeletons": [
        {
          "rank": 1,
          "label": "H2/A32/S32",
          "raw": "02-20-00-00-00-20",
          "pct": 53.7,
          "rep_ev": {
            "H": 2,
            "A": 32,
            "B": 0,
            "C": 0,
            "D": 0,
            "S": 32
          }
        }
      ],
      "raw": [],
      "marginals": []
    },
    "win_moves": [],
    "lose_moves": [],
    "win_pokemons": [],
    "lose_pokemons": [],
    "mega": [],
    "updated_at": "2026-07-01T05:15:44Z"
  },
  "created": 1782882944,
  "synced_at": 1782882944
}
```

Create `data/my-team/sample.json`:

```json
[
  {
    "id": "my-garchomp-focus-sash",
    "pokeKey": "0445-00",
    "nickname": "샘플 한카리아스",
    "level": 50,
    "natureKey": 13,
    "itemKey": 275,
    "evs": {
      "hp": 2,
      "atk": 32,
      "def": 0,
      "spa": 0,
      "spd": 0,
      "spe": 32
    },
    "moves": [89, 200, 317, 799]
  }
]
```

- [ ] **Step 4: Commit data foundation**

Run:

```bash
git add types data
git commit -m "feat: add pokemon calc data types and samples"
```

## Task 3: Data Repositories

**Files:**
- Create: `lib/data/pokemonRepository.ts`
- Create: `lib/data/moveRepository.ts`
- Create: `lib/data/itemRepository.ts`
- Create: `lib/data/natureRepository.ts`
- Create: `lib/data/usageRepository.ts`
- Create: `lib/data/myTeamRepository.ts`

- [ ] **Step 1: Implement repository functions**

Create `lib/data/pokemonRepository.ts`:

```ts
import pokemonData from "@/data/master/pokemon.json";
import type { PokemonMaster } from "@/types/master";

const pokemon = pokemonData as PokemonMaster[];

export function listPokemon(): PokemonMaster[] {
  return pokemon;
}

export function findPokemonByName(name: string): PokemonMaster | undefined {
  const normalized = name.trim().toLowerCase();
  return pokemon.find((entry) =>
    [entry.koreanName, entry.japaneseName, entry.englishName, entry.pokeKey]
      .filter(Boolean)
      .some((candidate) => candidate!.toLowerCase() === normalized)
  );
}

export function findPokemonByKey(pokeKey: string): PokemonMaster | undefined {
  return pokemon.find((entry) => entry.pokeKey === pokeKey);
}
```

Create `lib/data/moveRepository.ts`:

```ts
import moveData from "@/data/master/moves.json";
import type { MoveMaster } from "@/types/master";

const moves = moveData as MoveMaster[];

export function listMoves(): MoveMaster[] {
  return moves;
}

export function findMoveByKey(key: number): MoveMaster | undefined {
  return moves.find((move) => move.key === key);
}
```

Create `lib/data/itemRepository.ts`:

```ts
import itemData from "@/data/master/items.json";
import type { ItemMaster } from "@/types/master";

const items = itemData as ItemMaster[];

export function listItems(): ItemMaster[] {
  return items;
}

export function findItemByKey(key?: number): ItemMaster | undefined {
  if (key === undefined) return undefined;
  return items.find((item) => item.key === key);
}
```

Create `lib/data/natureRepository.ts`:

```ts
import natureData from "@/data/master/natures.json";
import type { NatureMaster } from "@/types/master";

const natures = natureData as NatureMaster[];

export function listNatures(): NatureMaster[] {
  return natures;
}

export function findNatureByKey(key: number): NatureMaster | undefined {
  return natures.find((nature) => nature.key === key);
}
```

Create `lib/data/usageRepository.ts`:

```ts
import garchompUsage from "@/data/sample/0445-00.json";
import type { PokemonUsage } from "@/types/usage";

const usageByKey: Record<string, PokemonUsage> = {
  "0445-00": garchompUsage as PokemonUsage
};

export function findUsageByPokeKey(pokeKey: string): PokemonUsage | undefined {
  return usageByKey[pokeKey];
}
```

Create `lib/data/myTeamRepository.ts`:

```ts
import myTeamData from "@/data/my-team/sample.json";
import type { MyPokemonSet } from "@/types/team";

const myTeam = myTeamData as MyPokemonSet[];

export function listMyPokemonSets(): MyPokemonSet[] {
  return myTeam;
}

export function findMyPokemonSetById(id: string): MyPokemonSet | undefined {
  return myTeam.find((set) => set.id === id);
}
```

- [ ] **Step 2: Commit repositories**

Run:

```bash
git add lib/data
git commit -m "feat: add local data repositories"
```

## Task 4: Calculation Engine with Tests

**Files:**
- Create: `lib/calc/stats.ts`
- Create: `lib/calc/speed.ts`
- Create: `lib/calc/bulk.ts`
- Create: `lib/calc/power.ts`
- Create: `tests/calc/stats.test.ts`
- Create: `tests/calc/speed.test.ts`
- Create: `tests/calc/bulk.test.ts`
- Create: `tests/calc/power.test.ts`

- [ ] **Step 1: Write tests**

Create `tests/calc/stats.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { calculateStats } from "@/lib/calc/stats";

describe("calculateStats", () => {
  it("calculates level 50 stats with nature modifiers", () => {
    const stats = calculateStats({
      baseStats: { hp: 108, atk: 130, def: 95, spa: 80, spd: 85, spe: 102 },
      level: 50,
      evs: { hp: 2, atk: 32, def: 0, spa: 0, spd: 0, spe: 32 },
      nature: { key: 13, koreanName: "명랑", up: "spe", down: "spa" }
    });

    expect(stats.hp).toBeGreaterThan(150);
    expect(stats.atk).toBeGreaterThan(130);
    expect(stats.spe).toBeGreaterThan(150);
    expect(stats.spa).toBeLessThan(100);
  });
});
```

Create `tests/calc/speed.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { applyChoiceScarf } from "@/lib/calc/speed";

describe("speed helpers", () => {
  it("applies choice scarf multiplier", () => {
    expect(applyChoiceScarf(169)).toBe(253);
  });
});
```

Create `tests/calc/bulk.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { calculateBulk } from "@/lib/calc/bulk";

describe("calculateBulk", () => {
  it("calculates physical and special bulk", () => {
    expect(calculateBulk({ hp: 183, atk: 182, def: 115, spa: 90, spd: 105, spe: 169 })).toEqual({
      physical: 21045,
      special: 19215
    });
  });
});
```

Create `tests/calc/power.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { calculateMovePower, isDamagingMove } from "@/lib/calc/power";

describe("power calculation", () => {
  it("excludes status moves", () => {
    expect(isDamagingMove({ key: 446, koreanName: "스텔스록", type: "rock", category: "status", power: null })).toBe(false);
  });

  it("applies STAB and life orb to physical moves", () => {
    const result = calculateMovePower({
      pokemonTypes: ["dragon", "ground"],
      stats: { hp: 183, atk: 182, def: 115, spa: 90, spd: 105, spe: 169 },
      move: { key: 89, koreanName: "지진", type: "ground", category: "physical", power: 100 },
      item: { key: 270, koreanName: "생명의구슬", effectType: "life_orb", multiplier: 1.3 }
    });

    expect(result?.stab).toBe(1.5);
    expect(result?.itemMultiplier).toBe(1.3);
    expect(result?.power).toBe(35490);
  });
});
```

- [ ] **Step 2: Implement calculation modules**

Create `lib/calc/stats.ts`:

```ts
import type { NatureMaster, StatKey } from "@/types/master";
import type { CalculatedStats } from "@/types/calc";
import type { EffortValues } from "@/types/team";

type CalculateStatsInput = {
  baseStats: Record<StatKey, number>;
  level: number;
  evs: EffortValues;
  nature?: NatureMaster;
};

function natureMultiplier(stat: Exclude<StatKey, "hp">, nature?: NatureMaster): number {
  if (nature?.up === stat) return 1.1;
  if (nature?.down === stat) return 0.9;
  return 1;
}

function calculateHp(base: number, ev: number, level: number): number {
  return Math.floor(((2 * base + Math.floor(ev / 4)) * level) / 100) + level + 10;
}

function calculateNonHp(base: number, ev: number, level: number, multiplier: number): number {
  const raw = Math.floor(((2 * base + Math.floor(ev / 4)) * level) / 100) + 5;
  return Math.floor(raw * multiplier);
}

export function calculateStats(input: CalculateStatsInput): CalculatedStats {
  const { baseStats, level, evs, nature } = input;

  return {
    hp: calculateHp(baseStats.hp, evs.hp, level),
    atk: calculateNonHp(baseStats.atk, evs.atk, level, natureMultiplier("atk", nature)),
    def: calculateNonHp(baseStats.def, evs.def, level, natureMultiplier("def", nature)),
    spa: calculateNonHp(baseStats.spa, evs.spa, level, natureMultiplier("spa", nature)),
    spd: calculateNonHp(baseStats.spd, evs.spd, level, natureMultiplier("spd", nature)),
    spe: calculateNonHp(baseStats.spe, evs.spe, level, natureMultiplier("spe", nature))
  };
}
```

Create `lib/calc/speed.ts`:

```ts
export function applyChoiceScarf(speed: number): number {
  return Math.floor(speed * 1.5);
}
```

Create `lib/calc/bulk.ts`:

```ts
import type { BulkResult, CalculatedStats } from "@/types/calc";

export function calculateBulk(stats: CalculatedStats): BulkResult {
  return {
    physical: stats.hp * stats.def,
    special: stats.hp * stats.spd
  };
}
```

Create `lib/calc/power.ts`:

```ts
import type { CalculatedStats, MovePowerResult } from "@/types/calc";
import type { ItemMaster, MoveMaster } from "@/types/master";

type CalculateMovePowerInput = {
  pokemonTypes: string[];
  stats: CalculatedStats;
  move: MoveMaster;
  item?: ItemMaster;
};

export function isDamagingMove(move: MoveMaster): boolean {
  return move.category !== "status" && typeof move.power === "number" && move.power > 0;
}

function getItemMultiplier(move: MoveMaster, item?: ItemMaster): number {
  if (!item) return 1;
  if (item.effectType === "life_orb") return 1.3;
  if (item.effectType === "choice_band" && move.category === "physical") return 1.5;
  if (item.effectType === "choice_specs" && move.category === "special") return 1.5;
  return 1;
}

export function calculateMovePower(input: CalculateMovePowerInput): MovePowerResult | undefined {
  const { pokemonTypes, stats, move, item } = input;
  if (!isDamagingMove(move)) return undefined;

  const offensiveStat = move.category === "physical" ? stats.atk : stats.spa;
  const stab = pokemonTypes.includes(move.type) ? 1.5 : 1;
  const itemMultiplier = getItemMultiplier(move, item);
  const power = Math.floor(offensiveStat * move.power! * stab * itemMultiplier);

  return {
    move,
    power,
    stab,
    itemMultiplier,
    offensiveStat
  };
}
```

- [ ] **Step 3: Run tests**

Run: `npm test`

Expected: all calc tests pass.

- [ ] **Step 4: Commit calculation engine**

Run:

```bash
git add lib/calc tests/calc
git commit -m "feat: add pokemon calculation engine"
```

## Task 5: UI Components and Main Page

**Files:**
- Create: `components/PokemonSearch.tsx`
- Create: `components/MyTeamPanel.tsx`
- Create: `components/UsageSummary.tsx`
- Create: `components/StatCard.tsx`
- Create: `components/PowerTable.tsx`
- Create: `components/ComparisonPanel.tsx`
- Create: `app/page.tsx`

- [ ] **Step 1: Create presentational components**

Create `components/StatCard.tsx`:

```tsx
type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
};

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <section className="rounded-md border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-950">{value}</p>
      {hint ? <p className="mt-1 text-sm text-gray-500">{hint}</p> : null}
    </section>
  );
}
```

Create `components/PokemonSearch.tsx`:

```tsx
type PokemonSearchProps = {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
};

export function PokemonSearch({ query, onQueryChange, onSearch }: PokemonSearchProps) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-gray-200 bg-white p-4 sm:flex-row">
      <label className="flex-1">
        <span className="text-sm font-medium text-gray-700">상대 포켓몬</span>
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
          placeholder="한카리아스"
        />
      </label>
      <button
        type="button"
        onClick={onSearch}
        className="rounded-md bg-gray-950 px-4 py-2 text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 sm:self-end"
      >
        검색
      </button>
    </div>
  );
}
```

Create `components/PowerTable.tsx`:

```tsx
import type { MovePowerResult } from "@/types/calc";

type PowerTableProps = {
  title: string;
  rows: MovePowerResult[];
  targetBulk?: number;
};

export function PowerTable({ title, rows, targetBulk }: PowerTableProps) {
  return (
    <section className="rounded-md border border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-base font-semibold text-gray-950">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-2">기술</th>
              <th className="px-4 py-2">분류</th>
              <th className="px-4 py-2">위력</th>
              <th className="px-4 py-2">결정력</th>
              <th className="px-4 py-2">판정</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.move.key} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-950">{row.move.koreanName}</td>
                <td className="px-4 py-3 text-gray-600">{row.move.category}</td>
                <td className="px-4 py-3 text-gray-600">{row.move.power}</td>
                <td className="px-4 py-3 text-gray-950">{row.power.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-600">{targetBulk && row.power > targetBulk ? "압박 가능" : "참고 지표"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
```

Create `components/MyTeamPanel.tsx`:

```tsx
import type { PokemonMaster } from "@/types/master";
import type { MyPokemonSet } from "@/types/team";

type MyTeamPanelProps = {
  set: MyPokemonSet;
  pokemon: PokemonMaster;
};

export function MyTeamPanel({ set, pokemon }: MyTeamPanelProps) {
  return (
    <section className="rounded-md border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-500">내 포켓몬 샘플</p>
      <h2 className="mt-1 text-xl font-semibold text-gray-950">{set.nickname ?? pokemon.koreanName}</h2>
      <p className="mt-1 text-sm text-gray-600">{pokemon.koreanName} · {pokemon.pokeKey}</p>
      <p className="mt-3 text-sm text-gray-600">
        노력치 H{set.evs.hp}/A{set.evs.atk}/B{set.evs.def}/C{set.evs.spa}/D{set.evs.spd}/S{set.evs.spe}
      </p>
    </section>
  );
}
```

Create `components/UsageSummary.tsx`:

```tsx
import type { ItemMaster, NatureMaster, PokemonMaster } from "@/types/master";
import type { UsageStatPoint } from "@/types/usage";

type UsageSummaryProps = {
  pokemon: PokemonMaster;
  nature?: NatureMaster;
  item?: ItemMaster;
  statPoint?: UsageStatPoint;
};

export function UsageSummary({ pokemon, nature, item, statPoint }: UsageSummaryProps) {
  return (
    <section className="rounded-md border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-500">상대 대표 메타 세트</p>
      <h2 className="mt-1 text-xl font-semibold text-gray-950">{pokemon.koreanName}</h2>
      <div className="mt-3 space-y-1 text-sm text-gray-600">
        <p>성격: {nature?.koreanName ?? "미확인"}</p>
        <p>아이템: {item?.koreanName ?? "미확인"}</p>
        <p>노력치: {statPoint?.label ?? "미확인"}</p>
      </div>
    </section>
  );
}
```

Create `components/ComparisonPanel.tsx`:

```tsx
import type { BulkResult } from "@/types/calc";
import { StatCard } from "./StatCard";

type ComparisonPanelProps = {
  mySpeed: number;
  opponentSpeed: number;
  opponentScarfSpeed: number;
  myBulk: BulkResult;
  opponentBulk: BulkResult;
};

export function ComparisonPanel({ mySpeed, opponentSpeed, opponentScarfSpeed, myBulk, opponentBulk }: ComparisonPanelProps) {
  return (
    <section className="grid gap-3 md:grid-cols-3">
      <StatCard label="스피드 비교" value={`${mySpeed} / ${opponentSpeed}`} hint={`상대 스카프 ${opponentScarfSpeed}`} />
      <StatCard label="내 내구" value={myBulk.physical.toLocaleString()} hint={`특수 ${myBulk.special.toLocaleString()}`} />
      <StatCard label="상대 내구" value={opponentBulk.physical.toLocaleString()} hint={`특수 ${opponentBulk.special.toLocaleString()}`} />
    </section>
  );
}
```

- [ ] **Step 2: Create main page**

Create `app/page.tsx`:

```tsx
"use client";

import { useMemo, useState } from "react";
import { ComparisonPanel } from "@/components/ComparisonPanel";
import { MyTeamPanel } from "@/components/MyTeamPanel";
import { PokemonSearch } from "@/components/PokemonSearch";
import { PowerTable } from "@/components/PowerTable";
import { UsageSummary } from "@/components/UsageSummary";
import { calculateBulk } from "@/lib/calc/bulk";
import { calculateMovePower } from "@/lib/calc/power";
import { applyChoiceScarf } from "@/lib/calc/speed";
import { calculateStats } from "@/lib/calc/stats";
import { findItemByKey } from "@/lib/data/itemRepository";
import { findMoveByKey } from "@/lib/data/moveRepository";
import { listMyPokemonSets } from "@/lib/data/myTeamRepository";
import { findNatureByKey } from "@/lib/data/natureRepository";
import { findPokemonByKey, findPokemonByName } from "@/lib/data/pokemonRepository";
import { findUsageByPokeKey } from "@/lib/data/usageRepository";

function evsFromUsage(statPoint: NonNullable<ReturnType<typeof findUsageByPokeKey>>["data"]["stat_points"]["skeletons"][number]) {
  return {
    hp: statPoint.rep_ev.H,
    atk: statPoint.rep_ev.A,
    def: statPoint.rep_ev.B,
    spa: statPoint.rep_ev.C,
    spd: statPoint.rep_ev.D,
    spe: statPoint.rep_ev.S
  };
}

export default function Home() {
  const [query, setQuery] = useState("한카리아스");
  const [opponentKey, setOpponentKey] = useState("0445-00");
  const mySet = listMyPokemonSets()[0];
  const myPokemon = findPokemonByKey(mySet.pokeKey)!;
  const myNature = findNatureByKey(mySet.natureKey);
  const myItem = findItemByKey(mySet.itemKey);

  const opponentPokemon = findPokemonByKey(opponentKey) ?? myPokemon;
  const usage = findUsageByPokeKey(opponentPokemon.pokeKey);
  const opponentNature = findNatureByKey(usage?.data.natures[0]?.key ?? 13);
  const opponentItem = findItemByKey(usage?.data.items[0]?.key);
  const opponentStatPoint = usage?.data.stat_points.skeletons[0];

  const myStats = calculateStats({ baseStats: myPokemon.baseStats, level: mySet.level, evs: mySet.evs, nature: myNature });
  const opponentStats = calculateStats({
    baseStats: opponentPokemon.baseStats,
    level: 50,
    evs: opponentStatPoint ? evsFromUsage(opponentStatPoint) : { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    nature: opponentNature
  });
  const myBulk = calculateBulk(myStats);
  const opponentBulk = calculateBulk(opponentStats);

  const myPowers = useMemo(() => {
    return mySet.moves
      .map(findMoveByKey)
      .filter(Boolean)
      .map((move) => calculateMovePower({ pokemonTypes: myPokemon.types, stats: myStats, move: move!, item: myItem }))
      .filter(Boolean);
  }, [myItem, myPokemon.types, mySet.moves, myStats]);

  const opponentPowers = useMemo(() => {
    return (usage?.data.moves ?? [])
      .slice(0, 10)
      .map((entry) => findMoveByKey(entry.key))
      .filter(Boolean)
      .map((move) => calculateMovePower({ pokemonTypes: opponentPokemon.types, stats: opponentStats, move: move!, item: opponentItem }))
      .filter(Boolean);
  }, [opponentItem, opponentPokemon.types, opponentStats, usage?.data.moves]);

  function handleSearch() {
    const found = findPokemonByName(query);
    if (found) setOpponentKey(found.pokeKey);
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6">
      <PokemonSearch query={query} onQueryChange={setQuery} onSearch={handleSearch} />
      <div className="grid gap-4 md:grid-cols-2">
        <MyTeamPanel set={mySet} pokemon={myPokemon} />
        <UsageSummary pokemon={opponentPokemon} nature={opponentNature} item={opponentItem} statPoint={opponentStatPoint} />
      </div>
      <ComparisonPanel
        mySpeed={myStats.spe}
        opponentSpeed={opponentStats.spe}
        opponentScarfSpeed={applyChoiceScarf(opponentStats.spe)}
        myBulk={myBulk}
        opponentBulk={opponentBulk}
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <PowerTable title="내 공격 기술 결정력" rows={myPowers} targetBulk={opponentBulk.physical} />
        <PowerTable title="상대 공격 기술 결정력" rows={opponentPowers} targetBulk={myBulk.physical} />
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Run app build**

Run: `npm run build`

Expected: Next.js build completes successfully.

- [ ] **Step 4: Commit UI**

Run:

```bash
git add app/page.tsx components
git commit -m "feat: add comparison calculator UI"
```

## Task 6: Manual Verification

**Files:**
- Modify: none unless verification finds a bug.

- [ ] **Step 1: Run tests**

Run: `npm test`

Expected: all tests pass.

- [ ] **Step 2: Run dev server**

Run: `npm run dev`

Expected: local Next.js server starts.

- [ ] **Step 3: Browser checks**

Open the local URL and verify:

- 내 포켓몬 샘플이 처음부터 표시된다.
- 상대 포켓몬 입력 기본값이 `한카리아스`다.
- 검색을 누르면 상대 대표 메타 세트가 표시된다.
- 스텔스록은 상대 공격 기술 결정력 표에 나오지 않는다.
- 지진, 역린, 암석봉인, 스케일샷은 결정력 표에 나온다.
- 내 스피드, 상대 스피드, 상대 스카프 스피드가 표시된다.
- 내 내구와 상대 내구가 표시된다.

- [ ] **Step 4: Commit verification fixes if needed**

If changes were needed, run:

```bash
git add app components lib tests
git commit -m "fix: polish calculator verification issues"
```

## Plan Self-Review

- Spec coverage: PRD, MVP scope, local sample usage, key-based matching, calculation modules, my team sample loading, opponent comparison, and tests are covered.
- Placeholder scan: No implementation step relies on unspecified files or unnamed functions.
- Type consistency: `PokemonMaster`, `MoveMaster`, `ItemMaster`, `NatureMaster`, `PokemonUsage`, `MyPokemonSet`, and calculation result types are defined before use.
