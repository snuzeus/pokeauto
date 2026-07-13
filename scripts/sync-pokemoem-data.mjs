import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { selectLatestSinglesSeason } from "./lib/pokemoemSeason.mjs";

const SITE_URL = "https://pokemoem.com/pokedex";
const SITE_ORIGIN = "https://pokemoem.com";
const API_ORIGIN = "https://api.pokemoem.com";
const configuredSeason = process.env.POKEMOEM_SEASON ? Number(process.env.POKEMOEM_SEASON) : undefined;
const configuredRule = process.env.POKEMOEM_RULE ? Number(process.env.POKEMOEM_RULE) : undefined;
let SEASON;
let RULE;
const POKE_KEY_OVERRIDES = {
  "0670-05": "0670-01"
};

const OUTPUTS = {
  pokemon: resolve("data/master/pokemon.json"),
  moves: resolve("data/master/moves.json"),
  items: resolve("data/master/items.json"),
  abilities: resolve("data/master/abilities.json"),
  natures: resolve("data/master/natures.json"),
  learnsets: resolve("data/master/learnsets.json"),
  championsLegal: resolve("data/master/champions-legal.json"),
  usageIndex: resolve("data/sample/index.json")
};

const TYPE_MAP = {
  Bug: "bug",
  Dark: "dark",
  Dragon: "dragon",
  Electric: "electric",
  Fairy: "fairy",
  Fighting: "fighting",
  Fire: "fire",
  Flying: "flying",
  Ghost: "ghost",
  Grass: "grass",
  Ground: "ground",
  Ice: "ice",
  Normal: "normal",
  Poison: "poison",
  Psychic: "psychic",
  Rock: "rock",
  Steel: "steel",
  Water: "water"
};

const STAT_MAP = {
  a: "atk",
  b: "def",
  c: "spa",
  d: "spd",
  s: "spe"
};

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "pokeauto-local-data-sync/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "pokeauto-local-data-sync/1.0",
      origin: SITE_ORIGIN,
      referer: `${SITE_ORIGIN}/`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function findMainAsset(html) {
  const match = html.match(/<script[^>]+type="module"[^>]+src="([^"]+index-[^"]+\.js)"/);
  if (!match) {
    throw new Error("Could not find the Pokemoem app bundle.");
  }

  return new URL(match[1], SITE_ORIGIN).toString();
}

function extractArrayLiteral(source, marker) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) {
    throw new Error(`Could not find marker: ${marker}`);
  }

  const start = markerIndex + marker.length;
  let depth = 0;
  let inString = false;
  let quote = "";
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        inString = false;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      inString = true;
      quote = char;
      continue;
    }

    if (char === "[" || char === "{") {
      depth += 1;
    } else if (char === "]" || char === "}") {
      depth -= 1;
      if (depth === 0 && char === "]") {
        return source.slice(start, index + 1);
      }
    }
  }

  throw new Error(`Could not extract array literal after marker: ${marker}`);
}

function parseArray(source, marker) {
  const literal = extractArrayLiteral(source, marker);
  return Function(`"use strict"; return (${literal});`)();
}

function extractBalancedLiteral(source, start, opening, closing) {
  let depth = 0;
  let inString = false;
  let quote = "";
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        inString = false;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      inString = true;
      quote = char;
      continue;
    }

    if (char === opening) {
      depth += 1;
    } else if (char === closing) {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, index + 1);
      }
    }
  }

  throw new Error(`Could not extract ${opening}${closing} literal at ${start}`);
}

function findAssignmentStartBeforeToken(source, token, literalPrefix) {
  const tokenIndex = source.indexOf(token);
  if (tokenIndex < 0) {
    throw new Error(`Could not find token: ${token}`);
  }

  const assignmentIndex = source.lastIndexOf(literalPrefix, tokenIndex);
  if (assignmentIndex < 0) {
    throw new Error(`Could not find assignment before token: ${token}`);
  }

  return assignmentIndex + 1;
}

function parseArrayBeforeToken(source, token) {
  const start = findAssignmentStartBeforeToken(source, token, "=[{");
  return Function(`"use strict"; return (${extractBalancedLiteral(source, start, "[", "]")});`)();
}

function parseObjectBeforeToken(source, token) {
  const start = findAssignmentStartBeforeToken(source, token, "={");
  return Function(`"use strict"; return (${extractBalancedLiteral(source, start, "{", "}")});`)();
}

