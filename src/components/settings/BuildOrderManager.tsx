import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Download, Upload, Link, Loader2 } from "lucide-react";
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
import { useBuildOrderStore } from "@/stores";
import { saveBuildOrder, deleteBuildOrder } from "@/lib/tauri";
import { importAge4Builder } from "@/lib/age4builder";
import { importAoe4WorldBuild } from "@/lib/aoe4world";
import type { BuildOrder } from "@/types";
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

  const handleToggleEnabled = async (order: BuildOrder) => {
    const updated = { ...order, enabled: !order.enabled };
    try {
      await saveBuildOrder(updated);
      setBuildOrders(buildOrders.map((o) => (o.id === order.id ? updated : o)));
    } catch (error) {
      console.error("Failed to toggle build order:", error);
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
          <Button size="sm" variant="outline" onClick={() => setShowUrlImportDialog(true)}>
            <Link className="w-4 h-4 mr-1" />
            Import URL
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowImportDialog(true)}>
            <Upload className="w-4 h-4 mr-1" />
            Import JSON
          </Button>
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
    </div>
  );
}
