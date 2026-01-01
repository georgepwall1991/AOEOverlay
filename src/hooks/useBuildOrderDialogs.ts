import { useState, useEffect, useCallback } from "react";
import { saveBuildOrder, deleteBuildOrder } from "@/lib/tauri";
import { importAge4Builder } from "@/lib/age4builder";
import { importAoe4WorldBuild } from "@/lib/aoe4world";
import { parseTextBuildOrder } from "@/lib/textParser";
import {
  importAoe4GuidesBuild,
  browseAoe4GuidesBuilds,
  type Aoe4GuidesBuildSummary,
} from "@/lib/aoe4guides";
import type { BuildOrder } from "@/types";

export interface DeleteDialogState {
  confirmId: string | null;
  setConfirmId: (id: string | null) => void;
  onDelete: () => void;
}

export interface ImportDialogState {
  show: boolean;
  setShow: (show: boolean) => void;
  value: string;
  setValue: (value: string) => void;
  error: string | null;
  onImport: () => void;
  isImporting: boolean;
}

export interface BrowseDialogState {
  show: boolean;
  setShow: (show: boolean) => void;
  results: Aoe4GuidesBuildSummary[];
  civFilter: string;
  setCivFilter: (civ: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  strategyFilter: string;
  setStrategyFilter: (strategy: string) => void;
  matchupFilter: string;
  setMatchupFilter: (civ: string) => void;
  sortBy: "popular" | "recent" | "upvotes";
  setSortBy: (sort: "popular" | "recent" | "upvotes") => void;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onImport: (id: string) => void;
  isImporting: boolean;
}

export interface BuildOrderDialogsState {
  deleteDialog: DeleteDialogState;
  importJsonDialog: ImportDialogState;
  importUrlDialog: ImportDialogState;
  importAoe4GuidesDialog: ImportDialogState;
  importTextDialog: ImportDialogState;
  browseDialog: BrowseDialogState;
  importedAoe4GuidesIds: Set<string>;
}

interface UseBuildOrderDialogsProps {
  buildOrders: BuildOrder[];
  setBuildOrders: (orders: BuildOrder[]) => void;
}

/**
 * Hook that encapsulates all build order dialog state and handlers.
 * Reduces prop drilling by grouping related state into dialog objects.
 */
export function useBuildOrderDialogs({
  buildOrders,
  setBuildOrders,
}: UseBuildOrderDialogsProps): BuildOrderDialogsState {
  // Delete dialog state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Import JSON dialog state
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  // Import URL (AoE4World) dialog state
  const [showUrlImportDialog, setShowUrlImportDialog] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [urlImportError, setUrlImportError] = useState<string | null>(null);

  // Import URL (AoE4Guides) dialog state
  const [showAoe4GuidesUrlDialog, setShowAoe4GuidesUrlDialog] = useState(false);
  const [aoe4GuidesUrl, setAoe4GuidesUrl] = useState("");
  const [aoe4GuidesUrlError, setAoe4GuidesUrlError] = useState<string | null>(null);

  // Text import dialog state
  const [showTextImportDialog, setShowTextImportDialog] = useState(false);
  const [importText, setImportText] = useState("");
  const [textImportError, setTextImportError] = useState<string | null>(null);

  // Shared importing state
  const [isImporting, setIsImporting] = useState(false);

  // Browse dialog state
  const [showBrowseDialog, setShowBrowseDialog] = useState(false);
  const [browseResults, setBrowseResults] = useState<Aoe4GuidesBuildSummary[]>([]);
  const [browseCivFilter, setBrowseCivFilter] = useState<string>("");
  const [browseSearchQuery, setBrowseSearchQuery] = useState("");
  const [browseStrategyFilter, setBrowseStrategyFilter] = useState("");
  const [browseMatchupFilter, setBrowseMatchupFilter] = useState("");
  const [browseSortBy, setBrowseSortBy] = useState<"popular" | "recent" | "upvotes">("popular");
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [browseError, setBrowseError] = useState<string | null>(null);

  // Track imported AOE4 Guides IDs (extracted from order.id format "aoe4guides-XXX...")
  const importedAoe4GuidesIds = (() => {
    const ids = new Set<string>();
    for (const order of buildOrders) {
      if (!order.id.startsWith("aoe4guides-")) continue;
      const match = order.id.match(/^aoe4guides-([a-zA-Z0-9]+)/);
      if (!match) continue;
      ids.add(match[1]);
    }
    return ids;
  })();

  // Helper to add build order with deduplication
  const addBuildOrder = useCallback(
    async (imported: BuildOrder) => {
      const existingIds = new Set(buildOrders.map((o) => o.id));
      if (existingIds.has(imported.id)) {
        imported.id = `${imported.id}-${Date.now()}`;
      }
      await saveBuildOrder(imported);
      setBuildOrders([...buildOrders, imported]);
    },
    [buildOrders, setBuildOrders]
  );

  // Delete handler
  const handleDelete = useCallback(async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteBuildOrder(deleteConfirmId);
      setBuildOrders(buildOrders.filter((o) => o.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Failed to delete build order:", error);
    }
  }, [deleteConfirmId, buildOrders, setBuildOrders]);

  // Import JSON handler
  const handleImportJson = useCallback(async () => {
    setImportError(null);
    try {
      const imported = importAge4Builder(importJson);
      await addBuildOrder(imported);
      setShowImportDialog(false);
      setImportJson("");
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Failed to import");
    }
  }, [importJson, addBuildOrder]);

  // Import URL (AoE4World) handler
  const handleUrlImport = useCallback(async () => {
    setUrlImportError(null);
    setIsImporting(true);
    try {
      const imported = await importAoe4WorldBuild(importUrl);
      await addBuildOrder(imported);
      setShowUrlImportDialog(false);
      setImportUrl("");
    } catch (error) {
      setUrlImportError(error instanceof Error ? error.message : "Failed to import from URL");
    } finally {
      setIsImporting(false);
    }
  }, [importUrl, addBuildOrder]);

  // Import URL (AoE4Guides) handler
  const handleAoe4GuidesUrlImport = useCallback(async () => {
    setAoe4GuidesUrlError(null);
    setIsImporting(true);
    try {
      const imported = await importAoe4GuidesBuild(aoe4GuidesUrl);
      await addBuildOrder(imported);
      setShowAoe4GuidesUrlDialog(false);
      setAoe4GuidesUrl("");
    } catch (error) {
      setAoe4GuidesUrlError(error instanceof Error ? error.message : "Failed to import");
    } finally {
      setIsImporting(false);
    }
  }, [aoe4GuidesUrl, addBuildOrder]);

  // Import Text handler
  const handleImportText = useCallback(async () => {
    setTextImportError(null);
    try {
      const imported = parseTextBuildOrder(importText);
      await addBuildOrder(imported);
      setShowTextImportDialog(false);
      setImportText("");
    } catch (error) {
      setTextImportError(error instanceof Error ? error.message : "Failed to parse text");
    }
  }, [importText, addBuildOrder]);

  // Browse handler
  const handleBrowseBuilds = useCallback(async () => {
    setIsBrowsing(true);
    setBrowseError(null);
    try {
      const results = await browseAoe4GuidesBuilds(
        browseCivFilter ? { civ: browseCivFilter } : undefined
      );
      setBrowseResults(results);
    } catch (error) {
      setBrowseError(error instanceof Error ? error.message : "Failed to load builds");
    } finally {
      setIsBrowsing(false);
    }
  }, [browseCivFilter]);

  // Import from browse handler
  const handleImportFromBrowse = useCallback(
    async (buildId: string) => {
      setIsImporting(true);
      setBrowseError(null);
      try {
        const imported = await importAoe4GuidesBuild(buildId);
        await addBuildOrder(imported);
        setShowBrowseDialog(false);
      } catch (error) {
        setBrowseError(error instanceof Error ? error.message : "Failed to import");
      } finally {
        setIsImporting(false);
      }
    },
    [addBuildOrder]
  );

  // Auto-fetch when browse dialog opens
  useEffect(() => {
    if (showBrowseDialog && browseResults.length === 0) {
      handleBrowseBuilds();
    }
  }, [showBrowseDialog, browseResults.length, handleBrowseBuilds]);

  // Filter browse results
  const filteredBrowseResults = (() => {
    let results = [...browseResults];

    // Search filter
    if (browseSearchQuery.trim()) {
      const query = browseSearchQuery.toLowerCase();
      results = results.filter(
        (build) =>
          build.title.toLowerCase().includes(query) ||
          build.author.toLowerCase().includes(query) ||
          build.description?.toLowerCase().includes(query)
      );
    }

    // Strategy filter
    if (browseStrategyFilter) {
      results = results.filter((build) =>
        build.strategy?.toLowerCase().includes(browseStrategyFilter.toLowerCase())
      );
    }

    // Matchup filter (searches title/description for matchup mentions)
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

    // Sort
    switch (browseSortBy) {
      case "popular":
        results.sort((a, b) => b.views - a.views);
        break;
      case "upvotes":
        results.sort((a, b) => b.upvotes - a.upvotes);
        break;
      case "recent":
        // Keep API order (already sorted by recent)
        break;
    }

    return results;
  })();

  return {
    deleteDialog: {
      confirmId: deleteConfirmId,
      setConfirmId: setDeleteConfirmId,
      onDelete: handleDelete,
    },
    importJsonDialog: {
      show: showImportDialog,
      setShow: setShowImportDialog,
      value: importJson,
      setValue: setImportJson,
      error: importError,
      onImport: handleImportJson,
      isImporting: false, // JSON import is synchronous
    },
    importUrlDialog: {
      show: showUrlImportDialog,
      setShow: setShowUrlImportDialog,
      value: importUrl,
      setValue: setImportUrl,
      error: urlImportError,
      onImport: handleUrlImport,
      isImporting,
    },
    importAoe4GuidesDialog: {
      show: showAoe4GuidesUrlDialog,
      setShow: setShowAoe4GuidesUrlDialog,
      value: aoe4GuidesUrl,
      setValue: setAoe4GuidesUrl,
      error: aoe4GuidesUrlError,
      onImport: handleAoe4GuidesUrlImport,
      isImporting,
    },
    importTextDialog: {
      show: showTextImportDialog,
      setShow: setShowTextImportDialog,
      value: importText,
      setValue: setImportText,
      error: textImportError,
      onImport: handleImportText,
      isImporting: false,
    },
    browseDialog: {
      show: showBrowseDialog,
      setShow: setShowBrowseDialog,
      results: filteredBrowseResults,
      civFilter: browseCivFilter,
      setCivFilter: setBrowseCivFilter,
      searchQuery: browseSearchQuery,
      setSearchQuery: setBrowseSearchQuery,
      strategyFilter: browseStrategyFilter,
      setStrategyFilter: setBrowseStrategyFilter,
      matchupFilter: browseMatchupFilter,
      setMatchupFilter: setBrowseMatchupFilter,
      sortBy: browseSortBy,
      setSortBy: setBrowseSortBy,
      isLoading: isBrowsing,
      error: browseError,
      onRefresh: handleBrowseBuilds,
      onImport: handleImportFromBrowse,
      isImporting,
    },
    importedAoe4GuidesIds,
  };
}
