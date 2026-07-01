# Pokemon Champions 메타 계산기

개인용 로컬 Pokemon Champions 보조 계산기입니다. 앱을 열면 내 샘플 포켓몬을 등록/선택하고, 상대 포켓몬의 메타 샘플과 비교해 스피드, 내구, 결정력, 데미지 난수, 몇타 확률을 확인할 수 있습니다.

## 실행

```bash
npm.cmd install
npm.cmd run dev -- --hostname 127.0.0.1 --port 3001
```

브라우저에서 `http://127.0.0.1:3001`을 엽니다.

## 현재 MVP 범위

- 내 포켓몬 샘플 등록과 선택
- 등록 샘플은 브라우저 `localStorage`에 저장
- 상대 포켓몬 검색
- 한카리아스 `0445-00` 로컬 샘플 데이터
- 상위 메타 기술/성격/아이템/Stat Point 기반 상대 대표 세트 계산
- 스피드, 물리 내구, 특수 내구 비교
- 결정력 지표
- 16단계 데미지 난수
- 확정/난수 몇타 확률

## 계산 범위

Champions 스탯 공식은 Pokemon Showdown Champions 계산기에서 확인한 공개 웹 구현을 기준으로 맞췄습니다.

- HP: `base + statPoint + 75`
- HP 외: `floor(natureMultiplier * (base + statPoint + 20))`

데미지 계산은 MVP 범위입니다.

- 싱글 기준
- 레벨 50
- 물리/특수 공격 기술
- STAB
- 일부 타입상성
- 생명의구슬
- 구애머리띠/구애안경
- 16단계 난수
- n타 KO 확률

아직 반영하지 않은 요소:

- 날씨
- 필드
- 랭크 보정
- 특성
- 벽
- 더블 spread 보정
- 모든 타입상성/모든 포켓몬 데이터
- 실제 포케모음 fetch/cache

## 데이터 위치

- `data/master/pokemon.json`
- `data/master/moves.json`
- `data/master/items.json`
- `data/master/natures.json`
- `data/sample/0445-00.json`
- `data/my-team/sample.json`

## 검증

```bash
npm.cmd test
npm.cmd run build
```
