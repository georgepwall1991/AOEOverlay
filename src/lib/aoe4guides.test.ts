import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  extractAoe4GuidesId,
  fetchAoe4GuidesBuild,
  importAoe4GuidesBuild,
  browseAoe4GuidesBuilds,
  getCivNameFromCode,
  CIVILIZATION_TO_CODE,
  MAX_BUILD_ORDER_STEPS,
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
    // Helper to mock 3 parallel API calls (views, upvotes, timeCreated sorts)
    const mockThreeCalls = (builds1: unknown[], builds2: unknown[], builds3: unknown[]) => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => builds1 })
        .mockResolvedValueOnce({ ok: true, json: async () => builds2 })
        .mockResolvedValueOnce({ ok: true, json: async () => builds3 });
    };

    it("fetches builds with 3 parallel queries for different sort orders", async () => {
      mockThreeCalls(
        [{ id: "1", title: "Build 1", civ: "ENG", views: 100, isDraft: false }],
        [{ id: "2", title: "Build 2", civ: "FRE", views: 50, isDraft: false }],
        [{ id: "3", title: "Build 3", civ: "HRE", views: 25, isDraft: false }]
      );

      const result = await browseAoe4GuidesBuilds();

      // Should have made 3 calls with different orderBy params
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://aoe4guides.com/api/builds?orderBy=views&order=desc",
        expect.anything()
      );
      expect(mockFetch).toHaveBeenCalledWith(
        "https://aoe4guides.com/api/builds?orderBy=upvotes&order=desc",
        expect.anything()
      );
      expect(mockFetch).toHaveBeenCalledWith(
        "https://aoe4guides.com/api/builds?orderBy=timeCreated&order=desc",
        expect.anything()
      );
      expect(result).toHaveLength(3);
    });

    it("deduplicates builds returned from multiple queries", async () => {
      // Same build appears in all 3 query results
      const sameBuild = { id: "1", title: "Popular Build", civ: "ENG", views: 100, isDraft: false };
      mockThreeCalls([sameBuild], [sameBuild], [sameBuild]);

      const result = await browseAoe4GuidesBuilds();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("1");
    });

    it("sorts merged results by views (most popular first)", async () => {
      mockThreeCalls(
        [{ id: "1", title: "Low views", civ: "ENG", views: 10, isDraft: false }],
        [{ id: "2", title: "High views", civ: "FRE", views: 1000, isDraft: false }],
        [{ id: "3", title: "Medium views", civ: "HRE", views: 100, isDraft: false }]
      );

      const result = await browseAoe4GuidesBuilds();

      expect(result[0].views).toBe(1000);
      expect(result[1].views).toBe(100);
      expect(result[2].views).toBe(10);
    });

    it("filters by civilization code in all 3 queries", async () => {
      mockThreeCalls([], [], []);

      await browseAoe4GuidesBuilds({ civ: "ENG" });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://aoe4guides.com/api/builds?civ=ENG&orderBy=views&order=desc",
        expect.anything()
      );
      expect(mockFetch).toHaveBeenCalledWith(
        "https://aoe4guides.com/api/builds?civ=ENG&orderBy=upvotes&order=desc",
        expect.anything()
      );
      expect(mockFetch).toHaveBeenCalledWith(
        "https://aoe4guides.com/api/builds?civ=ENG&orderBy=timeCreated&order=desc",
        expect.anything()
      );
    });

    it("converts full civilization name to code", async () => {
      mockThreeCalls([], [], []);

      await browseAoe4GuidesBuilds({ civ: "English" });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("civ=ENG"),
        expect.anything()
      );
    });

    it("excludes draft builds from all query results", async () => {
      mockThreeCalls(
        [{ id: "1", title: "Published", isDraft: false, views: 100 }],
        [{ id: "2", title: "Draft", isDraft: true, views: 50 }],
        [{ id: "3", title: "Another Published", isDraft: false, views: 25 }]
      );

      const result = await browseAoe4GuidesBuilds();

      expect(result).toHaveLength(2);
      expect(result.every((b) => b.title !== "Draft")).toBe(true);
    });

    it("returns summary data only", async () => {
      mockThreeCalls(
        [
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
        [],
        []
      );

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

    it("throws error only when ALL API calls fail", async () => {
      // All 3 calls fail
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 500, statusText: "Internal Server Error" })
        .mockResolvedValueOnce({ ok: false, status: 500, statusText: "Internal Server Error" })
        .mockResolvedValueOnce({ ok: false, status: 500, statusText: "Internal Server Error" });

      await expect(browseAoe4GuidesBuilds()).rejects.toThrow("500");
    });

    it("returns partial results when some API calls fail", async () => {
      // First call succeeds, other 2 fail
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ id: "1", title: "Build 1", civ: "ENG", views: 100, isDraft: false }],
        })
        .mockResolvedValueOnce({ ok: false, status: 500, statusText: "Internal Server Error" })
        .mockResolvedValueOnce({ ok: false, status: 500, statusText: "Internal Server Error" });

      const result = await browseAoe4GuidesBuilds();

      // Should still return the successful result
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("1");
    });

    it("handles null values from API gracefully", async () => {
      mockThreeCalls(
        [
          {
            id: "1",
            title: null,
            description: null,
            author: null,
            civ: null,
            strategy: null,
            season: null,
            views: null,
            likes: null,
            upvotes: null,
            downvotes: null,
            score: null,
            isDraft: null,
          },
        ],
        [],
        []
      );

      const result = await browseAoe4GuidesBuilds();

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("");
      expect(result[0].description).toBe("");
      expect(result[0].author).toBe("");
      expect(result[0].views).toBe(0);
    });
  });

  describe("edge cases", () => {
    it("handles HTML img tags in step descriptions", async () => {
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
                  description:
                    '<img src="/assets/pictures/unit_worker/villager.png" class="icon-default" title="Villager" /> to food',
                },
              ],
            },
          ],
        }),
      });

      const result = await fetchAoe4GuidesBuild("test");

      expect(result.steps[0].description).toContain("[icon:villager]");
      expect(result.steps[0].description).not.toContain("<img");
    });

    it("handles br tags in descriptions", async () => {
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
                  description: "Build house<br />Then build mill<br/>Finally get food",
                },
              ],
            },
          ],
        }),
      });

      const result = await fetchAoe4GuidesBuild("test");

      expect(result.steps[0].description).not.toContain("<br");
      expect(result.steps[0].description).toContain("|");
    });

    it("handles HTML entities in descriptions", async () => {
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
                  description: "&amp; test &lt; &gt; &quot; &#39; &nbsp;",
                },
              ],
            },
          ],
        }),
      });

      const result = await fetchAoe4GuidesBuild("test");

      expect(result.steps[0].description).toContain("&");
      expect(result.steps[0].description).toContain("<");
      expect(result.steps[0].description).toContain(">");
      expect(result.steps[0].description).toContain('"');
      expect(result.steps[0].description).toContain("'");
    });

    it("handles multiple icons in one description", async () => {
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
                  description:
                    '<img src="villager.png" title="Villager" /> and <img src="sheep.png" title="Sheep" />',
                },
              ],
            },
          ],
        }),
      });

      const result = await fetchAoe4GuidesBuild("test");
      expect(result.steps[0].description).toBe("[icon:villager] and [icon:sheep]");
    });

    it("handles icons with camelCase titles or varying formats", async () => {
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
                  description:
                    '<img src="town_center.png" title="TownCenter" /> and <img src="longbowman.png" title="Longbowman" />',
                },
              ],
            },
          ],
        }),
      });

      const result = await fetchAoe4GuidesBuild("test");
      // town_center is mapped to town_center, so it gets [icon:town_center]
      // longbowman is in text fallbacks, so it gets just "Longbowman"
      expect(result.steps[0].description).toContain("[icon:town_center]");
      expect(result.steps[0].description).toContain("Longbowman");
    });

    it("handles repeated line breaks and whitespace", async () => {
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
                  description: "First line<br /><br /><br />Last line",
                },
              ],
            },
          ],
        }),
      });

      const result = await fetchAoe4GuidesBuild("test");
      // Repeated BRs should be condensed to single | or similar
      expect(result.steps[0].description).toBe("First line | Last line");
    });

    it("handles timing with HTML tags", async () => {
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
                  description: "Test",
                  time: "<br />2:30<br/>",
                },
              ],
            },
          ],
        }),
      });

      const result = await fetchAoe4GuidesBuild("test");

      expect(result.steps[0].timing).toBe("2:30");
    });

    it("skips empty steps", async () => {
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
                { description: "" },
                { description: "Valid step" },
                { description: "   " },
              ],
            },
          ],
        }),
      });

      const result = await fetchAoe4GuidesBuild("test");

      expect(result.steps.length).toBe(1);
      expect(result.steps[0].description).toBe("Valid step");
    });

    it("skips steps that are only separators", async () => {
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
                { description: "<br /><br/>" },
                { description: "Valid step" },
              ],
            },
          ],
        }),
      });

      const result = await fetchAoe4GuidesBuild("test");

      // Should skip the separator-only step
      expect(result.steps.some((s) => s.description === "Valid step")).toBe(true);
    });

    it("handles zero resources", async () => {
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
                  description: "Test",
                  food: "0",
                  wood: "0",
                  gold: "0",
                  stone: "0",
                },
              ],
            },
          ],
        }),
      });

      const result = await fetchAoe4GuidesBuild("test");

      // All zeros should result in no resources object
      expect(result.steps[0].resources).toBeUndefined();
    });

    it("handles negative and invalid resource values", async () => {
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
                  description: "Test",
                  food: "-50",
                  wood: "abc",
                  gold: "50",
                  stone: "",
                },
              ],
            },
          ],
        }),
      });

      const result = await fetchAoe4GuidesBuild("test");

      expect(result.steps[0].resources?.food).toBe(0);
      expect(result.steps[0].resources?.wood).toBeUndefined();
      expect(result.steps[0].resources?.gold).toBe(50);
      expect(result.steps[0].resources?.stone).toBeUndefined();
    });

    it("handles unknown civilization codes with fallback", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "test",
          title: "Test",
          civ: "UNKNOWN_CIV",
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

      // Should fall back to English and log a warning
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => { });
      const result = await fetchAoe4GuidesBuild("test");

      expect(result.civilization).toBe("English");
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("handles unknown strategy with fallback to Intermediate", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "test",
          title: "Test",
          civ: "ENG",
          strategy: "Some Unknown Strategy",
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

      expect(result.difficulty).toBe("Intermediate");
    });

    it("handles gameplan as first step", async () => {
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
              gameplan: "This is the gameplan for Dark Age",
              steps: [{ description: "First actual step" }],
            },
          ],
        }),
      });

      const result = await fetchAoe4GuidesBuild("test");

      // Gameplan should be capitalized and included
      expect(result.steps[0].description).toBe("This is the gameplan for Dark Age");
      expect(result.steps[1].description).toBe("First actual step");
    });

    it("handles all age levels correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "test",
          title: "Test",
          civ: "ENG",
          steps: [
            {
              type: "ageUp",
              age: 1, // Age up from 1 to 2
              gameplan: "",
              steps: [{ description: "Step" }],
            },
            {
              type: "ageUp",
              age: 2, // Age up from 2 to 3
              gameplan: "",
              steps: [{ description: "Step" }],
            },
            {
              type: "ageUp",
              age: 3, // Age up from 3 to 4
              gameplan: "",
              steps: [{ description: "Step" }],
            },
          ],
        }),
      });

      const result = await fetchAoe4GuidesBuild("test");

      expect(result.steps.some((s) => s.description.includes("Feudal Age"))).toBe(true);
      expect(result.steps.some((s) => s.description.includes("Castle Age"))).toBe(true);
      expect(result.steps.some((s) => s.description.includes("Imperial Age"))).toBe(true);
    });

    it("handles age beyond 4 with fallback", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "test",
          title: "Test",
          civ: "ENG",
          steps: [
            {
              type: "ageUp",
              age: 4, // Age up from 4 to 5 (doesn't exist)
              gameplan: "",
              steps: [{ description: "Step" }],
            },
          ],
        }),
      });

      const result = await fetchAoe4GuidesBuild("test");

      expect(result.steps.some((s) => s.description.includes("Age 5"))).toBe(true);
    });

    it("retries on network failure", async () => {
      // First two calls fail, third succeeds
      mockFetch
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
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
                steps: [{ description: "Test" }],
              },
            ],
          }),
        });

      const result = await fetchAoe4GuidesBuild("test");

      expect(result.id).toBe("aoe4guides-test");
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("handles build with empty title", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "test",
          title: "",
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

      const result = await fetchAoe4GuidesBuild("test");

      expect(result.name).toBe("Imported Build");
    });

    it("includes author and strategy in description", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "test",
          title: "Test",
          description: "My build description",
          author: "TestAuthor",
          civ: "ENG",
          strategy: "Rush",
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

      expect(result.description).toContain("My build description");
      expect(result.description).toContain("TestAuthor");
      expect(result.description).toContain("Rush");
      expect(result.description).toContain("aoe4guides.com");
      expect(result.description).toContain("aoe4guides.com");
    });
  });

  describe("enforcement", () => {
    it("throws error when build exceeds MAX_BUILD_ORDER_STEPS", async () => {
      // Create a build with many steps
      const manySteps = Array.from({ length: MAX_BUILD_ORDER_STEPS / 10 + 1 }, (_, i) => ({
        type: "age",
        age: 1,
        gameplan: "",
        steps: Array.from({ length: 15 }, (_, j) => ({ description: `Step ${i}-${j}` })),
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "toomany-123",
          title: "Too Many Steps",
          civ: "ENG",
          steps: manySteps,
        }),
      });

      await expect(fetchAoe4GuidesBuild("toomany-123")).rejects.toThrow(
        `Build order exceeds maximum of ${MAX_BUILD_ORDER_STEPS} steps`
      );
    });
  });

  describe("caching", () => {
    it("returns cached build when API fetch fails after initial success", async () => {
      const buildId = "cached-build-123";
      const mockApiResponse = {
        id: buildId,
        title: "Initial Build",
        civ: "ENG",
        steps: [
          {
            type: "age",
            age: 1,
            gameplan: "Initial plan",
            steps: [{ description: "Initial step" }],
          },
        ],
      };

      // First call: Success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const firstResult = await fetchAoe4GuidesBuild(buildId);
      expect(firstResult.name).toBe("Initial Build");
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call: API Failure (retries 3 times then uses cache)
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      const secondResult = await fetchAoe4GuidesBuild(buildId);
      expect(secondResult).toEqual(firstResult);
      // Should have called fetch 4 times total (1 success + 3 retries)
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });
});

