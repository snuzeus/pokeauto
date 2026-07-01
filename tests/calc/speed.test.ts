import { describe, expect, it } from "vitest";
import { applyChoiceScarf } from "@/lib/calc/speed";

describe("speed helpers", () => {
  it("applies choice scarf multiplier", () => {
    expect(applyChoiceScarf(122)).toBe(183);
  });
});
