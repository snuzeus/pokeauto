# Pokemon Champions 메타 계산기 설계 문서

## 1. PRD

### 목표

개인용 로컬 도구로 사용할 Pokemon Champions 보조 계산기를 만든다. 사용자는 앱을 열자마자 내 포켓몬 샘플 세트를 확인하고, 상대 포켓몬 이름을 검색해 포케모음 계열 사용률 JSON 기반의 대표 메타 세트와 비교할 수 있다.

### 핵심 가치

- 포켓몬 이름을 `pokeKey`로 변환해 로컬 샘플 사용률 데이터를 읽는다.
- 상대 포켓몬의 상위 기술, 아이템, 성격, 노력치 분포를 key 기준으로 매칭한다.
- 변화기/status move를 제외한 공격 기술만 결정력 계산 대상으로 삼는다.
- 내 샘플 세트와 상대 메타 세트의 스피드, 내구, 기술 결정력 지표를 한 화면에서 비교한다.
- 초기 구현은 실제 포케모음 fetch를 하지 않고 `data/sample/0445-00.json` 같은 로컬 JSON으로 동작한다.

### 비목표

- 실시간 화면 감지, 배틀 오버레이, 자동 입력은 MVP에서 제외한다.
- 타입 상성, 랭크, 날씨, 필드, 화상, 특성, 다타수 기대값, 실제 데미지 난수 계산은 MVP에서 제외한다.
- 외부 API fetch와 SQLite 캐시는 인터페이스만 설계하고 구현하지 않는다.

## 2. MVP 기능 명세

### 앱 시작

앱은 시작 시 `data/my-team/sample.json`을 읽어 내 포켓몬 샘플 목록을 표시한다. 사용자는 첫 화면에서 기본 선택된 내 샘플 세트의 실수치, 스피드, 물리 내구, 특수 내구, 기술별 결정력을 볼 수 있다.

### 상대 검색

사용자가 상대 포켓몬 이름을 입력하면 `pokemonRepository`가 한국어, 영어, 일본어 이름 중 하나를 `pokeKey`로 변환한다. MVP에서는 한카리아스 `0445-00`을 우선 지원한다. `usageRepository`는 `data/sample/0445-00.json`을 반환한다.

### 상대 대표 세트 계산

상대 대표 세트는 사용률 1위 성격, 1위 노력치, 1위 아이템을 기본값으로 사용한다. 상위 기술 10개를 표시하되, `MoveMaster.category === "status"`인 기술은 결정력 계산에서 제외한다.

### 비교 결과

비교 화면은 다음 정보를 보여준다.

- 내 포켓몬 기본 세트 요약
- 상대 포켓몬 대표 메타 세트 요약
- 내 스피드와 상대 일반 스피드, 상대 구애스카프 스피드 비교
- 내 물리/특수 내구와 상대 공격 기술 결정력 비교
- 상대 물리/특수 내구와 내 공격 기술 결정력 비교
- 기술별 간단 판정: 결정력이 대상 내구보다 크면 `압박 가능`, 아니면 `참고 지표`

## 3. 데이터 구조와 타입

### Master Data

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

