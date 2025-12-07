import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  extractBuildId,
  fetchAoe4WorldBuild,
  importAoe4WorldBuild,
  aoe4worldApi,
  MAX_BUILD_ORDER_STEPS,
} from "./aoe4world";

describe("aoe4world utilities", () => {
  describe("extractBuildId", () => {
    it("extracts ID from full URL with https", () => {
      expect(extractBuildId("https://aoe4world.com/builds/123")).toBe(123);
      expect(extractBuildId("https://aoe4world.com/builds/456")).toBe(456);
    });

    it("extracts ID from URL with slug", () => {
      expect(extractBuildId("https://aoe4world.com/builds/123-my-build-name")).toBe(123);
      expect(
        extractBuildId("https://aoe4world.com/builds/789-english-longbow-rush")
      ).toBe(789);
    });

    it("extracts ID from URL without protocol", () => {
      expect(extractBuildId("aoe4world.com/builds/789")).toBe(789);
      expect(extractBuildId("www.aoe4world.com/builds/999")).toBe(999);
    });

    it("extracts ID from just the number", () => {
      expect(extractBuildId("123")).toBe(123);
      expect(extractBuildId("999999")).toBe(999999);
    });

    it("handles whitespace around input", () => {
      expect(extractBuildId("  123  ")).toBe(123);
      expect(extractBuildId("  https://aoe4world.com/builds/456  ")).toBe(456);
    });

    it("is case insensitive for domain", () => {
      expect(extractBuildId("https://AOE4WORLD.COM/builds/123")).toBe(123);
      expect(extractBuildId("HTTPS://AoE4World.Com/builds/456")).toBe(456);
    });

    it("returns null for invalid input", () => {
      expect(extractBuildId("not a url")).toBeNull();
      expect(extractBuildId("https://example.com")).toBeNull();
      expect(extractBuildId("https://aoe4world.com")).toBeNull();
      expect(extractBuildId("https://aoe4world.com/players/123")).toBeNull();
      expect(extractBuildId("")).toBeNull();
      expect(extractBuildId("abc")).toBeNull();
    });

    it("returns null for URLs without build ID", () => {
      expect(extractBuildId("https://aoe4world.com/builds/")).toBeNull();
      expect(extractBuildId("aoe4world.com/builds/abc")).toBeNull();
    });
  });
});

