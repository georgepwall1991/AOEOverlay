import { describe, it, expect, vi } from "vitest";
import {
  convertAge4Builder,
  parseAge4BuilderJson,
  importAge4Builder,
  MAX_BUILD_ORDER_STEPS,
} from "./age4builder";

describe("age4builder utilities", () => {
  describe("parseAge4BuilderJson", () => {
    it("parses valid age4builder JSON", () => {
      const json = JSON.stringify({
        name: "Test Build",
        civilization: "English",
        author: "TestAuthor",
        source: "test",
        build_order: [
          {
            age: 1,
            population_count: 10,
            villager_count: 9,
            resources: { food: 0, wood: 0, gold: 0, stone: 0 },
            notes: ["Build house"],
          },
        ],
      });

      const result = parseAge4BuilderJson(json);
      expect(result.name).toBe("Test Build");
      expect(result.civilization).toBe("English");
      expect(result.build_order).toHaveLength(1);
    });

    it("throws error on invalid JSON syntax", () => {
      expect(() => parseAge4BuilderJson("not json")).toThrow("Invalid JSON");
    });

    it("throws error when input is not an object", () => {
      expect(() => parseAge4BuilderJson('"just a string"')).toThrow(
        "Invalid format: expected an object"
      );
      expect(() => parseAge4BuilderJson("123")).toThrow(
        "Invalid format: expected an object"
      );
      expect(() => parseAge4BuilderJson("null")).toThrow(
        "Invalid format: expected an object"
      );
    });

    it("throws error on missing name field", () => {
      const json = JSON.stringify({
        civilization: "English",
        build_order: [{ notes: ["test"] }],
      });
      expect(() => parseAge4BuilderJson(json)).toThrow(
        'Missing or invalid "name"'
      );
    });

    it("throws error on invalid name type", () => {
      const json = JSON.stringify({
        name: 123,
        civilization: "English",
        build_order: [],
      });
      expect(() => parseAge4BuilderJson(json)).toThrow(
        'Missing or invalid "name"'
      );
    });

    it("throws error on missing civilization field", () => {
      const json = JSON.stringify({
        name: "Test",
        build_order: [{ notes: ["test"] }],
      });
      expect(() => parseAge4BuilderJson(json)).toThrow(
        'Missing or invalid "civilization"'
      );
    });

    it("throws error on missing build_order array", () => {
      const json = JSON.stringify({
        name: "Test",
        civilization: "English",
      });
      expect(() => parseAge4BuilderJson(json)).toThrow(
        'Missing or invalid "build_order"'
      );
    });

    it("throws error on build_order not being an array", () => {
      const json = JSON.stringify({
        name: "Test",
        civilization: "English",
        build_order: "not an array",
      });
      expect(() => parseAge4BuilderJson(json)).toThrow(
        'Missing or invalid "build_order"'
      );
    });

    it("throws error on empty build order", () => {
      const json = JSON.stringify({
        name: "Test",
        civilization: "English",
        build_order: [],
      });
      expect(() => parseAge4BuilderJson(json)).toThrow(
        "Build order has no steps"
      );
    });
  });

  describe("convertAge4Builder", () => {
    it("converts basic build order to overlay format", () => {
      const input = {
        name: "English FC",
        civilization: "English",
        author: "Test",
        source: "age4builder",
        build_order: [
          {
            age: 1,
            population_count: 10,
            villager_count: 9,
            resources: { food: 50, wood: 0, gold: 0, stone: 0 },
            notes: ["Build house"],
          },
        ],
      };

      const result = convertAge4Builder(input);
      expect(result.name).toBe("English FC");
      expect(result.civilization).toBe("English");
      expect(result.enabled).toBe(true);
      expect(result.difficulty).toBe("Intermediate");
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0].description).toBe("Build house");
      expect(result.steps[0].resources?.food).toBe(50);
    });

    it("generates unique step IDs", () => {
      const input = {
        name: "Test",
        civilization: "English",
        author: "",
        source: "",
        build_order: [
          {
            age: 1,
            population_count: 10,
            villager_count: 9,
            resources: { food: -1, wood: -1, gold: -1, stone: -1 },
            notes: ["Step 1", "Step 2", "Step 3"],
          },
        ],
      };

      const result = convertAge4Builder(input);
      expect(result.steps).toHaveLength(3);
      expect(result.steps[0].id).toBe("step-1");
      expect(result.steps[1].id).toBe("step-2");
      expect(result.steps[2].id).toBe("step-3");
    });

    it("generates ID from name", () => {
      const input = {
        name: "English Longbow Rush!",
        civilization: "English",
        author: "",
        source: "",
        build_order: [
          {
            age: 1,
            population_count: 10,
            villager_count: 9,
            resources: { food: -1, wood: -1, gold: -1, stone: -1 },
            notes: ["Test"],
          },
        ],
      };

      const result = convertAge4Builder(input);
      expect(result.id).toBe("english-longbow-rush");
    });

    it("skips empty notes", () => {
      const input = {
        name: "Test",
        civilization: "English",
        author: "",
        source: "",
        build_order: [
          {
            age: 1,
            population_count: 10,
            villager_count: 9,
            resources: { food: -1, wood: -1, gold: -1, stone: -1 },
            notes: ["", "Valid note", "   "],
          },
        ],
      };

      const result = convertAge4Builder(input);
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0].description).toBe("Valid note");
    });

    it("includes resources when they are valid", () => {
      const input = {
        name: "Test",
        civilization: "English",
        author: "",
        source: "",
        build_order: [
          {
            age: 1,
            population_count: 10,
            villager_count: 9,
            resources: { food: 100, wood: 50, gold: 25, stone: 0 },
            notes: ["Test"],
          },
        ],
      };

      const result = convertAge4Builder(input);
      expect(result.steps[0].resources).toEqual({
        food: 100,
        wood: 50,
        gold: 25,
        stone: 0,
      });
    });

    it("excludes resources when all are -1", () => {
      const input = {
        name: "Test",
        civilization: "English",
        author: "",
        source: "",
        build_order: [
          {
            age: 1,
            population_count: 10,
            villager_count: 9,
            resources: { food: -1, wood: -1, gold: -1, stone: -1 },
            notes: ["Test"],
          },
        ],
      };

      const result = convertAge4Builder(input);
      expect(result.steps[0].resources).toBeUndefined();
    });

    it("clamps negative resources to 0", () => {
      const input = {
        name: "Test",
        civilization: "English",
        author: "",
        source: "",
        build_order: [
          {
            age: 1,
            population_count: 10,
            villager_count: 9,
            resources: { food: 50, wood: -10, gold: 0, stone: -1 },
            notes: ["Test"],
          },
        ],
      };

      const result = convertAge4Builder(input);
      expect(result.steps[0].resources).toEqual({
        food: 50,
        wood: 0,
        gold: 0,
        stone: 0,
      });
    });

    it("builds description from author and source", () => {
      const input = {
        name: "Test",
        civilization: "English",
        author: "ProPlayer",
        source: "tournament",
        build_order: [
          {
            age: 1,
            population_count: 10,
            villager_count: 9,
            resources: { food: -1, wood: -1, gold: -1, stone: -1 },
            notes: ["Test"],
          },
        ],
      };

      const result = convertAge4Builder(input);
      expect(result.description).toContain("Imported from age4builder.com");
      expect(result.description).toContain("Author: ProPlayer");
      expect(result.description).toContain("Source: tournament");
    });

    it("excludes anonymous author from description", () => {
      const input = {
        name: "Test",
        civilization: "English",
        author: "Anonymous",
        source: "test",
        build_order: [
          {
            age: 1,
            population_count: 10,
            villager_count: 9,
            resources: { food: -1, wood: -1, gold: -1, stone: -1 },
            notes: ["Test"],
          },
        ],
      };

      const result = convertAge4Builder(input);
      expect(result.description).not.toContain("Author:");
    });

    it("excludes unknown source from description", () => {
      const input = {
        name: "Test",
        civilization: "English",
        author: "Test",
        source: "unknown",
        build_order: [
          {
            age: 1,
            population_count: 10,
            villager_count: 9,
            resources: { food: -1, wood: -1, gold: -1, stone: -1 },
            notes: ["Test"],
          },
        ],
      };

      const result = convertAge4Builder(input);
      expect(result.description).not.toContain("Source:");
    });

    it("converts icon syntax in notes", () => {
      const input = {
        name: "Test",
        civilization: "English",
        author: "",
        source: "",
        build_order: [
          {
            age: 1,
            population_count: 10,
            villager_count: 9,
            resources: { food: -1, wood: -1, gold: -1, stone: -1 },
            notes: ["Build @building_economy/house.png@"],
          },
        ],
      };

      const result = convertAge4Builder(input);
      expect(result.steps[0].description).toContain("[icon:house]");
    });

    it("handles multiple icons in single note", () => {
      const input = {
        name: "Test",
        civilization: "English",
        author: "",
        source: "",
        build_order: [
          {
            age: 1,
            population_count: 10,
            villager_count: 9,
            resources: { food: -1, wood: -1, gold: -1, stone: -1 },
            notes: [
              "Train @unit_worker/villager.png@ at @building_economy/town-center.png@",
            ],
          },
        ],
      };

      const result = convertAge4Builder(input);
      expect(result.steps[0].description).toContain("[icon:villager]");
      expect(result.steps[0].description).toContain("[icon:town_center]");
    });

    it("converts landmark icons to feudal_age", () => {
      const input = {
        name: "Test",
        civilization: "French",
        author: "",
        source: "",
        build_order: [
          {
            age: 1,
            population_count: 10,
            villager_count: 9,
            resources: { food: -1, wood: -1, gold: -1, stone: -1 },
            notes: ["Build @landmark_french/chamber-of-commerce.png@"],
          },
        ],
      };

      const result = convertAge4Builder(input);
      expect(result.steps[0].description).toContain("[icon:feudal_age]");
    });

    it("converts resource icons", () => {
      const input = {
        name: "Test",
        civilization: "English",
        author: "",
        source: "",
        build_order: [
          {
            age: 1,
            population_count: 10,
            villager_count: 9,
            resources: { food: -1, wood: -1, gold: -1, stone: -1 },
            notes: [
              "Gather @resource/food.png@ and @resource/wood.png@",
              "Mine @resource/gold.png@ and @resource/stone.png@",
            ],
          },
        ],
      };

      const result = convertAge4Builder(input);
      expect(result.steps[0].description).toContain("[icon:food]");
      expect(result.steps[0].description).toContain("[icon:wood]");
      expect(result.steps[1].description).toContain("[icon:gold]");
      expect(result.steps[1].description).toContain("[icon:stone]");
    });

    it("converts military building icons", () => {
      const input = {
        name: "Test",
        civilization: "English",
        author: "",
        source: "",
        build_order: [
          {
            age: 1,
            population_count: 10,
            villager_count: 9,
            resources: { food: -1, wood: -1, gold: -1, stone: -1 },
            notes: [
              "Build @building_military/barracks.png@",
              "Build @building_military/archery-range.png@",
              "Build @building_military/stable.png@",
            ],
          },
        ],
      };

      const result = convertAge4Builder(input);
      expect(result.steps[0].description).toContain("[icon:barracks]");
      expect(result.steps[1].description).toContain("[icon:archery_range]");
      expect(result.steps[2].description).toContain("[icon:stable]");
    });

    it("converts economy building icons", () => {
      const input = {
        name: "Test",
        civilization: "English",
        author: "",
        source: "",
        build_order: [
          {
            age: 1,
            population_count: 10,
            villager_count: 9,
            resources: { food: -1, wood: -1, gold: -1, stone: -1 },
            notes: [
              "Build @building_economy/mill.png@",
              "Build @building_economy/lumber-camp.png@",
              "Build @building_economy/mining-camp.png@",
            ],
          },
        ],
      };

      const result = convertAge4Builder(input);
      expect(result.steps[0].description).toContain("[icon:mill]");
      expect(result.steps[1].description).toContain("[icon:lumber_camp]");
      expect(result.steps[2].description).toContain("[icon:mining_camp]");
    });

    it("handles unknown icon paths with console warning", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const input = {
        name: "Test",
        civilization: "English",
        author: "",
        source: "",
        build_order: [
          {
            age: 1,
            population_count: 10,
            villager_count: 9,
            resources: { food: -1, wood: -1, gold: -1, stone: -1 },
            notes: ["Build @unknown_category/mystery-building.png@"],
          },
        ],
      };

      const result = convertAge4Builder(input);
      expect(result.steps[0].description).toContain("[icon:mystery_building]");
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it("converts age icons", () => {
      const input = {
        name: "Test",
        civilization: "English",
        author: "",
        source: "",
        build_order: [
          {
            age: 1,
            population_count: 10,
            villager_count: 9,
            resources: { food: -1, wood: -1, gold: -1, stone: -1 },
            notes: [
              "Start in @age/age_1.png@",
              "Advance to @age/age_2.png@",
            ],
          },
        ],
      };

      const result = convertAge4Builder(input);
      expect(result.steps[0].description).toContain("[icon:dark_age]");
      expect(result.steps[1].description).toContain("[icon:feudal_age]");
    });

    it("capitalizes first letter of description", () => {
      const input = {
        name: "Test",
        civilization: "English",
        author: "",
        source: "",
        build_order: [
          {
            age: 1,
            population_count: 10,
            villager_count: 9,
            resources: { food: -1, wood: -1, gold: -1, stone: -1 },
            notes: ["build a house"],
          },
        ],
      };

      const result = convertAge4Builder(input);
      expect(result.steps[0].description).toBe("Build a house");
    });

    it("estimates timing for steps", () => {
      const input = {
        name: "Test",
        civilization: "English",
        author: "",
        source: "",
        build_order: [
          {
            age: 1,
            population_count: 10,
            villager_count: 9,
            resources: { food: -1, wood: -1, gold: -1, stone: -1 },
            notes: ["Step 1", "Step 2", "Step 3"],
          },
        ],
      };

      const result = convertAge4Builder(input);
      expect(result.steps[0].timing).toBe("0:00");
      expect(result.steps[1].timing).toBe("0:30");
      expect(result.steps[2].timing).toBe("1:00");
    });

    it("handles multiple steps from different ages", () => {
      const input = {
        name: "Test",
        civilization: "English",
        author: "",
        source: "",
        build_order: [
          {
            age: 1,
            population_count: 10,
            villager_count: 9,
            resources: { food: 100, wood: 0, gold: 0, stone: 0 },
            notes: ["Dark Age step"],
          },
          {
            age: 2,
            population_count: 20,
            villager_count: 19,
            resources: { food: 200, wood: 100, gold: 50, stone: 0 },
            notes: ["Feudal Age step"],
          },
        ],
      };

      const result = convertAge4Builder(input);
      expect(result.steps).toHaveLength(2);
      expect(result.steps[0].description).toBe("Dark Age step");
      expect(result.steps[1].description).toBe("Feudal Age step");
    });

    it("throws error when build order exceeds step limit", () => {
      // Create a build order with more than MAX_BUILD_ORDER_STEPS
      const notes = Array.from(
        { length: MAX_BUILD_ORDER_STEPS + 10 },
        (_, i) => `Step ${i + 1}`
      );
      const input = {
        name: "Test",
        civilization: "English",
        author: "",
        source: "",
        build_order: [
          {
            age: 1,
            population_count: 10,
            villager_count: 9,
            resources: { food: -1, wood: -1, gold: -1, stone: -1 },
            notes,
          },
        ],
      };

      expect(() => convertAge4Builder(input)).toThrow(
        `Build order exceeds maximum of ${MAX_BUILD_ORDER_STEPS} steps`
      );
    });

    it("allows exactly MAX_BUILD_ORDER_STEPS steps", () => {
      const notes = Array.from(
        { length: MAX_BUILD_ORDER_STEPS },
        (_, i) => `Step ${i + 1}`
      );
      const input = {
        name: "Test",
        civilization: "English",
        author: "",
        source: "",
        build_order: [
          {
            age: 1,
            population_count: 10,
            villager_count: 9,
            resources: { food: -1, wood: -1, gold: -1, stone: -1 },
            notes,
          },
        ],
      };

      const result = convertAge4Builder(input);
      expect(result.steps).toHaveLength(MAX_BUILD_ORDER_STEPS);
    });
  });

  describe("importAge4Builder", () => {
    it("parses and converts valid JSON", () => {
      const json = JSON.stringify({
        name: "Test Build",
        civilization: "French",
        author: "Test",
        source: "test",
        build_order: [
          {
            age: 1,
            population_count: 10,
            villager_count: 9,
            resources: { food: 0, wood: 0, gold: 0, stone: 0 },
            notes: ["Test step"],
          },
        ],
      });

      const result = importAge4Builder(json);
      expect(result.name).toBe("Test Build");
      expect(result.civilization).toBe("French");
      expect(result.steps).toHaveLength(1);
    });

    it("throws error for invalid JSON", () => {
      expect(() => importAge4Builder("not valid json")).toThrow();
    });

    it("throws error for missing required fields", () => {
      expect(() => importAge4Builder('{"invalid": true}')).toThrow();
    });
  });
});