### Usage Data

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
    stat_points: {
      skeletons: UsageStatPoint[];
      raw: unknown[];
      marginals: unknown[];
    };
    updated_at: string;
  };
};
```

### My Team Data

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

## 4. 계산 엔진 설계

계산 모듈은 UI와 분리하고 순수 함수로 작성한다. 2026-07-01 조사 기준, Pokemon Showdown Champions 계산기에는 별도 `calcStatChampions`와 `calculateChampions` 구현이 있다. MVP의 실수치 계산은 이 공개 웹 계산기 구현을 기준으로 맞춘다.

### `lib/calc/stats.ts`

- 입력: 종족값, 레벨, Stat Point, 성격
- 출력: HP, Attack, Defense, Special Attack, Special Defense, Speed 실수치
- HP: `base + statPoint + 75`
- HP 외: `floor(natureMultiplier * (base + statPoint + 20))`
- `base === 1`인 HP는 1로 유지한다.
- `level`은 타입 호환을 위해 입력에 남기되 Champions 공식에서는 직접 사용하지 않는다.

### `lib/calc/power.ts`

초기 결정력 지표 공식:

```text
결정력 = 공격 또는 특공 실수치 × 기술 위력 × STAB × 아이템 보정 × 기타 보정
```

MVP 반영 요소:

- 물리 기술은 `atk`, 특수 기술은 `spa`를 사용한다.
- 포켓몬 타입과 기술 타입이 같으면 STAB 1.5를 적용한다.
- 생명의구슬은 1.3을 적용한다.
- 구애머리띠는 물리 기술에 1.5를 적용한다.
- 구애안경은 특수 기술에 1.5를 적용한다.
- status move와 위력이 없는 기술은 계산 대상에서 제외한다.

### `lib/calc/damage.ts` 예정

상호 몇 타/난수 확률 기능은 단순 결정력 지표가 아니라 실제 데미지 범위 계산이 필요하다. Showdown 웹 계산기는 `calc/mechanics/champions.js`에서 다음 구조로 Champions 데미지를 계산한다.

- `calculateChampions(...)`가 공격자, 방어자, 기술, 필드 조건을 받아 결과를 만든다.
- `calculateBaseDamageChampions(...)`는 기존 본가식 `getBaseDamage(level, basePower, attack, defense)`를 기반으로 한다.
- 최종 데미지는 16개 난수 roll을 순회해 `getFinalDamage(...)`로 만든다.
- Life Orb 같은 최종 보정은 4096 기반 modifier로 처리된다.

따라서 다음 구현 단계에서는 `@smogon/calc` npm 패키지를 바로 쓰지 않는다. npm 최신 배포본 `0.11.0`에는 Champions mechanics가 포함되어 있지 않기 때문이다. 대신 다음 중 하나를 선택한다.

1. Showdown 웹 계산기의 `calc/mechanics/champions.js`와 필요한 util을 프로젝트에 맞게 최소 포팅한다.
2. Showdown 계산기 번들을 oracle로 삼아 fixture를 만들고, MVP 범위의 직접 구현을 검증한다.

초기 MVP는 2번으로 시작한다. 지원 범위는 싱글, 레벨 50, 물리/특수 공격 기술, STAB, 타입 상성, 생명의구슬, 구애류, 16단계 난수, 몇 타 확률이다. 날씨, 필드, 랭크, 특성, 벽, 더블 spread 보정은 후속 단계로 둔다.

### `lib/calc/speed.ts`

- 성격이 스피드 상승이면 1.1, 하락이면 0.9를 적용한다.
- 아이템이 구애스카프면 최종 스피드에 1.5를 적용한다.
- 비교 UI에서는 일반 스피드와 스카프 가정 스피드를 모두 표시한다.

### `lib/calc/bulk.ts`

```text
물리 내구 = HP 실수치 × Defense 실수치
특수 내구 = HP 실수치 × Special Defense 실수치
```

## 5. Next.js 프로젝트 구조

```text
app/
  globals.css
  layout.tsx
  page.tsx
components/
  ComparisonPanel.tsx
  MyTeamPanel.tsx
  PokemonSearch.tsx
  PowerTable.tsx
  StatCard.tsx
  UsageSummary.tsx
data/
  master/
    items.json
    moves.json
    natures.json
    pokemon.json
  my-team/
    sample.json
  sample/
    0445-00.json
lib/
  calc/
    bulk.ts
    power.ts
    speed.ts
    stats.ts
  data/
    itemRepository.ts
    moveRepository.ts
    myTeamRepository.ts
    natureRepository.ts
    pokemonRepository.ts
    usageRepository.ts
  pokemoem/
    client.ts
    parser.ts
types/
  calc.ts
  master.ts
  team.ts
  usage.ts
tests/
  calc/
    bulk.test.ts
    power.test.ts
    speed.test.ts
    stats.test.ts
```

## 6. UI 설계

첫 화면은 랜딩 페이지가 아니라 계산기 자체다. 개인용 도구이므로 정보 밀도와 빠른 비교를 우선한다.

### 상단

- 상대 포켓몬 검색 입력
- 시즌/룰/계산 기준 표시
- 검색 버튼

### 좌측 또는 상단 영역

- 내 포켓몬 샘플 목록
- 선택된 내 샘플의 성격, 노력치, 아이템, 기술

### 결과 영역

- 내 세트와 상대 대표 세트 요약
- 스피드 비교 카드
- 물리/특수 내구 비교 카드
- 내 공격 기술 결정력 테이블
- 상대 공격 기술 결정력 테이블
- 상호 비교 판정 패널

## 7. 테스트 전략

Vitest로 계산 모듈을 먼저 검증한다.

- `stats.test.ts`: 성격 보정과 노력치 반영 실수치 계산
- `speed.test.ts`: 스피드 상승/하락 성격, 구애스카프 보정
- `bulk.test.ts`: HP × 방어, HP × 특방 계산
- `power.test.ts`: STAB, 생명의구슬, 구애머리띠, 구애안경, status move 제외

UI 테스트는 MVP 후순위로 둔다. 첫 구현에서는 계산 모듈의 순수 함수 테스트와 수동 브라우저 확인을 우선한다.

## 8. 구현 순서

1. Next.js, TypeScript, Tailwind, Vitest 기반 프로젝트를 만든다.
2. 타입 파일과 마스터/샘플 JSON을 만든다.
3. repository 계층에서 JSON 데이터를 읽는 함수를 만든다.
4. 계산 모듈과 테스트를 작성한다.
5. 내 샘플 세트 자동 로딩 UI를 만든다.
6. 상대 검색과 대표 메타 세트 계산 UI를 만든다.
7. 비교 패널을 만든다.
8. 테스트와 로컬 브라우저 확인을 수행한다.
