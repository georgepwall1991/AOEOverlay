import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  detectBuildSource,
  convertBuildInput,
  BuildSource,
} from "./buildOrderRouter";

describe("buildOrderRouter", () => {
  describe("detectBuildSource", () => {
    describe("aoe4guides detection", () => {
      it("detects aoe4guides.com URLs with https", () => {
        expect(detectBuildSource("https://aoe4guides.com/build/ABC123")).toBe("aoe4guides");
        expect(detectBuildSource("https://www.aoe4guides.com/build/XYZ789")).toBe("aoe4guides");
      });

      it("detects aoe4guides.com URLs without protocol", () => {
        expect(detectBuildSource("aoe4guides.com/build/ABC123")).toBe("aoe4guides");
        expect(detectBuildSource("www.aoe4guides.com/build/XYZ789")).toBe("aoe4guides");
      });

      it("is case insensitive for domain", () => {
        expect(detectBuildSource("https://AOE4GUIDES.COM/build/ABC123")).toBe("aoe4guides");
        expect(detectBuildSource("https://Aoe4Guides.Com/build/ABC123")).toBe("aoe4guides");
      });

      it("detects aoe4guides IDs (alphanumeric 10-30 chars)", () => {
        expect(detectBuildSource("07qM0jShA7USYa8hprgp")).toBe("aoe4guides");
        expect(detectBuildSource("ABC123xyz456789")).toBe("aoe4guides");
      });
    });

    describe("aoe4world detection", () => {
      it("detects aoe4world.com URLs", () => {
        expect(detectBuildSource("https://aoe4world.com/builds/123")).toBe("aoe4world");
        expect(detectBuildSource("https://www.aoe4world.com/builds/456")).toBe("aoe4world");
        expect(detectBuildSource("aoe4world.com/builds/789")).toBe("aoe4world");
      });

      it("detects aoe4world URLs with build name slug", () => {
        expect(detectBuildSource("https://aoe4world.com/builds/123-my-build-name")).toBe("aoe4world");
      });

      it("is case insensitive for domain", () => {
        expect(detectBuildSource("https://AOE4WORLD.COM/builds/123")).toBe("aoe4world");
      });

      it("detects numeric-only IDs as aoe4world", () => {
        expect(detectBuildSource("12345")).toBe("aoe4world");
        expect(detectBuildSource("999999")).toBe("aoe4world");
      });
    });

    describe("age4builder detection", () => {
      it("detects age4builder JSON format", () => {
        const json = JSON.stringify({
          name: "Test Build",
          civilization: "English",
          build_order: [{ notes: ["Test"] }],
        });
        expect(detectBuildSource(json)).toBe("age4builder");
      });

      it("detects age4builder JSON with author and source", () => {
        const json = JSON.stringify({
          name: "Pro Build",
          civilization: "French",
          author: "ProPlayer",
          source: "tournament",
          build_order: [{ age: 1, notes: ["Do stuff"] }],
        });
        expect(detectBuildSource(json)).toBe("age4builder");
      });

      it("handles prettified JSON", () => {
        const json = `{
          "name": "Test Build",
          "civilization": "English",
          "build_order": [{ "notes": ["Test"] }]
        }`;
        expect(detectBuildSource(json)).toBe("age4builder");
      });
    });

    describe("text format detection", () => {
      it("detects plain text build orders", () => {
        const text = `6 to sheep
3 to wood
Age up`;
        expect(detectBuildSource(text)).toBe("text");
      });

      it("detects resource notation format", () => {
        const text = `(6/0/0/0) 0:00 - Send villagers to sheep
(6/3/0/0) 0:45 - Build lumber camp`;
        expect(detectBuildSource(text)).toBe("text");
      });

      it("detects FluffyMaguro style format", () => {
        const text = `@@Dark Age@@
6 on sheep
@@Feudal Age@@
Build archery range`;
        expect(detectBuildSource(text)).toBe("text");
      });

      it("defaults to text for unrecognized input", () => {
        expect(detectBuildSource("random gibberish")).toBe("text");
        expect(detectBuildSource("build house")).toBe("text");
      });
    });

    describe("edge cases", () => {
      it("handles empty string", () => {
        expect(detectBuildSource("")).toBe("text");
      });

      it("handles whitespace-only string", () => {
        expect(detectBuildSource("   \n\t  ")).toBe("text");
      });

      it("handles invalid JSON that looks like JSON", () => {
        expect(detectBuildSource("{not valid json")).toBe("text");
        expect(detectBuildSource('{"incomplete":')).toBe("text");
      });

      it("rejects JSON without build_order array as text", () => {
        const json = JSON.stringify({ name: "Test", civilization: "English" });
        expect(detectBuildSource(json)).toBe("text");
      });

      it("distinguishes between aoe4guides ID and aoe4world numeric ID", () => {
        // Pure numeric = aoe4world
        expect(detectBuildSource("123456")).toBe("aoe4world");
        // Alphanumeric with letters = aoe4guides
        expect(detectBuildSource("ABC123xyz")).toBe("aoe4guides");
      });
    });
  });

  describe("convertBuildInput", () => {
    const mockFetch = vi.fn();
    const originalFetch = global.fetch;

    beforeEach(() => {
      global.fetch = mockFetch;
      mockFetch.mockReset();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it("routes aoe4guides URLs to aoe4guides importer", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "ABC123",
          title: "Test Build",
          civ: "ENG",
          steps: [
            {
              type: "age",
              age: 1,
              gameplan: "",
              steps: [{ description: "Test step" }],
            },
          ],
        }),
      });

      const result = await convertBuildInput("https://aoe4guides.com/build/ABC123");
      expect(result.id).toBe("aoe4guides-ABC123");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("aoe4guides.com"),
        expect.anything()
      );
    });

    it("routes aoe4world URLs to aoe4world importer", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 123,
          title: "Test Build",
          civilization: "english",
          steps: [{ description: "Test step" }],
        }),
      });

      const result = await convertBuildInput("https://aoe4world.com/builds/123");
      expect(result.id).toBe("aoe4world-123");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("aoe4world.com"),
        expect.anything()
      );
    });

    it("routes age4builder JSON to age4builder importer", async () => {
      const json = JSON.stringify({
        name: "Test Build",
        civilization: "English",
        author: "Test",
        source: "test",
        build_order: [
          {
            age: 1,
            population_count: 10,
            villager_count: 9,
            resources: { food: 6, wood: 0, gold: 0, stone: 0 },
            notes: ["Build house"],
          },
        ],
      });

      const result = await convertBuildInput(json);
      expect(result.id).toBe("test-build");
      expect(result.name).toBe("Test Build");
      // No fetch should be called for local JSON
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("routes plain text to text parser", async () => {
      const text = `6 to sheep
3 to wood
Age up with landmark`;

      const result = await convertBuildInput(text);
      expect(result.id).toMatch(/^text-\d+$/);
      expect(result.steps.length).toBeGreaterThan(0);
      // No fetch should be called for text parsing
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("allows overriding auto-detection with explicit source", async () => {
      // This looks like text but we force it to be treated as text
      const input = "Build 123 houses";

      const result = await convertBuildInput(input, { source: "text" });
      expect(result.id).toMatch(/^text-\d+$/);
    });

    it("throws descriptive error for invalid aoe4guides URL", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      await expect(
        convertBuildInput("https://aoe4guides.com/build/nonexistent123")
      ).rejects.toThrow("not found");
    });

    it("throws descriptive error for invalid age4builder JSON", async () => {
      const badJson = JSON.stringify({ name: "Missing fields" });

      await expect(convertBuildInput(badJson, { source: "age4builder" })).rejects.toThrow();
    });
  });

  describe("BuildSource type", () => {
    it("includes all supported sources", () => {
      const sources: BuildSource[] = ["aoe4guides", "aoe4world", "age4builder", "text"];
      expect(sources).toHaveLength(4);
    });
  });
});
