import { describe, expect, it } from "vitest";
import { extractRtsBuildsId } from "./rtsbuilds";

describe("extractRtsBuildsId", () => {
  it("extracts direct RTS Builds API URLs", () => {
    expect(
      extractRtsBuildsId(
        "https://craftysalamander.github.io/rtsbuilds/api/builds/aoe4/aggresivehorsemanarchers.json"
      )
    ).toBe("aggresivehorsemanarchers");
  });

  it("extracts RTS Builds page query links", () => {
    expect(
      extractRtsBuildsId(
        "https://craftysalamander.github.io/rtsbuilds/build_order.html?gameId=aoe4&buildOrderId=ott2tc"
      )
    ).toBe("ott2tc");
  });

  it("derives ids from pasted build names", () => {
    expect(extractRtsBuildsId("Aggresive Horseman & Archers")).toBe(
      "aggresivehorsemanarchers"
    );
  });

  it("rejects non-AoE4 RTS Builds query links", () => {
    expect(
      extractRtsBuildsId(
        "https://craftysalamander.github.io/rtsbuilds/build_order.html?gameId=aoe2&buildOrderId=scouts"
      )
    ).toBeNull();
  });
});
