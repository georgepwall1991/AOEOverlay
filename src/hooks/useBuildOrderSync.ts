import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { getBuildOrders, BUILD_ORDERS_CHANGED_EVENT } from "@/lib/tauri";
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
        // Preserve current build order ID if possible
        const currentOrderId = buildOrders[currentOrderIndex]?.id;

        // Reload build orders from backend
        const orders = await getBuildOrders();

        // Try to find the same build order after reload
        if (currentOrderId) {
          const newIndex = orders.findIndex(o => o.id === currentOrderId);
          if (newIndex !== -1) {
            // Update orders but keep the same build order selected
            useBuildOrderStore.setState({
              buildOrders: orders,
              currentOrderIndex: newIndex,
              isLoading: false,
            });
            return;
          }
        }

        // Fallback: just set the orders
        setBuildOrders(orders);
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
