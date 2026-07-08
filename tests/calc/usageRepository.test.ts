import { describe, expect, it } from "vitest";
import { findUsageByPokeKey } from "@/lib/data/usageRepository";

describe("usageRepository item normalization", () => {
  it("maps numeric ZA mega stone usage entries to displayable item names", () => {
    const usage = findUsageByPokeKey("0149-00");

    expect(usage?.data.items[0]).toMatchObject({
      key: 2005,
      name: "망나뇽나이트"
    });
  });

  it("maps split X/Y ZA mega stones by their numeric order", () => {
    const usage = findUsageByPokeKey("0026-00");

    expect(usage?.data.items.slice(0, 2)).toEqual([
      expect.objectContaining({ key: 2013, name: "라이츄나이트Y" }),
      expect.objectContaining({ key: 2012, name: "라이츄나이트X" })
    ]);
  });
});