function extractObjectLiteral(source, marker) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) {
    throw new Error(`Could not find marker: ${marker}`);
  }

  const start = markerIndex + marker.length;
  let depth = 0;
  let inString = false;
  let quote = "";
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        inString = false;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      inString = true;
      quote = char;
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, index + 1);
      }
    }
  }

  throw new Error(`Could not extract object literal after marker: ${marker}`);
}

function parseObject(source, marker) {
  const literal = extractObjectLiteral(source, marker);
  return Function(`"use strict"; return (${literal});`)();
}

function toPokeKey(entry) {
  const [dexNo = entry.num, formNo = 0] = Array.isArray(entry.formtuple) ? entry.formtuple : [];
  return `${String(dexNo).padStart(4, "0")}-${String(formNo).padStart(2, "0")}`;
}

function toPokeKeyFromFormTuple(formTuple) {
  const [dexNo = 0, formNo = 0] = Array.isArray(formTuple) ? formTuple : [];
  const key = `${String(dexNo).padStart(4, "0")}-${String(formNo).padStart(2, "0")}`;
  return POKE_KEY_OVERRIDES[key] ?? key;
}

function normalizePokemon(entry) {
  const [dexNo = entry.num, formNo = 0] = Array.isArray(entry.formtuple) ? entry.formtuple : [];

  return {
    pokeKey: toPokeKey(entry),
    dexNo,
    formNo,
    koreanName: entry.nameko ?? entry.name,
    japaneseName: entry.nameliberty ?? entry.namenouthuca,
    englishName: entry.name,
    showdownId: entry.index,
    types: (entry.types ?? []).map((type) => TYPE_MAP[type] ?? String(type).toLowerCase()),
    baseStats: {
      hp: entry.basestats.hp,
      atk: entry.basestats.atk,
      def: entry.basestats.def,
      spa: entry.basestats.spa,
      spd: entry.basestats.spd,
      spe: entry.basestats.spe
    },
    abilities: entry.abilities ?? {},
    heightm: entry.heightm ?? null,
    weightkg: entry.weightkg ?? null,
    color: entry.color ?? null,
    tier: entry.tier ?? null,
    isNonstandard: entry.isnonstandard ?? null,
    baseSpecies: entry.basespecies ?? null,
    forme: entry.forme ?? null
  };
}

function normalizeMove(entry) {
  return {
    key: entry.num,
    koreanName: entry.nameko ?? entry.name,
    japaneseName: entry.namejp,
    englishName: entry.name,
    showdownId: entry.index,
    type: TYPE_MAP[entry.type] ?? String(entry.type).toLowerCase(),
    category: String(entry.category).toLowerCase(),
    power: entry.basepower > 0 ? entry.basepower : null,
    accuracy: entry.accuracy === true || entry.accuracy === 1 ? null : entry.accuracy,
    priority: entry.priority ?? 0,
    pp: entry.pp ?? null,
    multihit: entry.multihit ?? null,
    isNonstandard: entry.isnonstandard ?? null,
    isZ: Boolean(entry.isz)
  };
}

function itemEffect(entry) {
  if (entry.index === "lifeorb") return { effectType: "life_orb", multiplier: 1.3 };
  if (entry.index === "choiceband") return { effectType: "choice_band", multiplier: 1.5 };
  if (entry.index === "choicespecs") return { effectType: "choice_specs", multiplier: 1.5 };
  if (entry.index === "choicescarf") return { effectType: "choice_scarf", multiplier: 1.5 };
  return { effectType: "none", multiplier: 1 };
}

function normalizeItem(entry) {
  const effect = itemEffect(entry);

  return {
    key: entry.num,
    koreanName: entry.nameko ?? entry.name,
    japaneseName: entry.namejp,
    englishName: entry.name,
    showdownId: entry.index,
    effectType: effect.effectType,
    multiplier: effect.multiplier
  };
}

function normalizeAbility(entry) {
  return {
    key: entry.num,
    koreanName: entry.nameko ?? entry.name,
    japaneseName: entry.namejp,
    englishName: entry.name,
    showdownId: entry.index,
    rating: entry.rating ?? null,
    description: entry.desc ?? "",
    shortDescription: entry.shortdesc ?? entry.desc ?? ""
  };
}

