import type { BulkResult, CalculatedStats } from "@/types/calc";

export function calculateBulk(stats: CalculatedStats): BulkResult {
  return {
    physical: stats.hp * stats.def,
    special: stats.hp * stats.spd
  };
}
