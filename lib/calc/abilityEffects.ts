import type { AbilityMaster, MoveMaster } from "@/types/master";
import type { BattleStatus, BattleWeather } from "@/types/calc";

const TYPE_CHANGING_ABILITIES: Record<string, { type: string; multiplier: number; onlyNormal: boolean }> = {
  aerilate: { type: "flying", multiplier: 1.2, onlyNormal: true },
  galvanize: { type: "electric", multiplier: 1.2, onlyNormal: true },
  normalize: { type: "normal", multiplier: 1.2, onlyNormal: false },
  pixilate: { type: "fairy", multiplier: 1.2, onlyNormal: true },
  refrigerate: { type: "ice", multiplier: 1.2, onlyNormal: true }
};

const PROTEAN_ABILITIES = new Set(["libero", "protean"]);
const PUNCH_MOVES = new Set(["bulletpunch", "cometpunch", "dizzypunch", "doubleironbash", "drainpunch", "dynamicpunch", "firepunch", "focuspunch", "hammerarm", "headlongrush", "icehammer", "icepunch", "jetpunch", "machpunch", "megapunch", "meteormash", "plasmafists", "poweruppunch", "ragefist", "shadowpunch", "skyuppercut", "surgingstrikes", "thunderpunch", "wickedblow"]);
const PULSE_MOVES = new Set(["aurasphere", "darkpulse", "dragonpulse", "healpulse", "originpulse", "terrainpulse", "waterpulse"]);
const BITE_MOVES = new Set(["bite", "crunch", "firefang", "fishiousrend", "hyperfang", "icefang", "jawlock", "poisonfang", "psychicfangs", "thunderfang"]);
const SLICING_MOVES = new Set(["aquacutter", "aircutter", "airslash", "behemothblade", "bitterblade", "ceaselessedge", "crosspoison", "cut", "furycutter", "kowtowcleave", "leafblade", "mightycleave", "nightslash", "populationbomb", "psyblade", "psychocut", "razorleaf", "razorshell", "razorwind", "sacredsword", "secretssword", "slash", "solarbeam", "solarblade", "stoneaxe", "tachyoncutter", "xscissor"]);
const SOUND_MOVES = new Set(["alluringvoice", "boomburst", "bugbuzz", "chatter", "clangingscales", "clangoroussoulblaze", "disarmingvoice", "echoedvoice", "hypervoice", "overdrive", "psychicnoise", "relicsong", "round", "snarl", "sparklingaria", "uproar"]);
const RECOIL_MOVES = new Set(["bravebird", "doubleedge", "flareblitz", "headcharge", "headsmash", "highjumpkick", "jumpkick", "lightofruin", "submission", "takeheart", "volttackle", "wavecrash", "wildcharge", "woodhammer"]);
const EXTRA_CONTACT_MOVES = new Set([
  "accelerock",
  "anchorshot",
  "armthrust",
  "astonish",
  "avalanche",
  "beatup",
  "behemothbash",
  "bind",
  "blazekick",
  "boltbeak",
  "bounce",
  "branchpoke",
  "brutalswing",
  "bulldoze",
  "bulletseed",
  "circlethrow",
  "collisioncourse",
  "crosschop",
  "crushclaw",
  "dive",
  "doublehit",
  "doublekick",
  "doubleshock",
  "doublewingbeat",
  "dragonhammer",
  "dragonrush",
  "drillrun",
  "dualchop",
  "electrodrift",
  "firstimpression",
  "flail",
  "flamewheel",
  "flareblitz",
  "fly",
  "flyingpress",
  "forcepalm",
  "geargrind",
  "glaiverush",
  "grassyglide",
  "gyroball",
  "highhorsepower",
  "highjumpkick",
  "hornattack",
  "horndrill",
  "icespinner",
  "jumpkick",
  "leechlife",
  "lowkick",
  "metalburst",
  "meteormash",
  "mortalspin",
  "payback",
  "pluck",
  "pursuit",
  "rapidspin",
  "rollout",
  "seismictoss",
  "shadowforce",
  "skydrop",
  "spark",
  "spectralthief",
  "spiritbreak",
  "steelroller",
  "stormthrow",
  "submission",
  "takedown",
  "thousandarrows",
  "thousandwaves",
  "tripleaxel",
  "triplekick",
  "tropkick",
  "visegrip",
  "vitalthrow",
  "wildcharge",
  "woodhammer",
  "wrap"
]);
const CONTACT_MOVES = new Set([
  ...PUNCH_MOVES,
  ...BITE_MOVES,
  ...SLICING_MOVES,
  ...EXTRA_CONTACT_MOVES,
  "acrobatics",
  "aerialace",
  "aquajet",
  "aquastep",
  "assurance",
  "bodypress",
  "bodyslam",
  "brickbreak",
  "closecombat",
  "counter",
  "covet",
  "dragonclaw",
  "dragondarts",
  "dragontail",
  "drillpeck",
  "endeavor",
  "extremespeed",
  "facade",
  "fakeout",
  "falseswipe",
  "feint",
  "flamecharge",
  "flipturn",
  "frustration",
  "gigaimpact",
  "grassknot",
  "heavyslam",
  "hornleech",
  "ironhead",
  "knockoff",
  "lashout",
  "liquidation",
  "lowsweep",
  "megahorn",
  "nuzzle",
  "outrage",
  "playrough",
  "pounce",
  "powerwhip",
  "quickattack",
  "return",
  "reversal",
  "rocksmash",
  "scratch",
  "shadowclaw",
  "skittersmack",
  "slam",
  "stompingtantrum",
  "suckerpunch",
  "superpower",
  "tackle",
  "tailglow",
  "thief",
  "trailblaze",
  "uturn",
  "voltswitch",
  "waterfall",
  "zenheadbutt"
]);
const SECONDARY_EFFECT_MOVES = new Set(["airslash", "ancientpower", "bodypress", "bodyslam", "bugbuzz", "chargebeam", "crunch", "darkpulse", "discharge", "earthpower", "energyball", "extrasensory", "fireblast", "firefang", "flamethrower", "flashcannon", "focusblast", "gunkshot", "heatwave", "hurricane", "icebeam", "icefang", "ironhead", "lavaplume", "liquidation", "moonblast", "muddywater", "nuzzle", "poisonjab", "psychic", "rockslide", "scald", "shadowball", "sludgebomb", "sludgewave", "snarl", "thunder", "thunderbolt", "thunderfang", "waterfall", "zenheadbutt"]);

