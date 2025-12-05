import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { useBuildOrderStore } from "@/stores";
import { saveBuildOrder, deleteBuildOrder } from "@/lib/tauri";
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
        <Button size="sm" onClick={handleCreateNew}>
          <Plus className="w-4 h-4 mr-1" />
          New
        </Button>
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
    </div>
  );
}
