type SeasonPayload = {
  seasons?: Array<{
    season: number;
    rules?: Record<string, { ranking?: boolean }>;
  }>;
};

type SeasonOverrides = {
  season?: number;
  rule?: number;
};

export function selectLatestSinglesSeason(
  payload: SeasonPayload,
  overrides?: SeasonOverrides
): { season: number; rule: number };
