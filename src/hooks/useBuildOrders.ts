import { useEffect } from "react";
import { useBuildOrderStore } from "@/stores";
import { getBuildOrders, saveBuildOrder, deleteBuildOrder } from "@/lib/tauri";
import type { BuildOrder } from "@/types";

export function useBuildOrders() {
  const { buildOrders, setBuildOrders, isLoading } = useBuildOrderStore();

  useEffect(() => {
    const loadBuildOrders = async () => {
      try {
        const orders = await getBuildOrders();
        setBuildOrders(orders);
      } catch (error) {
        console.error("Failed to load build orders:", error);
        setBuildOrders([]);
      }
    };

    loadBuildOrders();
  }, [setBuildOrders]);

  const addBuildOrder = async (order: BuildOrder) => {
    try {
      await saveBuildOrder(order);
      const orders = await getBuildOrders();
      setBuildOrders(orders);
    } catch (error) {
      console.error("Failed to save build order:", error);
    }
  };

  const removeBuildOrder = async (id: string) => {
    try {
      await deleteBuildOrder(id);
      const orders = await getBuildOrders();
      setBuildOrders(orders);
    } catch (error) {
      console.error("Failed to delete build order:", error);
    }
  };

  const updateBuildOrder = async (order: BuildOrder) => {
    try {
      await saveBuildOrder(order);
      const orders = await getBuildOrders();
      setBuildOrders(orders);
    } catch (error) {
      console.error("Failed to update build order:", error);
    }
  };

  return { buildOrders, isLoading, addBuildOrder, removeBuildOrder, updateBuildOrder };
}
