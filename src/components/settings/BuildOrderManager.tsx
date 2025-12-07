import { useState, useMemo, useEffect } from "react";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Download, Upload, Link, Loader2, Library, Globe, Eye, ThumbsUp, Search, ChevronDown, Sparkles, TrendingUp, Clock, X, ArrowUpDown, User, Flame, Target, Zap, Shield, Star, StarOff, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBuildOrderStore } from "@/stores";
import { saveBuildOrder, deleteBuildOrder } from "@/lib/tauri";
import { importAge4Builder } from "@/lib/age4builder";
import { importAoe4WorldBuild } from "@/lib/aoe4world";
import { importAoe4GuidesBuild, browseAoe4GuidesBuilds, getCivNameFromCode, type Aoe4GuidesBuildSummary } from "@/lib/aoe4guides";
import type { BuildOrder } from "@/types";
import { CIVILIZATIONS } from "@/types";
import { BuildOrderEditor } from "./BuildOrderEditor";
import { CivBadge } from "@/components/overlay/CivBadge";

interface BuildOrderManagerProps {
  filterCiv?: string;
  filterDiff?: string;
  onExport?: (orderId: string) => void;
}

export function BuildOrderManager({ filterCiv, filterDiff, onExport }: BuildOrderManagerProps) {
  const { buildOrders, setBuildOrders } = useBuildOrderStore();

  // Filter build orders
  const filteredOrders = useMemo(() => {
    return buildOrders.filter((order) => {
      if (filterCiv && order.civilization !== filterCiv) return false;
      if (filterDiff && order.difficulty !== filterDiff) return false;
      return true;
    });
  }, [buildOrders, filterCiv, filterDiff]);
  const [editingOrder, setEditingOrder] = useState<BuildOrder | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [showUrlImportDialog, setShowUrlImportDialog] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [urlImportError, setUrlImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // AOE4 Guides state
  const [showAoe4GuidesUrlDialog, setShowAoe4GuidesUrlDialog] = useState(false);
  const [aoe4GuidesUrl, setAoe4GuidesUrl] = useState("");
  const [aoe4GuidesUrlError, setAoe4GuidesUrlError] = useState<string | null>(null);

  // Browse state
  const [showBrowseDialog, setShowBrowseDialog] = useState(false);
  const [browseResults, setBrowseResults] = useState<Aoe4GuidesBuildSummary[]>([]);
  const [browseCivFilter, setBrowseCivFilter] = useState<string>("");
  const [browseSearchQuery, setBrowseSearchQuery] = useState<string>("");
  const [browseStrategyFilter, setBrowseStrategyFilter] = useState<string>("");
  const [browseSortBy, setBrowseSortBy] = useState<"popular" | "recent" | "upvotes">("popular");
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [browseError, setBrowseError] = useState<string | null>(null);

  // Strategy options
  const STRATEGY_OPTIONS = [
    { value: "rush", label: "Rush", icon: Flame },
    { value: "boom", label: "Boom", icon: TrendingUp },
    { value: "timing", label: "Timing Attack", icon: Clock },
    { value: "defensive", label: "Defensive", icon: Shield },
    { value: "all-in", label: "All-In", icon: Target },
  ];

  // Filter and sort browse results
  const filteredBrowseResults = useMemo(() => {
    let results = [...browseResults];

    // Filter by search query
    if (browseSearchQuery.trim()) {
      const query = browseSearchQuery.toLowerCase();
      results = results.filter(
        (build) =>
          build.title.toLowerCase().includes(query) ||
          build.author.toLowerCase().includes(query) ||
          build.description?.toLowerCase().includes(query)
      );
    }

    // Filter by strategy
    if (browseStrategyFilter) {
      results = results.filter(
        (build) =>
          build.strategy?.toLowerCase().includes(browseStrategyFilter.toLowerCase())
      );
    }

    // Sort results
    switch (browseSortBy) {
      case "popular":
        results.sort((a, b) => b.views - a.views);
        break;
      case "recent":
        // Keep original order (API returns recent first)
        break;
      case "upvotes":
        results.sort((a, b) => b.upvotes - a.upvotes);
        break;
    }

    return results;
  }, [browseResults, browseSearchQuery, browseStrategyFilter, browseSortBy]);

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
      // Make sure ID is unique
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
      // Make sure ID is unique
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

  // AOE4 Guides URL import handler
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

  // Browse builds handler
  const handleBrowseBuilds = async () => {
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
  };

  // Import from browse results handler
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

  // Load browse results when dialog opens
  useEffect(() => {
    if (showBrowseDialog && browseResults.length === 0) {
      handleBrowseBuilds();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only trigger on dialog open, not on results change
  }, [showBrowseDialog]);

  // Show editor if editing or creating
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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Build Orders</h2>
        <div className="flex gap-2">
          {/* Browse AOE4 Guides */}
          <Button size="sm" variant="outline" onClick={() => setShowBrowseDialog(true)}>
            <Library className="w-4 h-4 mr-1" />
            Browse
          </Button>

          {/* Import dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <Download className="w-4 h-4 mr-1" />
                Import
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowUrlImportDialog(true)}>
                <Globe className="w-4 h-4 mr-2" />
                From aoe4world.com
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowAoe4GuidesUrlDialog(true)}>
                <Globe className="w-4 h-4 mr-2" />
                From aoe4guides.com
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowImportDialog(true)}>
                <Upload className="w-4 h-4 mr-2" />
                From JSON (age4builder)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button size="sm" onClick={handleCreateNew}>
            <Plus className="w-4 h-4 mr-1" />
            New
          </Button>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">{buildOrders.length === 0 ? "No build orders yet" : "No matching build orders"}</p>
          <p className="text-xs mt-1">{buildOrders.length === 0 ? 'Click "New" to create one' : "Try adjusting your filters"}</p>
        </div>
      ) : (
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                {/* Enable/Disable toggle */}
                <button
                  onClick={() => handleToggleEnabled(order)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title={order.enabled ? "Disable" : "Enable"}
                >
                  {order.enabled ? (
                    <ToggleRight className="w-5 h-5 text-green-500" />
                  ) : (
                    <ToggleLeft className="w-5 h-5" />
                  )}
                </button>

                {/* Build order info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-medium truncate ${
                        !order.enabled && "text-muted-foreground"
                      }`}
                    >
                      {order.name || "Untitled"}
                    </span>
                    {order.pinned && (
                      <Badge variant="secondary" className="text-[10px]">
                        Auto-load
                      </Badge>
                    )}
                    {order.favorite && (
                      <Badge variant="outline" className="text-[10px]">
                        Favorite
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <CivBadge civilization={order.civilization} />
                    <Badge variant="outline" className="text-[10px]">
                      {order.steps.length} steps
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {order.difficulty}
                    </Badge>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleTogglePin(order)}
                    title={order.pinned ? "Unpin (stop auto-loading)" : "Pin (auto-load on start)"}
                  >
                    <Pin className={`w-4 h-4 ${order.pinned ? "text-amber-400" : "text-muted-foreground"}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleToggleFavorite(order)}
                    title={order.favorite ? "Unfavorite" : "Favorite"}
                  >
                    {order.favorite ? (
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ) : (
                      <StarOff className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                  {onExport && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onExport(order.id)}
                      title="Export"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditingOrder(order)}
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteConfirm(order.id)}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Build Order?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              build order.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import from age4builder.com dialog */}
      <Dialog open={showImportDialog} onOpenChange={(open) => {
        setShowImportDialog(open);
        if (!open) {
          setImportJson("");
          setImportError(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import from age4builder.com</DialogTitle>
            <DialogDescription>
              Go to{" "}
              <a
                href="https://age4builder.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                age4builder.com
              </a>
              , open a build order, click the export/share button to get JSON, and paste it below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              placeholder='Paste JSON here... (starts with { "civilization": ...})'
              value={importJson}
              onChange={(e) => {
                setImportJson(e.target.value);
                setImportError(null);
              }}
              className="min-h-[200px] font-mono text-xs"
            />

            {importError && (
              <p className="text-sm text-destructive">{importError}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!importJson.trim()}>
              <Upload className="w-4 h-4 mr-1" />
              Import Build Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import from AoE4World URL dialog */}
      <Dialog open={showUrlImportDialog} onOpenChange={(open) => {
        setShowUrlImportDialog(open);
        if (!open) {
          setImportUrl("");
          setUrlImportError(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import from AoE4World</DialogTitle>
            <DialogDescription>
              Paste a build order URL from{" "}
              <a
                href="https://aoe4world.com/builds"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                aoe4world.com/builds
              </a>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="https://aoe4world.com/builds/123"
              value={importUrl}
              onChange={(e) => {
                setImportUrl(e.target.value);
                setUrlImportError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && importUrl.trim() && !isImporting) {
                  handleUrlImport();
                }
              }}
            />

            {urlImportError && (
              <p className="text-sm text-destructive">{urlImportError}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUrlImportDialog(false)} disabled={isImporting}>
              Cancel
            </Button>
            <Button onClick={handleUrlImport} disabled={!importUrl.trim() || isImporting}>
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Link className="w-4 h-4 mr-1" />
                  Import Build Order
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import from AOE4 Guides URL dialog */}
      <Dialog
        open={showAoe4GuidesUrlDialog}
        onOpenChange={(open) => {
          setShowAoe4GuidesUrlDialog(open);
          if (!open) {
            setAoe4GuidesUrl("");
            setAoe4GuidesUrlError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import from AOE4 Guides</DialogTitle>
            <DialogDescription>
              Paste a build order URL from{" "}
              <a
                href="https://aoe4guides.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                aoe4guides.com
              </a>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="https://aoe4guides.com/build/ABC123"
              value={aoe4GuidesUrl}
              onChange={(e) => {
                setAoe4GuidesUrl(e.target.value);
                setAoe4GuidesUrlError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && aoe4GuidesUrl.trim() && !isImporting) {
                  handleAoe4GuidesUrlImport();
                }
              }}
            />

            {aoe4GuidesUrlError && <p className="text-sm text-destructive">{aoe4GuidesUrlError}</p>}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAoe4GuidesUrlDialog(false)}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAoe4GuidesUrlImport}
              disabled={!aoe4GuidesUrl.trim() || isImporting}
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Link className="w-4 h-4 mr-1" />
                  Import Build Order
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Browse AOE4 Guides dialog */}
      <Dialog
        open={showBrowseDialog}
        onOpenChange={(open) => {
          setShowBrowseDialog(open);
          if (!open) {
            setBrowseResults([]);
            setBrowseCivFilter("");
            setBrowseSearchQuery("");
            setBrowseStrategyFilter("");
            setBrowseSortBy("popular");
            setBrowseError(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
          {/* Stylish Header with gradient */}
          <div className="relative bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border-b px-6 py-5 flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />
            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
                  <Library className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Browse AOE4 Guides</h2>
                  <p className="text-sm text-muted-foreground">
                    Discover and import community build orders from{" "}
                    <a
                      href="https://aoe4guides.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-500 hover:text-amber-400 underline underline-offset-2"
                    >
                      aoe4guides.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 px-6 py-4 gap-4">
            {/* Search and Filters Section */}
            <div className="flex flex-col gap-3 flex-shrink-0">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search builds by title, author, or description..."
                  value={browseSearchQuery}
                  onChange={(e) => setBrowseSearchQuery(e.target.value)}
                  className="pl-10 bg-muted/50"
                />
                {browseSearchQuery && (
                  <button
                    onClick={() => setBrowseSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filters row */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Civilization filter */}
                <Select
                  value={browseCivFilter || "all"}
                  onValueChange={(value) => setBrowseCivFilter(value === "all" ? "" : value)}
                >
                  <SelectTrigger className="w-[180px] bg-muted/50">
                    <Globe className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="All Civilizations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Civilizations</SelectItem>
                    {CIVILIZATIONS.map((civ) => (
                      <SelectItem key={civ} value={civ}>
                        {civ}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Strategy filter */}
                <Select
                  value={browseStrategyFilter || "all"}
                  onValueChange={(value) => setBrowseStrategyFilter(value === "all" ? "" : value)}
                >
                  <SelectTrigger className="w-[160px] bg-muted/50">
                    <Zap className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="All Strategies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Strategies</SelectItem>
                    {STRATEGY_OPTIONS.map((strategy) => (
                      <SelectItem key={strategy.value} value={strategy.value}>
                        <span className="flex items-center gap-2">
                          <strategy.icon className="w-3 h-3" />
                          {strategy.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Sort dropdown */}
                <Select
                  value={browseSortBy}
                  onValueChange={(value) => setBrowseSortBy(value as "popular" | "recent" | "upvotes")}
                >
                  <SelectTrigger className="w-[140px] bg-muted/50">
                    <ArrowUpDown className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">
                      <span className="flex items-center gap-2">
                        <TrendingUp className="w-3 h-3" />
                        Most Popular
                      </span>
                    </SelectItem>
                    <SelectItem value="recent">
                      <span className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        Most Recent
                      </span>
                    </SelectItem>
                    <SelectItem value="upvotes">
                      <span className="flex items-center gap-2">
                        <ThumbsUp className="w-3 h-3" />
                        Most Liked
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Refresh button */}
                <Button
                  onClick={handleBrowseBuilds}
                  disabled={isBrowsing}
                  size="sm"
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md"
                >
                  {isBrowsing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span className="ml-2">Refresh</span>
                </Button>

                {/* Results count */}
                {filteredBrowseResults.length > 0 && !isBrowsing && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span className="font-medium">{filteredBrowseResults.length}</span>
                    <span>build{filteredBrowseResults.length !== 1 ? "s" : ""}</span>
                    {browseSearchQuery || browseStrategyFilter ? (
                      <span className="text-xs">(filtered)</span>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Active filters */}
              {(browseSearchQuery || browseCivFilter || browseStrategyFilter) && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">Active filters:</span>
                  {browseSearchQuery && (
                    <Badge variant="secondary" className="gap-1 pr-1">
                      <Search className="w-3 h-3" />
                      "{browseSearchQuery}"
                      <button onClick={() => setBrowseSearchQuery("")} className="ml-1 hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {browseCivFilter && (
                    <Badge variant="secondary" className="gap-1 pr-1">
                      <Globe className="w-3 h-3" />
                      {browseCivFilter}
                      <button onClick={() => setBrowseCivFilter("")} className="ml-1 hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {browseStrategyFilter && (
                    <Badge variant="secondary" className="gap-1 pr-1">
                      <Zap className="w-3 h-3" />
                      {STRATEGY_OPTIONS.find(s => s.value === browseStrategyFilter)?.label || browseStrategyFilter}
                      <button onClick={() => setBrowseStrategyFilter("")} className="ml-1 hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  <button
                    onClick={() => {
                      setBrowseSearchQuery("");
                      setBrowseCivFilter("");
                      setBrowseStrategyFilter("");
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {browseError && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-3 flex-shrink-0">
                <div className="p-2 rounded-full bg-destructive/20">
                  <X className="w-4 h-4 text-destructive" />
                </div>
                <div>
                  <p className="text-sm font-medium text-destructive">Failed to load builds</p>
                  <p className="text-xs text-destructive/80">{browseError}</p>
                </div>
              </div>
            )}

            {/* Results list */}
            <ScrollArea className="flex-1 min-h-0 -mx-2 px-2">
              <div className="grid gap-3 pb-2">
                {filteredBrowseResults.map((build) => (
                  <div
                    key={build.id}
                    className="group p-4 rounded-xl border bg-card/50 hover:bg-card hover:shadow-lg hover:border-amber-500/30 transition-all duration-200"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <h4 className="font-semibold text-base leading-tight group-hover:text-amber-500 transition-colors">
                            {build.title}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <CivBadge civilization={getCivNameFromCode(build.civ)} size="sm" />
                          {build.strategy && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20"
                            >
                              <Flame className="w-3 h-3 mr-1 text-orange-500" />
                              {build.strategy}
                            </Badge>
                          )}
                          {build.season && (
                            <Badge variant="outline" className="text-[10px]">
                              {build.season}
                            </Badge>
                          )}
                        </div>

                        {build.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                            {build.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 mt-3">
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                            <Eye className="w-3.5 h-3.5" />
                            <span className="font-medium">{build.views.toLocaleString()}</span>
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span className="font-medium">{build.upvotes}</span>
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <User className="w-3.5 h-3.5" />
                            <span className="truncate">{build.author}</span>
                          </span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        className="flex-shrink-0 shadow-md bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white opacity-80 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleImportFromBrowse(build.id)}
                        disabled={isImporting}
                      >
                        {isImporting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-1.5" />
                            Import
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}

                {filteredBrowseResults.length === 0 && !isBrowsing && !browseError && (
                  <div className="text-center py-16 text-muted-foreground">
                    <div className="inline-flex p-4 rounded-full bg-muted/50 mb-4">
                      <Library className="w-10 h-10 opacity-50" />
                    </div>
                    <p className="text-sm font-medium">No builds found</p>
                    <p className="text-xs mt-1">
                      {browseSearchQuery || browseStrategyFilter
                        ? "Try adjusting your filters"
                        : "Click Refresh to load builds from AOE4 Guides"}
                    </p>
                  </div>
                )}

                {isBrowsing && (
                  <div className="text-center py-16 text-muted-foreground">
                    <div className="inline-flex p-4 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 mb-4">
                      <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                    </div>
                    <p className="text-sm font-medium">Loading builds from AOE4 Guides...</p>
                    <p className="text-xs mt-1 text-muted-foreground/70">This may take a moment</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter className="flex-shrink-0 border-t px-6 py-4 bg-muted/30">
            <div className="flex items-center justify-between w-full">
              <p className="text-xs text-muted-foreground">
                Powered by{" "}
                <a
                  href="https://aoe4guides.com/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-500 hover:underline"
                >
                  AOE4 Guides API
                </a>
              </p>
              <Button variant="outline" onClick={() => setShowBrowseDialog(false)}>
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
