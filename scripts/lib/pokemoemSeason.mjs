const SINGLES_RULE = 10;

export function selectLatestSinglesSeason(payload, overrides = {}) {
  if (Number.isInteger(overrides.season) && Number.isInteger(overrides.rule)) {
    return { season: overrides.season, rule: overrides.rule };
  }

  const latest = (payload.seasons ?? [])
    .filter((entry) => entry?.rules?.[String(SINGLES_RULE)]?.ranking === true)
    .sort((left, right) => right.season - left.season)[0];

  if (!latest) {
    throw new Error("No Pokemoem singles ranking season is available.");
  }

  return { season: latest.season, rule: SINGLES_RULE };
}