type AbilityEffectContext = {
  weather?: BattleWeather;
  status?: BattleStatus;
  hpCurrent?: number;
  hpMax?: number;
};

export type AbilityMoveEffect = {
  moveType: string;
  attackerTypes: string[];
  powerMultiplier: number;
  stabMultiplier: number;
  grantsStab: boolean;
  notes: string[];
};

export type DefensiveAbilityEffect = {
  damageMultiplier: number;
  notes: string[];
};

function isLowHp(context?: AbilityEffectContext): boolean {
  if (!context?.hpCurrent || !context.hpMax) return false;
  return context.hpCurrent * 3 <= context.hpMax;
}

function multiply(effect: AbilityMoveEffect, multiplier: number, note: string) {
  effect.powerMultiplier *= multiplier;
  effect.notes.push(note);
}

function multiplyDefense(effect: DefensiveAbilityEffect, multiplier: number, note: string) {
  effect.damageMultiplier *= multiplier;
  effect.notes.push(note);
}

export function getAbilityMoveEffect(move: MoveMaster, attackerTypes: string[], ability?: AbilityMaster, context?: AbilityEffectContext): AbilityMoveEffect {
  const abilityId = ability?.showdownId;
  const baseEffect: AbilityMoveEffect = { moveType: move.type, attackerTypes, powerMultiplier: 1, stabMultiplier: 1.5, grantsStab: false, notes: [] };
  if (!abilityId) {
    return baseEffect;
  }

  const effect: AbilityMoveEffect = { ...baseEffect, notes: [] };

  if (PROTEAN_ABILITIES.has(abilityId)) {
    effect.attackerTypes = [move.type];
    effect.grantsStab = true;
    effect.notes.push(`${ability.koreanName}: 사용 기술 타입으로 자속 적용`);
  }

  const typeChange = TYPE_CHANGING_ABILITIES[abilityId];
  if (typeChange && (!typeChange.onlyNormal || move.type === "normal")) {
    effect.moveType = typeChange.type;
    effect.powerMultiplier *= typeChange.multiplier;
    effect.grantsStab = attackerTypes.includes(typeChange.type);
    effect.notes.push(`${ability.koreanName}: 타입 ${typeChange.type}, 위력 x${typeChange.multiplier}`);
  }

  const moveId = move.showdownId ?? "";

  if (abilityId === "adaptability" && effect.attackerTypes.includes(effect.moveType)) {
    effect.stabMultiplier = 2;
    effect.notes.push("적응력: 자속 x2");
  }
  if (abilityId === "technician" && (move.power ?? 0) <= 60) multiply(effect, 1.5, "테크니션: 위력 60 이하 x1.5");
  if (abilityId === "toughclaws" && CONTACT_MOVES.has(moveId)) multiply(effect, 1.3, "단단한발톱: 접촉기 x1.3");
  if (abilityId === "ironfist" && PUNCH_MOVES.has(moveId) && moveId !== "suckerpunch") multiply(effect, 1.2, "철주먹: 펀치 기술 x1.2");
  if (abilityId === "megalauncher" && PULSE_MOVES.has(moveId)) multiply(effect, 1.5, "메가런처: 파동 기술 x1.5");
  if (abilityId === "sheerforce" && SECONDARY_EFFECT_MOVES.has(moveId)) multiply(effect, 1.3, "우격다짐: 부가효과 기술 x1.3");
  if (abilityId === "reckless" && RECOIL_MOVES.has(moveId)) multiply(effect, 1.2, "이판사판: 반동/실패 반동 기술 x1.2");
  if (abilityId === "strongjaw" && BITE_MOVES.has(moveId)) multiply(effect, 1.5, "옹골찬턱: 물기 기술 x1.5");
  if (abilityId === "sharpness" && SLICING_MOVES.has(moveId)) multiply(effect, 1.5, "예리함: 베기 기술 x1.5");
  if (abilityId === "punkrock" && SOUND_MOVES.has(moveId)) multiply(effect, 1.3, "펑크록: 소리 기술 x1.3");
  if ((abilityId === "steelworker" || abilityId === "steelyspirit") && effect.moveType === "steel") multiply(effect, 1.5, `${ability.koreanName}: 강철 기술 x1.5`);
  if ((abilityId === "dragonsmaw") && effect.moveType === "dragon") multiply(effect, 1.5, "용의턱: 드래곤 기술 x1.5");
  if ((abilityId === "transistor") && effect.moveType === "electric") multiply(effect, 1.5, "트랜지스터: 전기 기술 x1.5");
  if (abilityId === "waterbubble" && effect.moveType === "water") multiply(effect, 2, "수포: 물 기술 x2");
  if (abilityId === "fairyaura" && effect.moveType === "fairy") multiply(effect, 4 / 3, "페어리오라: 페어리 기술 x1.33");
  if (abilityId === "darkaura" && effect.moveType === "dark") multiply(effect, 4 / 3, "다크오라: 악 기술 x1.33");
  if (abilityId === "sandforce" && context?.weather === "sand" && ["ground", "rock", "steel"].includes(effect.moveType)) multiply(effect, 1.3, "모래의힘: 모래바람에서 땅/바위/강철 x1.3");
  if (abilityId === "solarpower" && context?.weather === "sun" && move.category === "special") multiply(effect, 1.5, "선파워: 쾌청에서 특수 기술 x1.5");
  if (abilityId === "blaze" && effect.moveType === "fire" && isLowHp(context)) multiply(effect, 1.5, "맹화: HP 1/3 이하 불꽃 x1.5");
  if (abilityId === "torrent" && effect.moveType === "water" && isLowHp(context)) multiply(effect, 1.5, "급류: HP 1/3 이하 물 x1.5");
  if (abilityId === "overgrow" && effect.moveType === "grass" && isLowHp(context)) multiply(effect, 1.5, "심록: HP 1/3 이하 풀 x1.5");
  if (abilityId === "swarm" && effect.moveType === "bug" && isLowHp(context)) multiply(effect, 1.5, "벌레의알림: HP 1/3 이하 벌레 x1.5");
  if (abilityId === "flareboost" && context?.status === "burn" && move.category === "special") multiply(effect, 1.5, "열폭주: 화상 특수 기술 x1.5");
  if (abilityId === "toxicboost" && (context?.status === "poison" || context?.status === "toxic") && move.category === "physical") multiply(effect, 1.5, "독폭주: 독/맹독 물리 기술 x1.5");
  if (abilityId === "hustle" && move.category === "physical") multiply(effect, 1.5, "의욕: 물리 기술 x1.5");
  if ((abilityId === "hugepower" || abilityId === "purepower") && move.category === "physical") multiply(effect, 2, `${ability.koreanName}: 물리 화력 x2`);

  return effect;
}

