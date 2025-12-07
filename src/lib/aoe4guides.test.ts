import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  extractAoe4GuidesId,
  fetchAoe4GuidesBuild,
  importAoe4GuidesBuild,
  browseAoe4GuidesBuilds,
  getCivNameFromCode,
} from "./aoe4guides";

describe("aoe4guides utilities", () => {
  describe("extractAoe4GuidesId", () => {
    it("extracts ID from full URL with https", () => {
      expect(extractAoe4GuidesId("https://aoe4guides.com/build/ABC123xyz")).toBe("ABC123xyz");
      expect(extractAoe4GuidesId("https://aoe4guides.com/build/07qM0jShA7USYa8hprgp")).toBe(
        "07qM0jShA7USYa8hprgp"
      );
    });

    it("extracts ID from URL without protocol", () => {
      expect(extractAoe4GuidesId("aoe4guides.com/build/ABC123xyz")).toBe("ABC123xyz");
      expect(extractAoe4GuidesId("www.aoe4guides.com/build/ABC123xyz")).toBe("ABC123xyz");
    });

    it("extracts ID when just the ID is provided", () => {
      expect(extractAoe4GuidesId("07qM0jShA7USYa8hprgp")).toBe("07qM0jShA7USYa8hprgp");
      expect(extractAoe4GuidesId("ABC123xyz456")).toBe("ABC123xyz456");
    });

    it("handles whitespace around input", () => {
      expect(extractAoe4GuidesId("  ABC123xyz456  ")).toBe("ABC123xyz456");
      expect(extractAoe4GuidesId("  https://aoe4guides.com/build/ABC123  ")).toBe("ABC123");
    });

    it("is case insensitive for domain", () => {
      expect(extractAoe4GuidesId("https://AOE4GUIDES.COM/build/ABC123")).toBe("ABC123");
      expect(extractAoe4GuidesId("HTTPS://AoE4Guides.Com/build/xyz456")).toBe("xyz456");
    });

    it("returns null for invalid input", () => {
      expect(extractAoe4GuidesId("not a url")).toBeNull();
      expect(extractAoe4GuidesId("https://example.com")).toBeNull();
      expect(extractAoe4GuidesId("https://aoe4guides.com")).toBeNull();
      expect(extractAoe4GuidesId("")).toBeNull();
      expect(extractAoe4GuidesId("abc")).toBeNull(); // Too short
    });

    it("returns null for IDs that are too short", () => {
      expect(extractAoe4GuidesId("ABC")).toBeNull();
      expect(extractAoe4GuidesId("12345")).toBeNull();
    });
  });

  describe("getCivNameFromCode", () => {
    it("maps standard civilization codes", () => {
      expect(getCivNameFromCode("ENG")).toBe("English");
      expect(getCivNameFromCode("FRE")).toBe("French");
      expect(getCivNameFromCode("HRE")).toBe("Holy Roman Empire");
      expect(getCivNameFromCode("RUS")).toBe("Rus");
      expect(getCivNameFromCode("CHI")).toBe("Chinese");
      expect(getCivNameFromCode("DEL")).toBe("Delhi Sultanate");
      expect(getCivNameFromCode("ABB")).toBe("Abbasid Dynasty");
      expect(getCivNameFromCode("MON")).toBe("Mongols");
      expect(getCivNameFromCode("OTT")).toBe("Ottomans");
      expect(getCivNameFromCode("MAL")).toBe("Malians");
      expect(getCivNameFromCode("BYZ")).toBe("Byzantines");
      expect(getCivNameFromCode("JAP")).toBe("Japanese");
    });

    it("maps variant civilization codes", () => {
      expect(getCivNameFromCode("JDA")).toBe("Jeanne d'Arc");
      expect(getCivNameFromCode("AYY")).toBe("Ayyubids");
      expect(getCivNameFromCode("ZXL")).toBe("Zhu Xi's Legacy");
      expect(getCivNameFromCode("DRA")).toBe("Order of the Dragon");
    });

    it("maps Dynasties of the East DLC civilization codes", () => {
      expect(getCivNameFromCode("GHO")).toBe("Golden Horde");
      expect(getCivNameFromCode("MAC")).toBe("Macedonian Dynasty");
      expect(getCivNameFromCode("SEN")).toBe("Sengoku Daimyo");
      expect(getCivNameFromCode("TUG")).toBe("Tughlaq Dynasty");
    });

    it("is case insensitive", () => {
      expect(getCivNameFromCode("eng")).toBe("English");
      expect(getCivNameFromCode("Eng")).toBe("English");
      expect(getCivNameFromCode("jap")).toBe("Japanese");
    });

    it("returns original code for unknown codes", () => {
      expect(getCivNameFromCode("UNKNOWN")).toBe("UNKNOWN");
      expect(getCivNameFromCode("XYZ")).toBe("XYZ");
    });
  });
});

