import { describe, it, expect } from "vitest";
import {
  normalizeIconName,
  getIconDisplayName,
  hasIconFile,
  ICON_REGISTRY,
} from "./iconNormalizer";

describe("iconNormalizer", () => {
  describe("normalizeIconName", () => {
    describe("version suffix stripping", () => {
      it("strips numeric suffixes with hyphen", () => {
        expect(normalizeIconName("archer-2")).toBe("archer");
        expect(normalizeIconName("knight-3")).toBe("knight");
        expect(normalizeIconName("spearman-1")).toBe("spearman");
        expect(normalizeIconName("handcannoneer-4")).toBe("handcannoneer");
      });

      it("strips numeric suffixes with underscore", () => {
        expect(normalizeIconName("archer_2")).toBe("archer");
        expect(normalizeIconName("knight_3")).toBe("knight");
        expect(normalizeIconName("spearman_1")).toBe("spearman");
      });

      it("preserves names that naturally end in numbers", () => {
        // These are NOT version suffixes
        expect(normalizeIconName("age_1")).toBe("dark_age");
        expect(normalizeIconName("age_2")).toBe("feudal_age");
        expect(normalizeIconName("age_3")).toBe("castle_age");
        expect(normalizeIconName("age_4")).toBe("imperial_age");
      });
    });

    describe("separator normalization", () => {
      it("converts hyphens to underscores", () => {
        expect(normalizeIconName("man-at-arms")).toBe("man_at_arms");
        expect(normalizeIconName("lumber-camp")).toBe("lumber_camp");
        expect(normalizeIconName("mining-camp")).toBe("mining_camp");
        expect(normalizeIconName("town-center")).toBe("town_center");
      });

      it("handles mixed separators", () => {
        expect(normalizeIconName("man-at_arms")).toBe("man_at_arms");
        expect(normalizeIconName("zhuge-nu_2")).toBe("zhuge_nu");
      });
    });

    describe("case normalization", () => {
      it("converts to lowercase", () => {
        expect(normalizeIconName("Villager")).toBe("villager");
        expect(normalizeIconName("KNIGHT")).toBe("knight");
        expect(normalizeIconName("Man-At-Arms")).toBe("man_at_arms");
      });
    });

    describe("civ-prefixed villagers", () => {
      it("normalizes civ-specific villagers to generic villager", () => {
        expect(normalizeIconName("villager_delhi")).toBe("villager");
        expect(normalizeIconName("villager_abbasid")).toBe("villager");
        expect(normalizeIconName("villager_chinese")).toBe("villager");
        expect(normalizeIconName("villager_english")).toBe("villager");
        expect(normalizeIconName("villager_french")).toBe("villager");
        expect(normalizeIconName("villager_hre")).toBe("villager");
        expect(normalizeIconName("villager_mongol")).toBe("villager");
        expect(normalizeIconName("villager_ottoman")).toBe("villager");
        expect(normalizeIconName("villager_rus")).toBe("villager");
        expect(normalizeIconName("villager_malian")).toBe("villager");
        expect(normalizeIconName("villager_japanese")).toBe("villager");
        expect(normalizeIconName("villager_byzantine")).toBe("villager");
        expect(normalizeIconName("villager_ayyubid")).toBe("villager");
      });

      it("handles hyphenated civ villager names", () => {
        expect(normalizeIconName("villager-china")).toBe("villager");
        expect(normalizeIconName("villager-delhi")).toBe("villager");
        expect(normalizeIconName("villager-japanese")).toBe("villager");
        expect(normalizeIconName("villager-malians")).toBe("villager");
        expect(normalizeIconName("villager-mongols")).toBe("villager");
        expect(normalizeIconName("villager-ottomans")).toBe("villager");
      });
    });

    describe("common aliases", () => {
      it("resolves common unit aliases", () => {
        expect(normalizeIconName("maa")).toBe("man_at_arms");
        expect(normalizeIconName("MAA")).toBe("man_at_arms");
        expect(normalizeIconName("manatarms")).toBe("man_at_arms");
        expect(normalizeIconName("xbow")).toBe("crossbowman");
        expect(normalizeIconName("xb")).toBe("crossbowman");
        expect(normalizeIconName("hc")).toBe("handcannoneer");
        expect(normalizeIconName("lb")).toBe("longbowman");
      });

      it("resolves building aliases", () => {
        expect(normalizeIconName("tc")).toBe("town_center");
        expect(normalizeIconName("TC")).toBe("town_center");
        expect(normalizeIconName("towncenter")).toBe("town_center");
        expect(normalizeIconName("rax")).toBe("barracks");
        expect(normalizeIconName("Rax")).toBe("barracks");
        expect(normalizeIconName("ar")).toBe("archery_range");
        expect(normalizeIconName("archeryrange")).toBe("archery_range");
        expect(normalizeIconName("sw")).toBe("siege_workshop");
        expect(normalizeIconName("siegeworkshop")).toBe("siege_workshop");
        expect(normalizeIconName("lc")).toBe("lumber_camp");
        expect(normalizeIconName("lumbercamp")).toBe("lumber_camp");
        expect(normalizeIconName("mc")).toBe("mining_camp");
        expect(normalizeIconName("miningcamp")).toBe("mining_camp");
      });

      it("resolves resource aliases", () => {
        expect(normalizeIconName("f")).toBe("food");
        expect(normalizeIconName("w")).toBe("wood");
        expect(normalizeIconName("g")).toBe("gold");
        expect(normalizeIconName("s")).toBe("stone");
        expect(normalizeIconName("resource_food")).toBe("food");
        expect(normalizeIconName("resource_wood")).toBe("wood");
        expect(normalizeIconName("resource_gold")).toBe("gold");
        expect(normalizeIconName("resource_stone")).toBe("stone");
      });

      it("resolves technology aliases", () => {
        expect(normalizeIconName("wb")).toBe("wheelbarrow");
        expect(normalizeIconName("WB")).toBe("wheelbarrow");
        expect(normalizeIconName("pro-scouts")).toBe("professional_scouts");
        expect(normalizeIconName("proscouts")).toBe("professional_scouts");
      });
    });

    describe("civ-specific unit normalization", () => {
      // Chinese
      it("normalizes Chinese units", () => {
        expect(normalizeIconName("zhuge-nu")).toBe("zhuge_nu");
        expect(normalizeIconName("zhugenu")).toBe("zhuge_nu");
        expect(normalizeIconName("zhuge_nu")).toBe("zhuge_nu");
        expect(normalizeIconName("fire-lancer")).toBe("fire_lancer");
        expect(normalizeIconName("firelancer")).toBe("fire_lancer");
        expect(normalizeIconName("nest-of-bees")).toBe("nest_of_bees");
        expect(normalizeIconName("nestofbees")).toBe("nest_of_bees");
        expect(normalizeIconName("palace-guard")).toBe("palace_guard");
        expect(normalizeIconName("imperial-official")).toBe("imperial_official");
        expect(normalizeIconName("imperialofficial")).toBe("imperial_official");
        expect(normalizeIconName("io")).toBe("imperial_official");
      });

      // HRE
      it("normalizes HRE units", () => {
        expect(normalizeIconName("landsknecht")).toBe("landsknecht");
        expect(normalizeIconName("prelate")).toBe("prelate");
      });

      // Mongols
      it("normalizes Mongol units", () => {
        expect(normalizeIconName("mangudai")).toBe("mangudai");
        expect(normalizeIconName("keshik")).toBe("keshik");
        expect(normalizeIconName("khan")).toBe("khan");
      });

      // Japanese
      it("normalizes Japanese units", () => {
        expect(normalizeIconName("samurai")).toBe("samurai");
        expect(normalizeIconName("shinobi")).toBe("shinobi");
        expect(normalizeIconName("onna-bugeisha")).toBe("onna_bugeisha");
        expect(normalizeIconName("onnabugeisha")).toBe("onna_bugeisha");
        expect(normalizeIconName("ozutsu")).toBe("ozutsu");
      });

      // French
      it("normalizes French units", () => {
        expect(normalizeIconName("royal-knight")).toBe("royal_knight");
        expect(normalizeIconName("royalknight")).toBe("royal_knight");
        expect(normalizeIconName("rk")).toBe("royal_knight");
        expect(normalizeIconName("arbaletrier")).toBe("arbaletrier");
      });

      // English
      it("normalizes English units", () => {
        expect(normalizeIconName("longbowman")).toBe("longbowman");
        expect(normalizeIconName("longbow")).toBe("longbowman");
      });

      // Rus
      it("normalizes Rus units", () => {
        expect(normalizeIconName("streltsy")).toBe("streltsy");
        expect(normalizeIconName("warrior-monk")).toBe("warrior_monk");
        expect(normalizeIconName("horse-archer")).toBe("horse_archer");
      });

      // Delhi
      it("normalizes Delhi units", () => {
        expect(normalizeIconName("scholar")).toBe("scholar");
        expect(normalizeIconName("war-elephant")).toBe("war_elephant");
        expect(normalizeIconName("tower-elephant")).toBe("tower_elephant");
      });

      // Ottomans
      it("normalizes Ottoman units", () => {
        expect(normalizeIconName("janissary")).toBe("janissary");
        expect(normalizeIconName("sipahi")).toBe("sipahi");
        expect(normalizeIconName("mehter")).toBe("mehter");
        expect(normalizeIconName("great-bombard")).toBe("great_bombard");
      });
    });

    describe("landmark normalization", () => {
      it("normalizes English landmarks", () => {
        expect(normalizeIconName("council-hall")).toBe("council_hall");
        expect(normalizeIconName("white-tower")).toBe("white_tower");
        expect(normalizeIconName("abbey-of-kings")).toBe("abbey_of_kings");
      });

      it("normalizes HRE landmarks", () => {
        expect(normalizeIconName("aachen-chapel")).toBe("aachen_chapel");
        expect(normalizeIconName("meinwerk-palace")).toBe("meinwerk_palace");
        expect(normalizeIconName("regnitz-cathedral")).toBe("regnitz_cathedral");
      });

      it("normalizes Chinese landmarks", () => {
        expect(normalizeIconName("imperial-academy")).toBe("imperial_academy");
        expect(normalizeIconName("barbican-of-the-sun")).toBe("barbican_of_the_sun");
        expect(normalizeIconName("astronomical-clocktower")).toBe("astronomical_clocktower");
      });

      it("normalizes Abbasid landmarks", () => {
        expect(normalizeIconName("house-of-wisdom")).toBe("house_of_wisdom");
        expect(normalizeIconName("how")).toBe("house_of_wisdom");
        expect(normalizeIconName("culture-wing")).toBe("culture_wing");
        expect(normalizeIconName("economic-wing")).toBe("economic_wing");
        expect(normalizeIconName("military-wing")).toBe("military_wing");
        expect(normalizeIconName("trade-wing")).toBe("trade_wing");
      });

      it("normalizes French landmarks", () => {
        expect(normalizeIconName("school-of-cavalry")).toBe("school_of_cavalry");
        expect(normalizeIconName("chamber-of-commerce")).toBe("chamber_of_commerce");
        expect(normalizeIconName("guild-hall")).toBe("guild_hall");
        expect(normalizeIconName("red-palace")).toBe("red_palace");
        expect(normalizeIconName("college-of-artillery")).toBe("college_of_artillery");
      });
    });

    describe("edge cases", () => {
      it("handles empty string", () => {
        expect(normalizeIconName("")).toBe("");
      });

      it("handles whitespace", () => {
        expect(normalizeIconName("  villager  ")).toBe("villager");
        expect(normalizeIconName("man at arms")).toBe("man_at_arms");
      });

      it("handles already normalized names", () => {
        expect(normalizeIconName("villager")).toBe("villager");
        expect(normalizeIconName("man_at_arms")).toBe("man_at_arms");
        expect(normalizeIconName("town_center")).toBe("town_center");
      });

      it("preserves unknown names in normalized form", () => {
        expect(normalizeIconName("unknown-unit")).toBe("unknown_unit");
        expect(normalizeIconName("future_dlc_unit")).toBe("future_dlc_unit");
      });
    });
  });

  describe("getIconDisplayName", () => {
    it("returns human-readable display names for common icons", () => {
      expect(getIconDisplayName("villager")).toBe("Villager");
      expect(getIconDisplayName("man_at_arms")).toBe("Man-at-Arms");
      expect(getIconDisplayName("town_center")).toBe("Town Center");
      expect(getIconDisplayName("archery_range")).toBe("Archery Range");
    });

    it("handles icons with special display names", () => {
      expect(getIconDisplayName("zhuge_nu")).toBe("Zhuge Nu");
      expect(getIconDisplayName("imperial_official")).toBe("Imperial Official");
      expect(getIconDisplayName("house_of_wisdom")).toBe("House of Wisdom");
    });

    it("generates display name from unknown icons", () => {
      expect(getIconDisplayName("unknown_unit")).toBe("Unknown Unit");
      expect(getIconDisplayName("some_new_thing")).toBe("Some New Thing");
    });

    it("normalizes input before lookup", () => {
      expect(getIconDisplayName("man-at-arms-2")).toBe("Man-at-Arms");
      expect(getIconDisplayName("VILLAGER")).toBe("Villager");
    });
  });

  describe("hasIconFile", () => {
    it("returns true for icons we have files for", () => {
      expect(hasIconFile("villager")).toBe(true);
      expect(hasIconFile("sheep")).toBe(true);
      expect(hasIconFile("knight")).toBe(true);
      expect(hasIconFile("archer")).toBe(true);
    });

    it("returns true for civ-specific icons we have", () => {
      expect(hasIconFile("prelate")).toBe(true);
      expect(hasIconFile("zhuge_nu")).toBe(true);
      expect(hasIconFile("khan")).toBe(true);
    });

    it("returns false for icons we need text fallback", () => {
      // These should return false - we use text display instead
      expect(hasIconFile("streltsy")).toBe(false);
      expect(hasIconFile("janissary")).toBe(false);
      expect(hasIconFile("war_elephant")).toBe(false);
    });

    it("normalizes input before lookup", () => {
      expect(hasIconFile("VILLAGER")).toBe(true);
      expect(hasIconFile("man-at-arms-2")).toBe(true);
    });
  });

  describe("ICON_REGISTRY", () => {
    it("contains entries for all standard units", () => {
      const standardUnits = [
        "villager", "scout", "spearman", "man_at_arms", "archer",
        "crossbowman", "knight", "horseman", "monk", "trader"
      ];
      for (const unit of standardUnits) {
        expect(ICON_REGISTRY[unit]).toBeDefined();
        expect(ICON_REGISTRY[unit].displayName).toBeTruthy();
      }
    });

    it("contains entries for all standard buildings", () => {
      const standardBuildings = [
        "house", "mill", "lumber_camp", "mining_camp", "barracks",
        "archery_range", "stable", "blacksmith", "market", "town_center",
        "dock", "outpost", "keep", "monastery", "university", "siege_workshop"
      ];
      for (const building of standardBuildings) {
        expect(ICON_REGISTRY[building]).toBeDefined();
        expect(ICON_REGISTRY[building].displayName).toBeTruthy();
      }
    });

    it("contains entries for all resources", () => {
      const resources = ["food", "wood", "gold", "stone", "sheep", "berries", "deer", "boar", "fish"];
      for (const resource of resources) {
        expect(ICON_REGISTRY[resource]).toBeDefined();
        expect(ICON_REGISTRY[resource].hasFile).toBe(true);
      }
    });

    it("contains entries for age icons", () => {
      const ages = ["dark_age", "feudal_age", "castle_age", "imperial_age"];
      for (const age of ages) {
        expect(ICON_REGISTRY[age]).toBeDefined();
      }
    });

    it("contains aliases array for icons with multiple names", () => {
      expect(ICON_REGISTRY["man_at_arms"].aliases).toContain("maa");
      expect(ICON_REGISTRY["town_center"].aliases).toContain("tc");
      expect(ICON_REGISTRY["crossbowman"].aliases).toContain("xbow");
    });
  });
});