function normalizeNature(entry) {
  const multipliers = {
    atk: entry.a,
    def: entry.b,
    spa: entry.c,
    spd: entry.d,
    spe: entry.s
  };
  const up = Object.entries(multipliers).find(([, value]) => value > 1)?.[0];
  const down = Object.entries(multipliers).find(([, value]) => value < 1)?.[0];

  return {
    key: entry.num,
    koreanName: entry.nameko,
    japaneseName: entry.namejp,
    englishName: entry.name,
    showdownId: entry.index,
    up: up ? STAT_MAP[up] ?? up : undefined,
    down: down ? STAT_MAP[down] ?? down : undefined
  };
}

function normalizeLearnset(entry) {
  return {
    showdownId: entry.index,
    englishName: entry.name,
    moves: Object.keys(entry.learnset ?? {})
  };
}

function toShowdownId(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findLearnsetForPokemon(pokemon, learnsetById) {
  const direct = learnsetById.get(pokemon.showdownId);
  if (direct?.moves.length) return direct;

  const baseSpecies = pokemon.baseSpecies ? learnsetById.get(toShowdownId(pokemon.baseSpecies)) : undefined;
  if (baseSpecies?.moves.length) return baseSpecies;

  const englishBase = pokemon.englishName?.split("-")[0];
  const englishBaseLearnset = englishBase ? learnsetById.get(toShowdownId(englishBase)) : undefined;
  if (englishBaseLearnset?.moves.length) return englishBaseLearnset;

  return direct ?? baseSpecies ?? englishBaseLearnset;
}

function rankMoveForPokemon(move, pokemon, preferredCategory) {
  const stab = pokemon.types.includes(move.type) ? 1.5 : 1;
  const categoryBonus = move.category === preferredCategory ? 1.25 : 1;
  const power = move.power ?? 0;
  return power * stab * categoryBonus;
}

function fallbackNatureForPokemon(pokemon, natures) {
  const usePhysical = pokemon.baseStats.atk >= pokemon.baseStats.spa;
  const preferred = natures.find((nature) => nature.englishName === (usePhysical ? "Adamant" : "Modest"));
  return preferred ?? natures.find((nature) => nature.englishName === "Hardy") ?? natures[0];
}

function fallbackSpForPokemon(pokemon) {
  const usePhysical = pokemon.baseStats.atk >= pokemon.baseStats.spa;
  const attackKey = usePhysical ? "A" : "C";
  const repEv = { H: 2, A: 0, B: 0, C: 0, D: 0, S: 32 };
  repEv[attackKey] = 32;
  return {
    rank: 1,
    label: `H2/${attackKey}32/S32`,
    raw: [repEv.H, repEv.A, repEv.B, repEv.C, repEv.D, repEv.S].map((value) => value.toString(16).padStart(2, "0")).join("-"),
    pct: 100,
    rep_ev: repEv,
    has_rest: false,
    members: []
  };
}

function fallbackAbilitiesForPokemon(pokemon, abilityByName) {
  return Object.values(pokemon.abilities ?? {})
    .map((name, index) => {
      const ability = abilityByName.get(name) ?? abilityByName.get(toShowdownId(name));
      if (!ability) return undefined;
      return { rank: index + 1, key: ability.key, name: ability.japaneseName ?? ability.koreanName, rate: index === 0 ? 100 : 0 };
    })
    .filter((entry) => entry !== undefined);
}

function createFallbackUsage(pokemon, learnset, moveById, natures, abilityByName) {
  const now = Math.floor(Date.now() / 1000);
  const preferredCategory = pokemon.baseStats.atk >= pokemon.baseStats.spa ? "physical" : "special";
  const fallbackNature = fallbackNatureForPokemon(pokemon, natures);
  const fallbackSp = fallbackSpForPokemon(pokemon);
  const learnsetMoves = (learnset?.moves ?? [])
    .map((moveId) => moveById.get(moveId))
    .filter((move) => move && move.power && move.category !== "status")
    .sort((a, b) => rankMoveForPokemon(b, pokemon, preferredCategory) - rankMoveForPokemon(a, pokemon, preferredCategory));
  const selectedMoves = [];

  for (const move of learnsetMoves) {
    if (selectedMoves.length >= 4) break;
    if (!selectedMoves.some((selected) => selected.key === move.key)) {
      selectedMoves.push(move);
    }
  }

  if (selectedMoves.length < 4) {
    const globalCandidates = [...moveById.values()]
      .filter((move) => move.power && move.power <= 130 && move.category !== "status" && !move.isNonstandard && !move.isZ)
      .sort((a, b) => rankMoveForPokemon(b, pokemon, preferredCategory) - rankMoveForPokemon(a, pokemon, preferredCategory));

    for (const move of globalCandidates) {
      if (selectedMoves.length >= 4) break;
      if (!selectedMoves.some((selected) => selected.key === move.key)) {
        selectedMoves.push(move);
      }
    }
  }

  return {
    season: SEASON,
    rule: RULE,
    poke_key: pokemon.pokeKey,
    version: "champions",
    source: "pokemoem-fallback",
    data: {
      items: [{ rank: 1, key: 0, name: "도구 없음", rate: 100 }],
      abilities: fallbackAbilitiesForPokemon(pokemon, abilityByName),
      natures: fallbackNature ? [{ rank: 1, key: fallbackNature.key, name: fallbackNature.japaneseName ?? fallbackNature.koreanName, rate: 100 }] : [],
      moves: selectedMoves.map((move, index) => ({ rank: index + 1, key: move.key, name: move.japaneseName ?? move.koreanName, rate: 100 })),
      teammates: [],
      battle_teammates: [],
      stat_points: {
        skeletons: [fallbackSp],
        raw: [{ rank: 1, label: fallbackSp.label, raw: fallbackSp.raw, pct: 100, ev: fallbackSp.rep_ev }],
        marginals: []
      },
      win_moves: [],
      lose_moves: [],
      win_pokemons: [],
      lose_pokemons: [],
      mega: [],
      updated_at: new Date().toISOString()
    },
    created: now,
    synced_at: now
  };
}

function normalizeUsageDetail(detail) {
  const now = Math.floor(Date.now() / 1000);

  return {
    season: SEASON,
    rule: RULE,
    poke_key: detail.poke_key,
    version: "champions",
    source: "pokemoem",
    data: {
      items: detail.data?.items ?? [],
      abilities: detail.data?.abilities ?? [],
      natures: detail.data?.natures ?? [],
      moves: detail.data?.moves ?? [],
      teammates: detail.data?.teammates ?? [],
      battle_teammates: detail.data?.battle_teammates ?? [],
      stat_points: detail.data?.stat_points ?? { skeletons: [], raw: [], marginals: [] },
      win_moves: detail.data?.win_moves ?? [],
      lose_moves: detail.data?.lose_moves ?? [],
      win_pokemons: detail.data?.win_pokemons ?? [],
      lose_pokemons: detail.data?.lose_pokemons ?? [],
      mega: detail.data?.mega ?? [],
      updated_at: detail.data?.updated_at ?? new Date().toISOString()
    },
    created: detail.created ?? now,
    synced_at: now
  };
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main() {
  if ((configuredSeason === undefined) !== (configuredRule === undefined)) {
    throw new Error("Set both POKEMOEM_SEASON and POKEMOEM_RULE together, or leave both unset.");
  }

  const seasonsResponse = await fetchJson(`${API_ORIGIN}/champions/battlestat/seasons`);
  const selectedSeason = selectLatestSinglesSeason(seasonsResponse, {
    season: configuredSeason,
    rule: configuredRule
  });
  SEASON = selectedSeason.season;
  RULE = selectedSeason.rule;

  const rankingUrl = `${API_ORIGIN}/champions/battlestat/ranking?season=${SEASON}&rule=${RULE}`;
  const rankingResponse = await fetchJson(rankingUrl);

  const html = await fetchText(SITE_URL);
  const bundleUrl = findMainAsset(html);
  const bundle = await fetchText(bundleUrl);

  const pokemon = parseArrayBeforeToken(bundle, "basestats:")
    .map(normalizePokemon)
    .sort((a, b) => (a.dexNo === b.dexNo ? a.formNo - b.formNo : a.dexNo - b.dexNo));
  const moves = parseArrayBeforeToken(bundle, "basepower:")
    .map(normalizeMove)
    .filter((move) => Number.isFinite(move.key))
    .sort((a, b) => a.key - b.key);
  const items = parseArrayBeforeToken(bundle, "choicescarf")
    .map(normalizeItem)
    .filter((item) => Number.isFinite(item.key))
    .sort((a, b) => a.key - b.key);
  const abilities = parseArrayBeforeToken(bundle, "toughclaws")
    .map(normalizeAbility)
    .filter((ability) => Number.isFinite(ability.key))
    .sort((a, b) => a.key - b.key);
  const natures = parseArrayBeforeToken(bundle, 'name:"Hardy"')
    .map(normalizeNature)
    .sort((a, b) => a.key - b.key);
  const learnsets = parseArrayBeforeToken(bundle, "learnset:{")
    .map(normalizeLearnset)
    .sort((a, b) => a.showdownId.localeCompare(b.showdownId));
  const legalPokemonRules = parseObjectBeforeToken(bundle, "included_formtuples");
  const legalItemRules = parseObjectBeforeToken(bundle, "included:[");
  const championsLegal = {
    season: SEASON,
    rule: RULE,
    regulation: "M-B",
    pokemonKeys: [...new Set((legalPokemonRules.included_formtuples ?? []).map(toPokeKeyFromFormTuple))],
    itemShowdownIds: legalItemRules.included ?? [],
    synced_at: new Date().toISOString()
  };
  const learnsetById = new Map(learnsets.map((learnset) => [learnset.showdownId, learnset]));
  const moveById = new Map(moves.map((move) => [move.showdownId, move]));
  const abilityByName = new Map();
  for (const ability of abilities) {
    if (ability.englishName) abilityByName.set(ability.englishName, ability);
    if (ability.showdownId) abilityByName.set(ability.showdownId, ability);
  }

  const detailsUrl = `${API_ORIGIN}/champions/battlestat/details?season=${SEASON}&rule=${RULE}&top=300`;
  const detailsResponse = await fetchJson(detailsUrl);
  const details = Array.isArray(detailsResponse.details) ? detailsResponse.details : [];
  if (details.length === 0) {
    throw new Error(`No Pokemoem singles usage details are available for season ${SEASON}, rule ${RULE}.`);
  }
  const enrichedDetails = await mapWithConcurrency(details, 8, async (detail) => {
    try {
      const pokemonUrl = `${API_ORIGIN}/champions/battlestat/pokemon/${detail.poke_key}?season=${SEASON}&rule=${RULE}`;
      return await fetchJson(pokemonUrl);
    } catch {
      return detail;
    }
  });
  const usageIndex = {};
  for (const detail of enrichedDetails) {
    const normalized = normalizeUsageDetail(detail);
    const canonicalKey = POKE_KEY_OVERRIDES[normalized.poke_key] ?? normalized.poke_key;
    normalized.poke_key = canonicalKey;
    usageIndex[canonicalKey] = normalized;
  }
  for (const entry of pokemon) {
    if (!usageIndex[entry.pokeKey]) {
      usageIndex[entry.pokeKey] = createFallbackUsage(entry, findLearnsetForPokemon(entry, learnsetById), moveById, natures, abilityByName);
    }
  }

  await writeJson(OUTPUTS.pokemon, pokemon);
  await writeJson(OUTPUTS.moves, moves);
  await writeJson(OUTPUTS.items, items);
  await writeJson(OUTPUTS.abilities, abilities);
  await writeJson(OUTPUTS.natures, natures);
  await writeJson(OUTPUTS.learnsets, learnsets);
  await writeJson(OUTPUTS.championsLegal, championsLegal);
  await writeJson(OUTPUTS.usageIndex, usageIndex);

  console.log(`Bundle: ${bundleUrl}`);
  console.log(`Pokemoem singles season: ${SEASON}, rule: ${RULE}`);
  console.log(`Pokemoem ranking source updated at: ${rankingResponse.source_updated_at ?? "unknown"}`);
  console.log(`Pokemoem ranking entries: ${Array.isArray(rankingResponse.data) ? rankingResponse.data.length : 0}`);
  console.log(`Pokemon: ${pokemon.length}`);
  console.log(`Moves: ${moves.length}`);
  console.log(`Items: ${items.length}`);
  console.log(`Abilities: ${abilities.length}`);
  console.log(`Natures: ${natures.length}`);
  console.log(`Learnsets: ${learnsets.length}`);
  console.log(`Champions legal Pokemon: ${championsLegal.pokemonKeys.length}`);
  console.log(`Champions legal items: ${championsLegal.itemShowdownIds.length}`);
  console.log(`Official usage samples: ${details.length} from ${detailsUrl}`);
  console.log(`Total usage entries with fallback: ${Object.keys(usageIndex).length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
