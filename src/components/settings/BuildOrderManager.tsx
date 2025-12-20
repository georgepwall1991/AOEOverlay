import { useState, useMemo, useEffect, useCallback } from "react";
import { useBuildOrderStore } from "@/stores";
import { saveBuildOrder, deleteBuildOrder } from "@/lib/tauri";
import { importAge4Builder } from "@/lib/age4builder";
import { importAoe4WorldBuild } from "@/lib/aoe4world";
import {
  importAoe4GuidesBuild,
  browseAoe4GuidesBuilds,
  type Aoe4GuidesBuildSummary
} from "@/lib/aoe4guides";
import type { BuildOrder } from "@/types";
import { BuildOrderEditor } from "./BuildOrderEditor";
import { BuildOrderHeader } from "./build-order/BuildOrderHeader";
import { BuildOrderDialogs } from "./build-order/BuildOrderDialogs";
import { BuildOrderList } from "./build-order/BuildOrderList";

interface BuildOrderManagerProps {
  filterCiv?: string;
  filterDiff?: string;
  onExport?: (orderId: string) => void;
}

export function BuildOrderManager({ filterCiv, filterDiff, onExport }: BuildOrderManagerProps) {
  const { buildOrders, setBuildOrders } = useBuildOrderStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingOrder, setEditingOrder] = useState<BuildOrder | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Import states
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  const [showUrlImportDialog, setShowUrlImportDialog] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [urlImportError, setUrlImportError] = useState<string | null>(null);

  const [showAoe4GuidesUrlDialog, setShowAoe4GuidesUrlDialog] = useState(false);
  const [aoe4GuidesUrl, setAoe4GuidesUrl] = useState("");
  const [aoe4GuidesUrlError, setAoe4GuidesUrlError] = useState<string | null>(null);

  const [isImporting, setIsImporting] = useState(false);

  // Browse state
  const [showBrowseDialog, setShowBrowseDialog] = useState(false);
  const [browseResults, setBrowseResults] = useState<Aoe4GuidesBuildSummary[]>([]);
  const [browseCivFilter, setBrowseCivFilter] = useState<string>("");
  const [browseSearchQuery, setBrowseSearchQuery] = useState<string>("");
  const [browseStrategyFilter, setBrowseStrategyFilter] = useState<string>("");
  const [browseSortBy, setBrowseSortBy] = useState<"popular" | "recent" | "upvotes">("popular");
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [browseError, setBrowseError] = useState<string | null>(null);

  // Filter local build orders
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

  // Filter and sort browse results
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
    switch (browseSortBy) {
      case "popular":
        results.sort((a, b) => b.views - a.views);
        break;
      case "upvotes":
        results.sort((a, b) => b.upvotes - a.upvotes);
        break;
      case "recent":
        // API returns recent first
        break;
    }
    return results;
  }, [browseResults, browseSearchQuery, browseStrategyFilter, browseSortBy]);

  // Handlers
  const handleToggleEnabled = async (order: BuildOrder) => {
    const updated = { ...order, enabled: !order.enabled };
    try {
      await saveBuildOrder(updated);
      setBuildOrders(buildOrders.map((o) => (o.id === order.id ? updated : o)));
    } catch (error) {
      console.error("Failed to toggle build order:", error);
    }
  };

  const handleToggleFavorite = async (order: BuildOrder) => {
    const updated = { ...order, favorite: !order.favorite };
    try {
      await saveBuildOrder(updated);
      setBuildOrders(buildOrders.map((o) => (o.id === order.id ? updated : o)));
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  const handleTogglePin = async (order: BuildOrder) => {
    const willPin = !order.pinned;
    const updatedOrders = buildOrders.map((o) => {
      if (o.id === order.id) return { ...o, pinned: willPin, enabled: true };
      if (willPin && o.pinned) return { ...o, pinned: false };
      return o;
    });

    const changedOrders = updatedOrders.filter((updated) => {
      const original = buildOrders.find((o) => o.id === updated.id);
      return original?.pinned !== updated.pinned;
    });

    setBuildOrders(updatedOrders);
    try {
      await Promise.all(changedOrders.map((o) => saveBuildOrder(o)));
    } catch (error) {
      console.error("Failed to update pinned build:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBuildOrder(id);
      setBuildOrders(buildOrders.filter((o) => o.id !== id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Failed to delete build order:", error);
    }
  };

  const handleSave = async (order: BuildOrder) => {
    try {
      await saveBuildOrder(order);
      const exists = buildOrders.find((o) => o.id === order.id);
      if (exists) {
        setBuildOrders(buildOrders.map((o) => (o.id === order.id ? order : o)));
      } else {
        setBuildOrders([...buildOrders, order]);
      }
      setEditingOrder(null);
      setIsCreating(false);
    } catch (error) {
      console.error("Failed to save build order:", error);
    }
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setEditingOrder({
      id: `bo-${Date.now()}`,
      name: "",
      civilization: "English",
      description: "",
      difficulty: "Beginner",
      enabled: true,
      steps: [],
    });
  };

  const handleImport = async () => {
    setImportError(null);
    try {
      const imported = importAge4Builder(importJson);
      const existingIds = new Set(buildOrders.map(o => o.id));
      if (existingIds.has(imported.id)) {
        imported.id = `${imported.id}-${Date.now()}`;
      }
      await saveBuildOrder(imported);
      setBuildOrders([...buildOrders, imported]);
      setShowImportDialog(false);
      setImportJson("");
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Failed to import");
    }
  };

  const handleUrlImport = async () => {
    setUrlImportError(null);
    setIsImporting(true);
    try {
      const imported = await importAoe4WorldBuild(importUrl);
      const existingIds = new Set(buildOrders.map(o => o.id));
      if (existingIds.has(imported.id)) {
        imported.id = `${imported.id}-${Date.now()}`;
      }
      await saveBuildOrder(imported);
      setBuildOrders([...buildOrders, imported]);
      setShowUrlImportDialog(false);
      setImportUrl("");
    } catch (error) {
      setUrlImportError(error instanceof Error ? error.message : "Failed to import from URL");
    } finally {
      setIsImporting(false);
    }
  };

  const handleAoe4GuidesUrlImport = async () => {
    setAoe4GuidesUrlError(null);
    setIsImporting(true);
    try {
      const imported = await importAoe4GuidesBuild(aoe4GuidesUrl);
      const existingIds = new Set(buildOrders.map((o) => o.id));
      if (existingIds.has(imported.id)) {
        imported.id = `${imported.id}-${Date.now()}`;
      }
      await saveBuildOrder(imported);
      setBuildOrders([...buildOrders, imported]);
      setShowAoe4GuidesUrlDialog(false);
      setAoe4GuidesUrl("");
    } catch (error) {
      setAoe4GuidesUrlError(error instanceof Error ? error.message : "Failed to import");
    } finally {
      setIsImporting(false);
    }
  };

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

  const handleImportFromBrowse = async (buildId: string) => {
    setIsImporting(true);
    setBrowseError(null);
    try {
      const imported = await importAoe4GuidesBuild(buildId);
      const existingIds = new Set(buildOrders.map((o) => o.id));
      if (existingIds.has(imported.id)) {
        imported.id = `${imported.id}-${Date.now()}`;
      }
      await saveBuildOrder(imported);
      setBuildOrders([...buildOrders, imported]);
      setShowBrowseDialog(false);
    } catch (error) {
      setBrowseError(error instanceof Error ? error.message : "Failed to import");
    } finally {
      setIsImporting(false);
    }
  };

  useEffect(() => {
    if (showBrowseDialog && browseResults.length === 0) {
      handleBrowseBuilds();
    }
  }, [showBrowseDialog, browseResults.length, handleBrowseBuilds]);

  if (editingOrder) {
    return (
      <BuildOrderEditor
        buildOrder={editingOrder}
        onSave={handleSave}
        onCancel={() => {
          setEditingOrder(null);
          setIsCreating(false);
        }}
        isNew={isCreating}
      />
    );
  }

  return (
    <div className="space-y-4">
      <BuildOrderHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onBrowseClick={() => setShowBrowseDialog(true)}
        onImportAoe4World={() => setShowUrlImportDialog(true)}
        onImportAoe4Guides={() => setShowAoe4GuidesUrlDialog(true)}
        onImportJson={() => setShowImportDialog(true)}
        onCreateNew={handleCreateNew}
      />

      {buildOrders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl bg-muted/5">
          <p className="text-sm font-medium">No build orders yet</p>
          <p className="text-xs mt-1">Click "New" or "Import" to get started</p>
        </div>
      ) : (
        <BuildOrderList
          orders={filteredOrders}
          onToggleEnabled={handleToggleEnabled}
          onTogglePin={handleTogglePin}
          onToggleFavorite={handleToggleFavorite}
          onEdit={setEditingOrder}
          onDeleteRequest={setDeleteConfirm}
          onExport={onExport}
        />
      )}

      <BuildOrderDialogs
        deleteConfirm={deleteConfirm}
        onDeleteConfirmChange={setDeleteConfirm}
        onDelete={handleDelete}
        showImportDialog={showImportDialog}
        onImportDialogChange={setShowImportDialog}
        importJson={importJson}
        onImportJsonChange={setImportJson}
        importError={importError}
        onImport={handleImport}
        showUrlImportDialog={showUrlImportDialog}
        onUrlImportDialogChange={setShowUrlImportDialog}
        importUrl={importUrl}
        onImportUrlChange={setImportUrl}
        urlImportError={urlImportError}
        onUrlImport={handleUrlImport}
        isImporting={isImporting}
        showAoe4GuidesUrlDialog={showAoe4GuidesUrlDialog}
        onAoe4GuidesUrlDialogChange={setShowAoe4GuidesUrlDialog}
        aoe4GuidesUrl={aoe4GuidesUrl}
        onAoe4GuidesUrlChange={setAoe4GuidesUrl}
        aoe4GuidesUrlError={aoe4GuidesUrlError}
        onAoe4GuidesUrlImport={handleAoe4GuidesUrlImport}
        showBrowseDialog={showBrowseDialog}
        onBrowseDialogChange={setShowBrowseDialog}
        filteredBrowseResults={filteredBrowseResults}
        browseCivFilter={browseCivFilter}
        onBrowseCivFilterChange={setBrowseCivFilter}
        browseSearchQuery={browseSearchQuery}
        onBrowseSearchQueryChange={setBrowseSearchQuery}
        browseStrategyFilter={browseStrategyFilter}
        onBrowseStrategyFilterChange={setBrowseStrategyFilter}
        browseSortBy={browseSortBy}
        onBrowseSortByChange={setBrowseSortBy}
        isBrowsing={isBrowsing}
        browseError={browseError}
        onRefreshBrowse={handleBrowseBuilds}
        onImportFromBrowse={handleImportFromBrowse}
      />
    </div>
  );
}