describe("CIVILIZATION_TO_CODE mapping", () => {
  it("maps all standard civilizations", () => {
    expect(CIVILIZATION_TO_CODE["English"]).toBe("ENG");
    expect(CIVILIZATION_TO_CODE["French"]).toBe("FRE");
    expect(CIVILIZATION_TO_CODE["Holy Roman Empire"]).toBe("HRE");
    expect(CIVILIZATION_TO_CODE["Rus"]).toBe("RUS");
    expect(CIVILIZATION_TO_CODE["Chinese"]).toBe("CHI");
    expect(CIVILIZATION_TO_CODE["Delhi Sultanate"]).toBe("DEL");
    expect(CIVILIZATION_TO_CODE["Abbasid Dynasty"]).toBe("ABB");
    expect(CIVILIZATION_TO_CODE["Mongols"]).toBe("MON");
    expect(CIVILIZATION_TO_CODE["Ottomans"]).toBe("OTT");
    expect(CIVILIZATION_TO_CODE["Malians"]).toBe("MAL");
    expect(CIVILIZATION_TO_CODE["Byzantines"]).toBe("BYZ");
    expect(CIVILIZATION_TO_CODE["Japanese"]).toBe("JAP");
  });

  it("maps variant civilizations", () => {
    expect(CIVILIZATION_TO_CODE["Jeanne d'Arc"]).toBe("JDA");
    expect(CIVILIZATION_TO_CODE["Ayyubids"]).toBe("AYY");
    expect(CIVILIZATION_TO_CODE["Zhu Xi's Legacy"]).toBe("ZXL");
    expect(CIVILIZATION_TO_CODE["Order of the Dragon"]).toBe("DRA");
  });

  it("maps Dynasties of the East DLC civilizations", () => {
    expect(CIVILIZATION_TO_CODE["Golden Horde"]).toBe("GHO");
    expect(CIVILIZATION_TO_CODE["Macedonian Dynasty"]).toBe("MAC");
    expect(CIVILIZATION_TO_CODE["Sengoku Daimyo"]).toBe("SEN");
    expect(CIVILIZATION_TO_CODE["Tughlaq Dynasty"]).toBe("TUG");
  });
});

describe("MAX_BUILD_ORDER_STEPS constant", () => {
  it("is 200", () => {
    expect(MAX_BUILD_ORDER_STEPS).toBe(200);
  });
});
