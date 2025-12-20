import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CivBadge } from "@/components/overlay/CivBadge";
import {
    Pin, Star, StarOff, Pencil, Trash2,
    ToggleLeft, ToggleRight, List, Download
} from "lucide-react";
import type { BuildOrder } from "@/types";

interface BuildOrderItemProps {
    order: BuildOrder;
    onToggleEnabled: (order: BuildOrder) => void;
    onTogglePin: (order: BuildOrder) => void;
    onToggleFavorite: (order: BuildOrder) => void;
    onEdit: (order: BuildOrder) => void;
    onDeleteRequest: (orderId: string) => void;
    onExport?: (orderId: string) => void;
}

export function BuildOrderItem({
    order,
    onToggleEnabled,
    onTogglePin,
    onToggleFavorite,
    onEdit,
    onDeleteRequest,
    onExport,
}: BuildOrderItemProps) {
    return (
        <div
            className={`group flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${order.pinned
                    ? "bg-amber-500/5 border-amber-500/30 shadow-lg shadow-amber-500/5"
                    : "bg-card/50 hover:bg-card border-white/5 hover:border-white/10"
                }`}
        >
            {/* Enable/Disable toggle */}
            <button
                onClick={() => onToggleEnabled(order)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                title={order.enabled ? "Disable" : "Enable"}
            >
                {order.enabled ? (
                    <div className="relative w-6 h-6 flex items-center justify-center">
                        <div className="absolute inset-0 bg-green-500/20 rounded-full animate-pulse" />
                        <ToggleRight className="relative w-5 h-5 text-green-500" />
                    </div>
                ) : (
                    <ToggleLeft className="w-5 h-5" />
                )}
            </button>

            {/* Build order info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span
                        className={`font-semibold truncate ${!order.enabled ? "text-muted-foreground font-normal" : "text-foreground"
                            }`}
                    >
                        {order.name || "Untitled"}
                    </span>
                    {order.pinned && (
                        <Badge className="text-[9px] h-4 bg-amber-500/20 text-amber-300 border-amber-500/30 flex items-center gap-1">
                            <Pin className="w-2 h-2" />
                            AUTO-LOAD
                        </Badge>
                    )}
                    {order.favorite && (
                        <div className="text-amber-400">
                            <Star className="w-3.5 h-3.5 fill-current" />
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <CivBadge civilization={order.civilization} size="sm" />
                    <div className="flex items-center gap-1.5 ml-1">
                        <Badge variant="outline" className="text-[9px] h-4 text-white/40 border-white/5 px-1.5">
                            <List className="w-2.5 h-2.5 mr-1" />
                            {order.steps.length}
                        </Badge>
                        <Badge
                            variant="outline"
                            className={`text-[9px] h-4 px-1.5 border-white/5 ${order.difficulty === "Beginner" ? "text-green-400" :
                                    order.difficulty === "Intermediate" ? "text-blue-400" :
                                        order.difficulty === "Advanced" ? "text-amber-400" :
                                            "text-red-400"
                                }`}
                        >
                            {order.difficulty}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Actions - hidden by default, shown on hover */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-amber-500/10"
                    onClick={() => onTogglePin(order)}
                    title={order.pinned ? "Unpin (stop auto-loading)" : "Pin (auto-load on start)"}
                >
                    <Pin className={`w-3.5 h-3.5 ${order.pinned ? "text-amber-400" : "text-muted-foreground"}`} />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-amber-500/10"
                    onClick={() => onToggleFavorite(order)}
                    title={order.favorite ? "Unfavorite" : "Favorite"}
                >
                    {order.favorite ? (
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    ) : (
                        <StarOff className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                </Button>
                {onExport && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-white/5"
                        onClick={() => onExport(order.id)}
                        title="Export"
                    >
                        <Download className="w-3.5 h-3.5" />
                    </Button>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-white/5"
                    onClick={() => onEdit(order)}
                    title="Edit"
                >
                    <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onDeleteRequest(order.id)}
                    title="Delete"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </Button>
            </div>
        </div>
    );
}
