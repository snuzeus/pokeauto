const typeChart: Record<string, Partial<Record<string, number>>> = {
  dragon: {
    dragon: 2,
    steel: 0.5,
    fairy: 0
  },
  ground: {
    fire: 2,
    electric: 2,
    grass: 0.5,
    poison: 2,
    flying: 0,
    bug: 0.5,
    rock: 2,
    steel: 2
  },
  rock: {
    fire: 2,
    ice: 2,
    fighting: 0.5,
    ground: 0.5,
    flying: 2,
    bug: 2,
    steel: 0.5
  }
};

export function getTypeEffectiveness(moveType: string, defenderTypes: string[]): number {
  return defenderTypes.reduce((multiplier, defenderType) => {
    return multiplier * (typeChart[moveType]?.[defenderType] ?? 1);
  }, 1);
}
