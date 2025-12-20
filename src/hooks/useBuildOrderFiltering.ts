import { useMemo, useState } from "react";
import type { BuildOrder } from "@/types";
import type { Aoe4GuidesBuildSummary } from "@/lib/aoe4guides";

interface UseBuildOrderFilteringProps {
  buildOrders: BuildOrder[];
  filterCiv?: string;
  filterDiff?: string;
}

interface UseBuildOrderFilteringResult {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredOrders: BuildOrder[];
  importedAoe4GuidesIds: Set<string>;
}

export function useBuildOrderFiltering({
  buildOrders,
  filterCiv,
  filterDiff,
}: UseBuildOrderFilteringProps): UseBuildOrderFilteringResult {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrders = useMemo(() => {
    return buildOrders.filter((order) => {
      if (filterCiv && order.civilization !== filterCiv) return false;
      if (filterDiff && order.difficulty !== filterDiff) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          order.name.toLowerCase().includes(query) ||
          order.description?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [buildOrders, filterCiv, filterDiff, searchQuery]);

  // Track which aoe4guides builds have already been imported
  const importedAoe4GuidesIds = useMemo(() => {
    const ids = new Set<string>();
    for (const order of buildOrders) {
      if (order.id.startsWith("aoe4guides-")) {
        const match = order.id.match(/^aoe4guides-([a-zA-Z0-9]+)/);
        if (match) {
          ids.add(match[1]);
        }
      }
    }
    return ids;
  }, [buildOrders]);

  return {
    searchQuery,
    setSearchQuery,
    filteredOrders,
    importedAoe4GuidesIds,
  };
}

interface UseBrowseFilteringProps {
  browseResults: Aoe4GuidesBuildSummary[];
}

interface UseBrowseFilteringResult {
  browseSearchQuery: string;
  setBrowseSearchQuery: (query: string) => void;
  browseStrategyFilter: string;
  setBrowseStrategyFilter: (filter: string) => void;
  browseMatchupFilter: string;
  setBrowseMatchupFilter: (filter: string) => void;
  browseSortBy: "popular" | "recent" | "upvotes";
  setBrowseSortBy: (sort: "popular" | "recent" | "upvotes") => void;
  filteredBrowseResults: Aoe4GuidesBuildSummary[];
}

export function useBrowseFiltering({
  browseResults,
}: UseBrowseFilteringProps): UseBrowseFilteringResult {
  const [browseSearchQuery, setBrowseSearchQuery] = useState("");
  const [browseStrategyFilter, setBrowseStrategyFilter] = useState("");
  const [browseMatchupFilter, setBrowseMatchupFilter] = useState("");
  const [browseSortBy, setBrowseSortBy] = useState<"popular" | "recent" | "upvotes">(
    "popular"
  );

  const filteredBrowseResults = useMemo(() => {
    let results = [...browseResults];

    if (browseSearchQuery.trim()) {
      const query = browseSearchQuery.toLowerCase();
      results = results.filter(
        (build) =>
          build.title.toLowerCase().includes(query) ||
          build.author.toLowerCase().includes(query) ||
          build.description?.toLowerCase().includes(query)
      );
    }

    if (browseStrategyFilter) {
      results = results.filter((build) =>
        build.strategy?.toLowerCase().includes(browseStrategyFilter.toLowerCase())
      );
    }

    if (browseMatchupFilter) {
      const matchup = browseMatchupFilter.toLowerCase();
      results = results.filter((build) => {
        const titleLower = build.title.toLowerCase();
        const descLower = build.description?.toLowerCase() || "";
        return (
          titleLower.includes(matchup) ||
          descLower.includes(matchup) ||
          titleLower.includes("vs " + matchup) ||
          titleLower.includes("vs. " + matchup) ||
          titleLower.includes("against " + matchup) ||
          descLower.includes("vs " + matchup) ||
          descLower.includes("vs. " + matchup) ||
          descLower.includes("against " + matchup)
        );
      });
    }

    switch (browseSortBy) {
      case "popular":
        results.sort((a, b) => b.views - a.views);
        break;
      case "upvotes":
        results.sort((a, b) => b.upvotes - a.upvotes);
        break;
      case "recent":
        break;
    }

    return results;
  }, [browseResults, browseSearchQuery, browseStrategyFilter, browseMatchupFilter, browseSortBy]);

  return {
    browseSearchQuery,
    setBrowseSearchQuery,
    browseStrategyFilter,
    setBrowseStrategyFilter,
    browseMatchupFilter,
    setBrowseMatchupFilter,
    browseSortBy,
    setBrowseSortBy,
    filteredBrowseResults,
  };
}