export function getDefensiveAbilityEffect(
  move: MoveMaster,
  defenderTypes: string[],
  defenderAbility: AbilityMaster | undefined,
  context: {
    moveType: string;
    typeEffectiveness: number;
    weather?: BattleWeather;
    status?: BattleStatus;
    hpCurrent: number;
    hpMax: number;
  }
): DefensiveAbilityEffect {
  const abilityId = defenderAbility?.showdownId;
  const effect: DefensiveAbilityEffect = { damageMultiplier: 1, notes: [] };
  if (!abilityId) return effect;

  const abilityName = defenderAbility.koreanName;
  const moveId = move.showdownId ?? "";
  const isFullHp = context.hpCurrent >= context.hpMax;
  const isSuperEffective = context.typeEffectiveness > 1;

  if ((abilityId === "multiscale" || abilityId === "shadowshield") && isFullHp) {
    multiplyDefense(effect, 0.5, `${abilityName}: HP 최대라 받는 데미지 x0.5`);
  }
  if (["filter", "solidrock", "prismarmor"].includes(abilityId) && isSuperEffective) {
    multiplyDefense(effect, 0.75, `${abilityName}: 효과 굉장한 기술 데미지 x0.75`);
  }
  if (abilityId === "thickfat" && ["fire", "ice"].includes(context.moveType)) {
    multiplyDefense(effect, 0.5, `${abilityName}: 불꽃/얼음 데미지 x0.5`);
  }
  if (abilityId === "heatproof" && context.moveType === "fire") {
    multiplyDefense(effect, 0.5, `${abilityName}: 불꽃 데미지 x0.5`);
  }
  if (abilityId === "waterbubble" && context.moveType === "fire") {
    multiplyDefense(effect, 0.5, `${abilityName}: 불꽃 데미지 x0.5`);
  }
  if (abilityId === "furcoat" && move.category === "physical") {
    multiplyDefense(effect, 0.5, `${abilityName}: 물리 데미지 x0.5`);
  }
  if (abilityId === "icescales" && move.category === "special") {
    multiplyDefense(effect, 0.5, `${abilityName}: 특수 데미지 x0.5`);
  }
  if (abilityId === "marvelscale" && move.category === "physical" && context.status && context.status !== "none") {
    multiplyDefense(effect, 2 / 3, `${abilityName}: 상태이상이라 물리 데미지 x0.67`);
  }
  if (abilityId === "fluffy") {
    if (CONTACT_MOVES.has(moveId)) multiplyDefense(effect, 0.5, `${abilityName}: 접촉 기술 데미지 x0.5`);
    if (context.moveType === "fire") multiplyDefense(effect, 2, `${abilityName}: 불꽃 데미지 x2`);
  }
  if (abilityId === "punkrock" && SOUND_MOVES.has(moveId)) {
    multiplyDefense(effect, 0.5, `${abilityName}: 소리 기술 데미지 x0.5`);
  }
  if (abilityId === "dryskin" && context.moveType === "fire") {
    multiplyDefense(effect, 1.25, `${abilityName}: 불꽃 데미지 x1.25`);
  }

  return effect;
}
