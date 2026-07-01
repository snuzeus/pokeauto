import { describe, expect, it } from "vitest";
import { calculateBulk } from "@/lib/calc/bulk";

describe("calculateBulk", () => {
  it("calculates physical and special bulk", () => {
    expect(calculateBulk({ hp: 168, atk: 139, def: 100, spa: 76, spd: 90, spe: 125 })).toEqual({
      physical: 16800,
      special: 15120
    });
  });
});
