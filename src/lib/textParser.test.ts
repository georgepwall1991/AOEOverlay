import { describe, it, expect } from "vitest";
import { parseTextBuildOrder, parseResourceShorthand, detectAgeMarker } from "./textParser";

describe("textParser", () => {
  describe("basic formats", () => {
    it("parses standard resource/timing format", () => {
      const text = "(6/0/0/0) 00:00: Send 6 to sheep\n(7/0/0/0) 00:20: New villager to sheep";
      const result = parseTextBuildOrder(text);

      expect(result.steps).toHaveLength(2);
      expect(result.steps[0].resources?.food).toBe(6);
      expect(result.steps[0].timing).toBe("00:00");
      expect(result.steps[1].resources?.food).toBe(7);
    });

    it("parses slash format without parentheses", () => {
      const text = "7/3/0/0 2:30 - Build lumber camp";
      const result = parseTextBuildOrder(text);

      expect(result.steps[0].resources).toEqual({
        food: 7,
        wood: 3,
        gold: 0,
        stone: 0,
        villagers: 10,
      });
      expect(result.steps[0].timing).toBe("2:30");
      expect(result.steps[0].description).toBe("Build lumber camp");
    });

    it("handles bullet points and extra whitespace", () => {
      const text = " * 0:45 - Build house\n - 1:15: Villager to gold";
      const result = parseTextBuildOrder(text);

      expect(result.steps[0].timing).toBe("0:45");
      expect(result.steps[0].description).toBe("Build house");
      expect(result.steps[1].timing).toBe("1:15");
      expect(result.steps[1].description).toBe("Villager to gold");
    });

    it("parses line with only resources", () => {
      const text = "8/4/2/0\nNext step: Build barracks";
      const result = parseTextBuildOrder(text);

      expect(result.steps[0].resources?.gold).toBe(2);
      expect(result.steps[0].description).toBe("Update villager distribution");
    });

    it("ignores very short or empty lines", () => {
      const text = "Build order start\n\n\nStep 1: 6 on sheep\nOK";
      const result = parseTextBuildOrder(text);

      expect(result.steps).toHaveLength(2);
      expect(result.steps[0].description).toBe("Build order start");
      // Step prefix is stripped, and IntelligentConverter polishes "6 on sheep"
      expect(result.steps[1].description).toContain("sheep");
    });

    it("parses natural language resource assignments", () => {
      const text = "6 on food, 2 to wood\n3 vills on gold\n12 total vills";
      const result = parseTextBuildOrder(text);

      expect(result.steps[0].resources?.food).toBe(6);
      expect(result.steps[0].resources?.wood).toBe(2);
      expect(result.steps[1].resources?.gold).toBe(3);
      expect(result.steps[2].resources?.villagers).toBe(12);
    });

    it("detects civilization from text", () => {
      const text = "Japanese Fast Castle Guide\n6 on berries...";
      const result = parseTextBuildOrder(text);

      expect(result.civilization).toBe("Japanese");
    });
  });

  describe("resource shorthand formats", () => {
    it("parses uppercase shorthand: F6 W4 G2 S0", () => {
      const text = "F6 W4 G2 S0 - Build barracks";
      const result = parseTextBuildOrder(text);

      expect(result.steps[0].resources?.food).toBe(6);
      expect(result.steps[0].resources?.wood).toBe(4);
      expect(result.steps[0].resources?.gold).toBe(2);
      expect(result.steps[0].resources?.stone).toBe(0);
    });

    it("parses lowercase shorthand: 6f 4w 2g 0s", () => {
      const text = "6f 4w 2g 0s: Build mill";
      const result = parseTextBuildOrder(text);

      expect(result.steps[0].resources?.food).toBe(6);
      expect(result.steps[0].resources?.wood).toBe(4);
      expect(result.steps[0].resources?.gold).toBe(2);
    });

    it("parses mixed case: F6 w4 G2", () => {
      const text = "F6 w4 G2 - Market time";
      const result = parseTextBuildOrder(text);

      expect(result.steps[0].resources?.food).toBe(6);
      expect(result.steps[0].resources?.wood).toBe(4);
      expect(result.steps[0].resources?.gold).toBe(2);
    });

    it("parses partial shorthand: F8 W4", () => {
      const text = "F8 W4 - Early game";
      const result = parseTextBuildOrder(text);

      expect(result.steps[0].resources?.food).toBe(8);
      expect(result.steps[0].resources?.wood).toBe(4);
      expect(result.steps[0].resources?.gold).toBeUndefined();
    });

    it("parses villager shorthand: 10v or 10V", () => {
      const text = "10v - Queue more villagers\n15V - Age up time";
      const result = parseTextBuildOrder(text);

      expect(result.steps[0].resources?.villagers).toBe(10);
      expect(result.steps[1].resources?.villagers).toBe(15);
    });

    it("parses pop shorthand: Pop: 22 or pop 22", () => {
      const text = "Pop: 22 - Start feudal\npop 30 - Castle";
      const result = parseTextBuildOrder(text);

      expect(result.steps[0].resources?.villagers).toBe(22);
      expect(result.steps[1].resources?.villagers).toBe(30);
    });
  });

  describe("age markers", () => {
    it("detects @@Age@@ format (FluffyMaguro style)", () => {
      const text = "@@Dark Age@@\n6 on sheep\n@@Feudal Age@@\nBuild range";
      const result = parseTextBuildOrder(text);

      expect(result.steps[0].description).toContain("Dark Age");
      expect(result.steps[2].description).toContain("Feudal Age");
    });

    it("detects [Age] bracket format", () => {
      const text = "[Dark Age]\n6 on sheep\n[Feudal]\nBuild range";
      const result = parseTextBuildOrder(text);

      expect(result.steps[0].description).toContain("Dark Age");
      expect(result.steps[2].description).toContain("Feudal");
    });

    it("detects --- Age --- separator format", () => {
      const text = "--- Dark Age ---\n6 on sheep\n--- Feudal Age ---\nBuild range";
      const result = parseTextBuildOrder(text);

      expect(result.steps[0].description).toContain("Dark Age");
      expect(result.steps[2].description).toContain("Feudal Age");
    });

    it("detects === AGE UP === format", () => {
      const text = "6 on sheep\n=== AGE UP ===\nBuild landmark";
      const result = parseTextBuildOrder(text);

      expect(result.steps.some((s) => s.description.toLowerCase().includes("age up"))).toBe(true);
    });

    it("detects inline Age up mentions", () => {
      const text = "Age up with Council Hall\nBuild longbows";
      const result = parseTextBuildOrder(text);

      expect(result.steps[0].description).toContain("Age up");
    });
  });

  describe("timing formats", () => {
    it("parses standard mm:ss format", () => {
      const text = "0:45 Build house\n2:30 Age up\n10:00 Push";
      const result = parseTextBuildOrder(text);

      expect(result.steps[0].timing).toBe("0:45");
      expect(result.steps[1].timing).toBe("2:30");
      expect(result.steps[2].timing).toBe("10:00");
    });

    it("parses timing with brackets: [2:30]", () => {
      const text = "[2:30] Build landmark";
      const result = parseTextBuildOrder(text);

      expect(result.steps[0].timing).toBe("2:30");
    });

    it("parses timing with @ prefix: @3:00", () => {
      const text = "@3:00 - Feudal Age reached";
      const result = parseTextBuildOrder(text);

      expect(result.steps[0].timing).toBe("3:00");
    });

    it("handles approximate timing prefix ~", () => {
      const text = "~5:00 - Castle Age";
      const result = parseTextBuildOrder(text);

      // Should extract 5:00, stripping the ~
      expect(result.steps[0].timing).toBe("5:00");
    });
  });

  describe("complex real-world formats", () => {
    it("parses pro player notation", () => {
      const text = `English Longbow Rush by Beasty
[0:00] 6 sheep
[0:20] 1 house -> wood
[0:45] 3 wood
[2:00] 2 gold
[3:00] Age up Council Hall`;
      const result = parseTextBuildOrder(text);

      expect(result.civilization).toBe("English");
      expect(result.steps.length).toBeGreaterThanOrEqual(5);
      // First line is the title without timing, step[1] has first timed step
      expect(result.steps[1].timing).toBe("0:00");
    });

    it("parses numbered steps", () => {
      const text = `1. 6 to sheep
2. Build house
3. 3 to wood
4. Age up`;
      const result = parseTextBuildOrder(text);

      expect(result.steps).toHaveLength(4);
      // Number prefixes should be stripped
      expect(result.steps[0].description).not.toMatch(/^\d+\./);
    });

    it("parses Discord/Reddit copy-paste format", () => {
      const text = `**French Knight Rush**
• 6 food
• 1 builds house → gold
• 3 gold
• 1 wood → builds lumber camp
• Age up School of Cavalry`;
      const result = parseTextBuildOrder(text);

      expect(result.civilization).toBe("French");
      expect(result.steps.length).toBeGreaterThan(0);
    });

    it("handles HTML-like formatting from copy-paste", () => {
      const text = `<b>Build Order</b>
- Send 6 to sheep
- Build house with first new villager
- 3 to wood`;
      const result = parseTextBuildOrder(text);

      expect(result.steps.length).toBeGreaterThanOrEqual(3);
      // HTML tags should be stripped
      expect(result.steps[0].description).not.toContain("<b>");
    });
  });

  describe("edge cases", () => {
    it("handles Windows line endings (CRLF)", () => {
      const text = "6 on sheep\r\n3 on wood\r\nAge up";
      const result = parseTextBuildOrder(text);

      expect(result.steps).toHaveLength(3);
    });

    it("handles mixed line endings", () => {
      const text = "6 on sheep\n3 on wood\r\nAge up\r2 on gold";
      const result = parseTextBuildOrder(text);

      expect(result.steps.length).toBeGreaterThanOrEqual(3);
    });

    it("preserves icon markers if present", () => {
      const text = "[icon:villager] to [icon:sheep]\nBuild [icon:house]";
      const result = parseTextBuildOrder(text);

      expect(result.steps[0].description).toContain("[icon:villager]");
      expect(result.steps[0].description).toContain("[icon:sheep]");
    });

    it("handles Unicode characters", () => {
      const text = "6 → sheep\n3 → wood\n★ Age up";
      const result = parseTextBuildOrder(text);

      expect(result.steps.length).toBeGreaterThanOrEqual(3);
    });

    it("does not crash on extremely long lines", () => {
      const longLine = "Build " + "x".repeat(1000);
      const result = parseTextBuildOrder(longLine);

      expect(result.steps).toHaveLength(1);
    });

    it("handles step number prefixes", () => {
      const text = "Step 1: 6 on sheep\nStep 2: Build house";
      const result = parseTextBuildOrder(text);

      // Step prefix should be removed from description
      expect(result.steps[0].description).not.toMatch(/^Step \d+:/i);
    });
  });
});

