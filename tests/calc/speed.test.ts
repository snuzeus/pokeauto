import { describe, expect, it } from "vitest";
import { applyChoiceScarf } from "@/lib/calc/speed";

describe("speed helpers", () => {
  it("applies choice scarf multiplier", () => {
    expect(applyChoiceScarf(169)).toBe(253);
  });
});
