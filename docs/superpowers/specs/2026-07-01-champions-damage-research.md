# Champions 데미지 계산 조사 메모

## 결론

`@smogon/calc@0.11.0` npm 패키지는 Champions mechanics를 포함하지 않는다. 로컬 설치 후 `node_modules/@smogon/calc`에서 `champ`, `Champion`, `Base SPs`, `Stat Points`를 검색했지만 Champions 전용 구현은 발견되지 않았다.

반면 Pokemon Showdown 웹 계산기 `https://calc.pokemonshowdown.com/champions.html?mode=champions`는 다음 파일을 로드한다.

- `calc/stats.js`
- `calc/mechanics/champions.js`
- `js/data/sets/champions.js`

따라서 Champions 계산은 npm 패키지 배포본이 아니라 Showdown 웹 계산기 쪽 별도 번들에 들어있다.

## 확인한 스탯 공식

Showdown `calc/stats.js`의 `calcStatChampions` 기준:

```ts
if (stat === "hp") {
  return base === 1 ? base : base + sp + 75;
}

const natureMultiplier =
  nature.plus === stat && nature.minus === stat ? 1 :
  nature.plus === stat ? 1.1 :
  nature.minus === stat ? 0.9 :
  1;

return Math.floor(natureMultiplier * (base + sp + 20));
```

우리 `lib/calc/stats.ts`는 이 공식으로 맞춘다.

## 확인한 데미지 계산 구조

Showdown `calc/mechanics/champions.js`의 `calculateChampions`는 다음 순서로 동작한다.

1. 날씨, 아이템, 스탯 변경, Intimidate 등 전처리
2. 기술 타입/분류/특수 케이스 처리
3. 타입 상성 계산
4. 고정 데미지 기술 처리
5. `calculateBasePowerChampions`
6. `calculateAttackChampions`
7. `calculateDefenseChampions`
8. `calculateBaseDamageChampions`
9. STAB, burn, final modifier 계산
10. 16단계 난수 roll을 순회하며 최종 데미지 배열 생성

`calculateBaseDamageChampions`는 기존 본가식 `getBaseDamage(attacker.level, basePower, attack, defense)`를 기반으로 하고, spread, Parental Bond, 날씨, 급소 등을 추가 반영한다.

## 구현 방향

바로 전체 Showdown mechanics를 포팅하지 않는다. MVP에서는 다음 제한 범위로 `lib/calc/damage.ts`를 만든다.

- 싱글 배틀
- 레벨 50
- 물리/특수 공격 기술
- STAB
- 타입 상성
- Life Orb
- Choice Band / Choice Specs
- 16단계 난수 roll
- n타 KO 확률

이후 Showdown Champions 계산기 결과를 fixture로 저장해 우리 결과와 비교한다.