describe("parseResourceShorthand", () => {
  it("parses F6 W4 G2 S0 format", () => {
    const result = parseResourceShorthand("F6 W4 G2 S0");
    expect(result).toEqual({ food: 6, wood: 4, gold: 2, stone: 0 });
  });

  it("parses 6f 4w 2g format", () => {
    const result = parseResourceShorthand("6f 4w 2g");
    expect(result).toEqual({ food: 6, wood: 4, gold: 2 });
  });

  it("parses mixed with text", () => {
    const result = parseResourceShorthand("F8 W4 - some description");
    expect(result).toEqual({ food: 8, wood: 4 });
  });

  it("returns null for no match", () => {
    const result = parseResourceShorthand("No resources here");
    expect(result).toBeNull();
  });

  it("parses villager count: 10v", () => {
    const result = parseResourceShorthand("10v F6 W4");
    expect(result?.villagers).toBe(10);
    expect(result?.food).toBe(6);
  });

  it("parses Pop: prefix", () => {
    const result = parseResourceShorthand("Pop: 22");
    expect(result).toEqual({ villagers: 22 });
  });
});

describe("detectAgeMarker", () => {
  it("detects @@Age@@ format", () => {
    expect(detectAgeMarker("@@Dark Age@@")).toBe("Dark Age");
    expect(detectAgeMarker("@@Feudal Age@@")).toBe("Feudal Age");
    expect(detectAgeMarker("@@Castle Age@@")).toBe("Castle Age");
    expect(detectAgeMarker("@@Imperial Age@@")).toBe("Imperial Age");
  });

  it("detects [Age] format", () => {
    expect(detectAgeMarker("[Dark Age]")).toBe("Dark Age");
    expect(detectAgeMarker("[Feudal]")).toBe("Feudal");
  });

  it("detects --- Age --- format", () => {
    expect(detectAgeMarker("--- Dark Age ---")).toBe("Dark Age");
    expect(detectAgeMarker("---Feudal Age---")).toBe("Feudal Age");
  });

  it("detects === AGE UP === format", () => {
    expect(detectAgeMarker("=== AGE UP ===")).toBe("AGE UP");
    expect(detectAgeMarker("===AGE UP===")).toBe("AGE UP");
  });

  it("returns null for non-age text", () => {
    expect(detectAgeMarker("Build house")).toBeNull();
    expect(detectAgeMarker("6 on sheep")).toBeNull();
  });
});
