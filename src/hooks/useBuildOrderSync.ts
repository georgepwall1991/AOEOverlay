import { useEffect } from "react";
import { getBuildOrders, BUILD_ORDERS_CHANGED_EVENT, listen } from "@/lib/tauri";
import { useBuildOrderStore } from "@/stores";

/**
 * Hook to sync build orders across windows.
 * Listens for build order change events and reloads from backend.
 */
export function useBuildOrderSync() {
  const { setBuildOrders, currentOrderIndex, buildOrders } = useBuildOrderStore();

  useEffect(() => {
    const unlistenPromise = listen(BUILD_ORDERS_CHANGED_EVENT, async () => {
      try {
        const currentOrderId = buildOrders[currentOrderIndex]?.id;
        const orders = await getBuildOrders();

        // Try to preserve current selection
        if (!currentOrderId) {
          setBuildOrders(orders);
          return;
        }

        const newIndex = orders.findIndex(o => o.id === currentOrderId);
        if (newIndex === -1) {
          // Current order was deleted, just set orders
          setBuildOrders(orders);
          return;
        }

        // Keep the same build order selected
        useBuildOrderStore.setState({
          buildOrders: orders,
          currentOrderIndex: newIndex,
          isLoading: false,
        });
      } catch (error) {
        console.error("Failed to reload build orders:", error);
      }
    });

    return () => {
      unlistenPromise
        .then((unlisten) => unlisten())
        .catch((error) =>
          console.error("Failed to clean up build order sync listener:", error)
        );
    };
  }, [setBuildOrders, currentOrderIndex, buildOrders]);
}