describe("aoe4world API", () => {
  const mockFetch = vi.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockReset();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("fetchAoe4WorldBuild", () => {
    it("fetches and converts build from API", async () => {
      const mockApiResponse = {
        id: 123,
        title: "English Longbow Rush",
        civilization: "english",
        difficulty: "beginner",
        description: "Fast feudal longbow push",
        author: { name: "TestUser", profile_id: 456 },
        steps: [
          {
            id: 1,
            position: 1,
            description: "Build house",
            time: "0:30",
            food: 50,
            wood: 0,
            gold: 0,
            stone: 0,
          },
          {
            id: 2,
            position: 2,
            description: "Train villager",
            time: "1:00",
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const result = await fetchAoe4WorldBuild(123);

      expect(result.id).toBe("aoe4world-123");
      expect(result.name).toBe("English Longbow Rush");
      expect(result.civilization).toBe("English");
      expect(result.difficulty).toBe("Beginner");
      expect(result.enabled).toBe(true);
      expect(result.steps).toHaveLength(2);
      expect(result.steps[0].description).toBe("Build house");
      expect(result.steps[0].timing).toBe("0:30");
      expect(result.steps[0].resources?.food).toBe(50);
      expect(result.description).toContain("Imported from aoe4world.com");
      expect(result.description).toContain("Author: TestUser");
    });

    it("throws error on 404", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      await expect(fetchAoe4WorldBuild(999)).rejects.toThrow(
        "Build #999 not found on aoe4world.com"
      );
    });

    it("throws error on other HTTP errors", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect(fetchAoe4WorldBuild(124)).rejects.toThrow(
        "Failed to fetch build: 500 Internal Server Error"
      );
    });

    it("throws error when build has no steps", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 125,
          title: "Empty Build",
          civilization: "english",
          steps: [],
        }),
      });

      await expect(fetchAoe4WorldBuild(125)).rejects.toThrow();
    });

    it("throws error when steps array is missing", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 126,
          title: "Missing Steps",
          civilization: "english",
        }),
      });

      await expect(fetchAoe4WorldBuild(126)).rejects.toThrow();
    });

    it("rejects malformed API payloads", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 127,
          title: "Malformed",
          civilization: "english",
          steps: [
            {
              description: "", // invalid: empty description
            },
          ],
        }),
      });

      await expect(fetchAoe4WorldBuild(127)).rejects.toThrow();
    });

    it("handles timing as number (seconds)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 123,
          title: "Test Build",
          civilization: "english",
          steps: [
            {
              id: 1,
              position: 1,
              description: "Test step",
              time: 90, // 1:30 in seconds
            },
          ],
        }),
      });

      const result = await fetchAoe4WorldBuild(123);
      expect(result.steps[0].timing).toBe("1:30");
    });

    it("handles timing as string seconds", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 123,
          title: "Test Build",
          civilization: "english",
          steps: [
            {
              id: 1,
              position: 1,
              description: "Test step",
              time: "120",
            },
          ],
        }),
      });

      const result = await fetchAoe4WorldBuild(123);
      expect(result.steps[0].timing).toBe("2:00");
    });

    it("handles null timing gracefully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 123,
          title: "Test Build",
          civilization: "english",
          steps: [
            {
              id: 1,
              position: 1,
              description: "Test step",
              time: null,
            },
          ],
        }),
      });

      const result = await fetchAoe4WorldBuild(123);
      expect(result.steps[0].timing).toBeUndefined();
    });

    it("normalizes civilization names", async () => {
      const testCases = [
        { input: "french", expected: "French" },
        { input: "hre", expected: "Holy Roman Empire" },
        { input: "holy_roman_empire", expected: "Holy Roman Empire" },
        { input: "delhi", expected: "Delhi Sultanate" },
        { input: "abbasid", expected: "Abbasid Dynasty" },
        { input: "mongols", expected: "Mongols" },
      ];

      for (const { input, expected } of testCases) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 123,
            title: "Test",
            civilization: input,
            steps: [{ id: 1, position: 1, description: "Test" }],
          }),
        });

        const result = await fetchAoe4WorldBuild(123);
        expect(result.civilization).toBe(expected);
      }
    });

    it("logs warning and defaults to English for unknown civilization", async () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 123,
          title: "Test",
          civilization: "unknown_civ",
          steps: [{ id: 1, position: 1, description: "Test" }],
        }),
      });

      const result = await fetchAoe4WorldBuild(123);
      expect(result.civilization).toBe("English");
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown civilization "unknown_civ"')
      );

      consoleWarnSpy.mockRestore();
    });

    it("normalizes difficulty levels", async () => {
      const testCases = [
        { input: "beginner", expected: "Beginner" },
        { input: "easy", expected: "Beginner" },
        { input: "intermediate", expected: "Intermediate" },
        { input: "advanced", expected: "Advanced" },
        { input: "hard", expected: "Advanced" },
        { input: "expert", expected: "Expert" },
        { input: undefined, expected: "Intermediate" },
      ];

      for (const { input, expected } of testCases) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 123,
            title: "Test",
            civilization: "english",
            difficulty: input,
            steps: [{ id: 1, position: 1, description: "Test" }],
          }),
        });

        const result = await fetchAoe4WorldBuild(123);
        expect(result.difficulty).toBe(expected);
      }
    });

    it("only includes non-zero resources", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 123,
          title: "Test",
          civilization: "english",
          steps: [
            {
              id: 1,
              position: 1,
              description: "Test",
              food: 100,
              wood: 0,
              gold: 50,
              stone: 0,
            },
          ],
        }),
      });

      const result = await fetchAoe4WorldBuild(123);
      expect(result.steps[0].resources).toEqual({
        food: 100,
        gold: 50,
      });
    });

    it("uses step position for ID when available", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 123,
          title: "Test",
          civilization: "english",
          steps: [
            { id: 1, position: 5, description: "Test" },
            { id: 2, position: 10, description: "Test 2" },
          ],
        }),
      });

      const result = await fetchAoe4WorldBuild(123);
      expect(result.steps[0].id).toBe("step-5");
      expect(result.steps[1].id).toBe("step-10");
    });

    it("throws error when build exceeds step limit", async () => {
      const steps = Array.from({ length: MAX_BUILD_ORDER_STEPS + 10 }, (_, i) => ({
        id: i + 1,
        position: i + 1,
        description: `Step ${i + 1}`,
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 128,
          title: "Test",
          civilization: "english",
          steps,
        }),
      });

      await expect(fetchAoe4WorldBuild(128)).rejects.toThrow(
        `Build order exceeds maximum of ${MAX_BUILD_ORDER_STEPS} steps`
      );
    });

    it("allows exactly MAX_BUILD_ORDER_STEPS steps", async () => {
      const steps = Array.from({ length: MAX_BUILD_ORDER_STEPS }, (_, i) => ({
        id: i + 1,
        position: i + 1,
        description: `Step ${i + 1}`,
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 123,
          title: "Test",
          civilization: "english",
          steps,
        }),
      });

      const result = await fetchAoe4WorldBuild(123);
      expect(result.steps).toHaveLength(MAX_BUILD_ORDER_STEPS);
    });
  });

  describe("importAoe4WorldBuild", () => {
    it("imports build from URL", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 123,
          title: "Test Build",
          civilization: "french",
          steps: [{ id: 1, position: 1, description: "Test" }],
        }),
      });

      const result = await importAoe4WorldBuild("https://aoe4world.com/builds/123");
      expect(result.id).toBe("aoe4world-123");
      expect(result.civilization).toBe("French");
    });

    it("imports build from just ID", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 456,
          title: "Test Build",
          civilization: "english",
          steps: [{ id: 1, position: 1, description: "Test" }],
        }),
      });

      const result = await importAoe4WorldBuild("456");
      expect(result.id).toBe("aoe4world-456");
    });

    it("throws error on invalid URL", async () => {
      await expect(importAoe4WorldBuild("invalid")).rejects.toThrow(
        "Invalid AoE4World link"
      );
    });

    it("throws error on empty string", async () => {
      await expect(importAoe4WorldBuild("")).rejects.toThrow(
        "Invalid AoE4World link"
      );
    });
  });

  describe("aoe4worldApi class", () => {
    it("searchPlayers makes correct API call", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ players: [] }),
      });

      await aoe4worldApi.searchPlayers("testplayer", 5);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://aoe4world.com/api/v0/players/search?query=testplayer&limit=5",
        expect.objectContaining({
          headers: { Accept: "application/json" },
        })
      );
    });

    it("searchPlayers encodes query parameter", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ players: [] }),
      });

      await aoe4worldApi.searchPlayers("test player");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("query=test%20player"),
        expect.anything()
      );
    });

    it("getPlayer makes correct API call", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ profile_id: 123 }),
      });

      await aoe4worldApi.getPlayer(123);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://aoe4world.com/api/v0/players/123",
        expect.anything()
      );
    });

    it("getPlayerGames builds query params correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games: [] }),
      });

      await aoe4worldApi.getPlayerGames(123, {
        leaderboard: "rm_solo",
        limit: 10,
        offset: 5,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(
          /players\/123\/games\?.*leaderboard=rm_solo.*limit=10.*offset=5/
        ),
        expect.anything()
      );
    });

    it("getPlayerGames works without options", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games: [] }),
      });

      await aoe4worldApi.getPlayerGames(123);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://aoe4world.com/api/v0/players/123/games",
        expect.anything()
      );
    });

    it("getLeaderboard makes correct API call", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await aoe4worldApi.getLeaderboard("rm_team", { limit: 100 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/leaderboards\/rm_team\?limit=100/),
        expect.anything()
      );
    });

    it("getPlayerRank returns rank when found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ rank: 500 }] }),
      });

      const rank = await aoe4worldApi.getPlayerRank(123, "rm_solo");
      expect(rank).toBe(500);
    });

    it("getPlayerRank returns null when not found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const rank = await aoe4worldApi.getPlayerRank(123, "rm_solo");
      expect(rank).toBeNull();
    });

    it("getPlayerRank throws on API error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(aoe4worldApi.getPlayerRank(123, "rm_solo")).rejects.toThrow(
        "Network error"
      );
    });

    it("throws error on API failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect(aoe4worldApi.getPlayer(123)).rejects.toThrow(
        "AoE4World API error: 500 Internal Server Error"
      );
    });
  });
});
