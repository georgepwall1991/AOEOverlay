import { ScrollArea } from "@/components/ui/scroll-area";
import { BuildOrderItem } from "./BuildOrderItem";
import type { BuildOrder } from "@/types";

interface BuildOrderListProps {
    orders: BuildOrder[];
    onToggleEnabled: (order: BuildOrder) => void;
    onTogglePin: (order: BuildOrder) => void;
    onToggleFavorite: (order: BuildOrder) => void;
    onEdit: (order: BuildOrder) => void;
    onDeleteRequest: (orderId: string) => void;
    onExport?: (orderId: string) => void;
}

export function BuildOrderList({
    orders,
    onToggleEnabled,
    onTogglePin,
    onToggleFavorite,
    onEdit,
    onDeleteRequest,
    onExport,
}: BuildOrderListProps) {
    if (orders.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground border border-dashed rounded-xl">
                <p className="text-sm">No matching build orders</p>
                <p className="text-xs mt-1">Try adjusting your filters</p>
            </div>
        );
    }

    return (
        <ScrollArea className="h-[450px] pr-4">
            <div className="space-y-2">
                {orders.map((order) => (
                    <BuildOrderItem
                        key={order.id}
                        order={order}
                        onToggleEnabled={onToggleEnabled}
                        onTogglePin={onTogglePin}
                        onToggleFavorite={onToggleFavorite}
                        onEdit={onEdit}
                        onDeleteRequest={onDeleteRequest}
                        onExport={onExport}
                    />
                ))}
            </div>
        </ScrollArea>
    );
}
