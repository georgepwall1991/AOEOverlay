import { useState } from "react";
import { useBuildOrderStore } from "@/stores";
import { saveBuildOrder } from "@/lib/tauri";
import type { BuildOrder } from "@/types";
import { useBuildOrderFiltering } from "@/hooks/useBuildOrderFiltering";
import { useBuildOrderDialogs } from "@/hooks/useBuildOrderDialogs";
import { BuildOrderEditor } from "./BuildOrderEditor";
import { BuildOrderHeader } from "./BuildOrderHeader";
import { BuildOrderDialogs } from "./BuildOrderDialogs";
import { BuildOrderList } from "./BuildOrderList";

interface BuildOrderManagerProps {
  filterCiv?: string;
  filterDiff?: string;
  onExport?: (orderId: string) => void;
}

export function BuildOrderManager({ filterCiv, filterDiff, onExport }: BuildOrderManagerProps) {
  const { buildOrders, setBuildOrders } = useBuildOrderStore();
  const [editingOrder, setEditingOrder] = useState<BuildOrder | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Use the dialogs hook for all dialog state management
  const dialogs = useBuildOrderDialogs({ buildOrders, setBuildOrders });

  // Use filtering hook for search
  const { searchQuery, setSearchQuery, filteredOrders } = useBuildOrderFiltering({
    buildOrders,
    filterCiv,
    filterDiff,
  });

  // Build order handlers
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
        onBrowseClick={() => dialogs.browseDialog.setShow(true)}
        onImportAoe4World={() => dialogs.importUrlDialog.setShow(true)}
        onImportAoe4Guides={() => dialogs.importAoe4GuidesDialog.setShow(true)}
        onImportJson={() => dialogs.importJsonDialog.setShow(true)}
        onImportText={() => dialogs.importTextDialog.setShow(true)}
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
          onDeleteRequest={dialogs.deleteDialog.setConfirmId}
          onExport={onExport}
        />
      )}

      <BuildOrderDialogs dialogs={dialogs} />
    </div>
  );
}