describe("aoe4guides API", () => {
  const mockFetch = vi.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockReset();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("fetchAoe4GuidesBuild", () => {
    it("fetches and converts build from API", async () => {
      const mockApiResponse = {
        id: "ABC123",
        title: "English Fast Castle",
        description: "Quick castle age timing",
        author: "TestUser",
        authorUid: "user123",
        civ: "ENG",
        strategy: "Fast Castle",
        season: "Season 7",
        map: "Any",
        video: "",
        views: 100,
        likes: 10,
        upvotes: 5,
        downvotes: 0,
        score: 5,
        scoreAllTime: 50,
        timeCreated: { _seconds: 1700000000, _nanoseconds: 0 },
        timeUpdated: { _seconds: 1700000000, _nanoseconds: 0 },
        isDraft: false,
        steps: [
          {
            type: "age",
            age: 1,
            gameplan: "Build economy",
            steps: [
              { description: "Build house", food: "6", wood: "0" },
              { description: "Send villagers to food", food: "6", wood: "0" },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const result = await fetchAoe4GuidesBuild("ABC123");

      expect(result.id).toBe("aoe4guides-ABC123");
      expect(result.name).toBe("English Fast Castle");
      expect(result.civilization).toBe("English");
      expect(result.difficulty).toBe("Intermediate"); // Fast Castle strategy
      expect(result.enabled).toBe(true);
      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.description).toContain("aoe4guides.com");
      expect(result.description).toContain("TestUser");
    });

    it("normalizes civilization codes correctly", async () => {
      const testCases = [
        { code: "ENG", expected: "English" },
        { code: "FRE", expected: "French" },
        { code: "HRE", expected: "Holy Roman Empire" },
        { code: "JAP", expected: "Japanese" },
        { code: "BYZ", expected: "Byzantines" },
        { code: "GHO", expected: "Golden Horde" },
      ];

      for (const { code, expected } of testCases) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: "test",
            title: "Test Build",
            civ: code,
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

        const result = await fetchAoe4GuidesBuild("test");
        expect(result.civilization).toBe(expected);
      }
    });

    it("maps strategy to difficulty", async () => {
      const testCases = [
        { strategy: "Rush", expected: "Intermediate" },
        { strategy: "Boom", expected: "Beginner" },
        { strategy: "All-in", expected: "Advanced" },
        { strategy: "Cheese", expected: "Expert" },
        { strategy: undefined, expected: "Intermediate" },
      ];

      for (const { strategy, expected } of testCases) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: "test",
            title: "Test",
            civ: "ENG",
            strategy,
            steps: [
              {
                type: "age",
                age: 1,
                gameplan: "",
                steps: [{ description: "Test" }],
              },
            ],
          }),
        });

        const result = await fetchAoe4GuidesBuild("test");
        expect(result.difficulty).toBe(expected);
      }
    });

    it("converts resources from strings to numbers", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "test",
          title: "Test",
          civ: "ENG",
          steps: [
            {
              type: "age",
              age: 1,
              gameplan: "",
              steps: [
                {
                  description: "Gather resources",
                  food: "100",
                  wood: "50",
                  gold: "0",
                  stone: "25",
                },
              ],
            },
          ],
        }),
      });

      const result = await fetchAoe4GuidesBuild("test");
      const step = result.steps.find((s) => s.resources);

      expect(step?.resources).toBeDefined();
      expect(step?.resources?.food).toBe(100);
      expect(step?.resources?.wood).toBe(50);
      expect(step?.resources?.gold).toBeUndefined(); // 0 should be filtered out
      expect(step?.resources?.stone).toBe(25);
    });

    it("handles age-up phases correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "test",
          title: "Test",
          civ: "ENG",
          steps: [
            {
              type: "age",
              age: 1,
              gameplan: "Build economy",
              steps: [{ description: "Step 1" }],
            },
            {
              type: "ageUp",
              age: 1, // Age up from 1 to 2
              gameplan: "Age up timing",
              steps: [{ description: "Build landmark" }],
            },
          ],
        }),
      });

      const result = await fetchAoe4GuidesBuild("test");

      // Should include age up marker
      const ageUpStep = result.steps.find((s) => s.description.includes("Age Up"));
      expect(ageUpStep).toBeDefined();
      expect(ageUpStep?.description).toContain("Feudal Age");
    });

    it("throws error on 404", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      await expect(fetchAoe4GuidesBuild("notfound-404")).rejects.toThrow("not found");
    });

    it("throws error when build has no steps", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "nosteps-123",
          title: "Test",
          civ: "ENG",
          steps: [],
        }),
      });

      await expect(fetchAoe4GuidesBuild("nosteps-123")).rejects.toThrow("no steps");
    });

    it("throws error on API failure", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect(fetchAoe4GuidesBuild("fail-500")).rejects.toThrow("500");
    });
  });

  describe("importAoe4GuidesBuild", () => {
    it("extracts ID and fetches build", async () => {
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
              steps: [{ description: "Test" }],
            },
          ],
        }),
      });

      const result = await importAoe4GuidesBuild("https://aoe4guides.com/build/ABC123");

      expect(result.id).toBe("aoe4guides-ABC123");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://aoe4guides.com/api/builds/ABC123",
        expect.anything()
      );
    });

    it("throws error for invalid URL", async () => {
      await expect(importAoe4GuidesBuild("invalid")).rejects.toThrow(
        "Invalid AOE4Guides link"
      );
    });
  });

  describe("browseAoe4GuidesBuilds", () => {
    it("fetches builds without filter", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: "1", title: "Build 1", civ: "ENG", isDraft: false },
          { id: "2", title: "Build 2", civ: "FRE", isDraft: false },
        ],
      });

      const result = await browseAoe4GuidesBuilds();

      expect(mockFetch).toHaveBeenCalledWith(
        "https://aoe4guides.com/api/builds",
        expect.anything()
      );
      expect(result).toHaveLength(2);
    });

    it("filters by civilization code", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await browseAoe4GuidesBuilds({ civ: "ENG" });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://aoe4guides.com/api/builds?civ=ENG",
        expect.anything()
      );
    });

    it("converts full civilization name to code", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await browseAoe4GuidesBuilds({ civ: "English" });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://aoe4guides.com/api/builds?civ=ENG",
        expect.anything()
      );
    });

    it("excludes draft builds", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: "1", title: "Published", isDraft: false },
          { id: "2", title: "Draft", isDraft: true },
        ],
      });

      const result = await browseAoe4GuidesBuilds();

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Published");
    });

    it("returns summary data only", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: "1",
            title: "Test Build",
            description: "Description",
            author: "User",
            civ: "ENG",
            strategy: "Rush",
            season: "S7",
            views: 100,
            likes: 10,
            upvotes: 5,
            downvotes: 1,
            score: 4,
            isDraft: false,
            // These should not be in summary
            steps: [{ type: "age", age: 1, steps: [] }],
            authorUid: "uid",
          },
        ],
      });

      const result = await browseAoe4GuidesBuilds();

      expect(result[0]).toEqual({
        id: "1",
        title: "Test Build",
        description: "Description",
        author: "User",
        civ: "ENG",
        strategy: "Rush",
        season: "S7",
        views: 100,
        likes: 10,
        upvotes: 5,
        downvotes: 1,
        score: 4,
      });
    });

    it("throws error on API failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect(browseAoe4GuidesBuilds()).rejects.toThrow("500");
    });
  });
});
