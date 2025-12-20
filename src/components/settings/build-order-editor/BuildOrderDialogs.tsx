import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CivBadge } from "@/components/overlay/badges/CivBadge";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Upload, Loader2, Link, Search, X, Library, Globe, Zap, ArrowUpDown,
    TrendingUp, Clock, ThumbsUp, Sparkles, Flame, User, Eye, Download, Check, Swords
} from "lucide-react";
import { CIVILIZATIONS } from "@/types";
import { getCivNameFromCode, type Aoe4GuidesBuildSummary } from "@/lib/aoe4guides";
import { STRATEGY_OPTIONS } from "./constants";

interface BuildOrderDialogsProps {
    // Delete confirm
    deleteConfirm: string | null;
    onDeleteConfirmChange: (id: string | null) => void;
    onDelete: (id: string) => void;

    // Import JSON
    showImportDialog: boolean;
    onImportDialogChange: (show: boolean) => void;
    importJson: string;
    onImportJsonChange: (json: string) => void;
    importError: string | null;
    onImport: () => void;

    // Import URL (AoE4World)
    showUrlImportDialog: boolean;
    onUrlImportDialogChange: (show: boolean) => void;
    importUrl: string;
    onImportUrlChange: (url: string) => void;
    urlImportError: string | null;
    onUrlImport: () => void;
    isImporting: boolean;

    // Import URL (AoE4Guides)
    showAoe4GuidesUrlDialog: boolean;
    onAoe4GuidesUrlDialogChange: (show: boolean) => void;
    aoe4GuidesUrl: string;
    onAoe4GuidesUrlChange: (url: string) => void;
    aoe4GuidesUrlError: string | null;
    onAoe4GuidesUrlImport: () => void;

    // Browse AOE4 Guides
    showBrowseDialog: boolean;
    onBrowseDialogChange: (show: boolean) => void;
    filteredBrowseResults: Aoe4GuidesBuildSummary[];
    browseCivFilter: string;
    onBrowseCivFilterChange: (civ: string) => void;
    browseSearchQuery: string;
    onBrowseSearchQueryChange: (query: string) => void;
    browseStrategyFilter: string;
    onBrowseStrategyFilterChange: (strategy: string) => void;
    browseMatchupFilter: string;
    onBrowseMatchupFilterChange: (civ: string) => void;
    browseSortBy: "popular" | "recent" | "upvotes";
    onBrowseSortByChange: (sort: "popular" | "recent" | "upvotes") => void;
    isBrowsing: boolean;
    browseError: string | null;
    onRefreshBrowse: () => void;
    onImportFromBrowse: (id: string) => void;
    // Track already-imported builds
    importedAoe4GuidesIds: Set<string>;
}

export function BuildOrderDialogs({
    deleteConfirm,
    onDeleteConfirmChange,
    onDelete,
    showImportDialog,
    onImportDialogChange,
    importJson,
    onImportJsonChange,
    importError,
    onImport,
    showUrlImportDialog,
    onUrlImportDialogChange,
    importUrl,
    onImportUrlChange,
    urlImportError,
    onUrlImport,
    isImporting,
    showAoe4GuidesUrlDialog,
    onAoe4GuidesUrlDialogChange,
    aoe4GuidesUrl,
    onAoe4GuidesUrlChange,
    aoe4GuidesUrlError,
    onAoe4GuidesUrlImport,
    showBrowseDialog,
    onBrowseDialogChange,
    filteredBrowseResults,
    browseCivFilter,
    onBrowseCivFilterChange,
    browseSearchQuery,
    onBrowseSearchQueryChange,
    browseStrategyFilter,
    onBrowseStrategyFilterChange,
    browseMatchupFilter,
    onBrowseMatchupFilterChange,
    browseSortBy,
    onBrowseSortByChange,
    isBrowsing,
    browseError,
    onRefreshBrowse,
    onImportFromBrowse,
    importedAoe4GuidesIds,
}: BuildOrderDialogsProps) {
    return (
        <>
            <AlertDialog
                open={!!deleteConfirm}
                onOpenChange={(open) => !open && onDeleteConfirmChange(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete build order?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove this build order from your library. This action cannot be
                            undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteConfirm && onDelete(deleteConfirm)}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog
                open={showImportDialog}
                onOpenChange={(open) => {
                    onImportDialogChange(open);
                    if (!open) {
                        onImportJsonChange("");
                    }
                }}
            >
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
                            onChange={(e) => onImportJsonChange(e.target.value)}
                            className="min-h-[200px] font-mono text-xs"
                        />
                        {importError && (
                            <p className="text-sm text-destructive">{importError}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => onImportDialogChange(false)}>
                            Cancel
                        </Button>
                        <Button onClick={onImport} disabled={!importJson.trim()}>
                            <Upload className="w-4 h-4 mr-1" />
                            Import Build Order
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={showUrlImportDialog}
                onOpenChange={(open) => {
                    onUrlImportDialogChange(open);
                    if (!open) {
                        onImportUrlChange("");
                    }
                }}
            >
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
                            onChange={(e) => onImportUrlChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && importUrl.trim() && !isImporting) {
                                    onUrlImport();
                                }
                            }}
                        />
                        {urlImportError && <p className="text-sm text-destructive">{urlImportError}</p>}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => onUrlImportDialogChange(false)}
                            disabled={isImporting}
                        >
                            Cancel
                        </Button>
                        <Button onClick={onUrlImport} disabled={!importUrl.trim() || isImporting}>
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

            <Dialog
                open={showAoe4GuidesUrlDialog}
                onOpenChange={(open) => {
                    onAoe4GuidesUrlDialogChange(open);
                    if (!open) {
                        onAoe4GuidesUrlChange("");
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
                            onChange={(e) => onAoe4GuidesUrlChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && aoe4GuidesUrl.trim() && !isImporting) {
                                    onAoe4GuidesUrlImport();
                                }
                            }}
                        />
                        {aoe4GuidesUrlError && <p className="text-sm text-destructive">{aoe4GuidesUrlError}</p>}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => onAoe4GuidesUrlDialogChange(false)}
                            disabled={isImporting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={onAoe4GuidesUrlImport}
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

            <Dialog
                open={showBrowseDialog}
                onOpenChange={(open) => {
                    onBrowseDialogChange(open);
                }}
            >
                <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
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
                        <div className="flex flex-col gap-3 flex-shrink-0">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search builds..."
                                    value={browseSearchQuery}
                                    onChange={(e) => onBrowseSearchQueryChange(e.target.value)}
                                    className="pl-10 bg-muted/50"
                                />
                                {browseSearchQuery && (
                                    <button
                                        onClick={() => onBrowseSearchQueryChange("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <Select
                                    value={browseCivFilter || "all"}
                                    onValueChange={(value) => onBrowseCivFilterChange(value === "all" ? "" : value)}
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

                                <Select
                                    value={browseStrategyFilter || "all"}
                                    onValueChange={(value) => onBrowseStrategyFilterChange(value === "all" ? "" : value)}
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

                                <Select
                                    value={browseMatchupFilter || "all"}
                                    onValueChange={(value) => onBrowseMatchupFilterChange(value === "all" ? "" : value)}
                                >
                                    <SelectTrigger className="w-[140px] bg-muted/50">
                                        <Swords className="w-4 h-4 mr-2 text-muted-foreground" />
                                        <SelectValue placeholder="vs Any" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">vs Any Civ</SelectItem>
                                        {CIVILIZATIONS.map((civ) => (
                                            <SelectItem key={civ} value={civ}>
                                                vs {civ}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={browseSortBy}
                                    onValueChange={(value) => onBrowseSortByChange(value as "popular" | "recent" | "upvotes")}
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

                                <Button
                                    onClick={onRefreshBrowse}
                                    disabled={isBrowsing}
                                    size="sm"
                                    className="bg-gradient-to-r from-amber-500 to-orange-600 border-none text-white"
                                >
                                    {isBrowsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                                    Refresh
                                </Button>

                                {filteredBrowseResults.length > 0 && !isBrowsing && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto">
                                        <Sparkles className="w-4 h-4 text-amber-500" />
                                        <span className="font-medium">{filteredBrowseResults.length}</span>
                                        <span>builds</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {browseError && (
                            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                                {browseError}
                            </div>
                        )}

                        <ScrollArea className="flex-1 min-h-0 -mx-2 px-2">
                            <div className="grid gap-3 pb-2">
                                {filteredBrowseResults.map((build) => (
                                    <div
                                        key={build.id}
                                        className="group p-4 rounded-xl border bg-card/50 hover:bg-card hover:border-amber-500/30 transition-all duration-200"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-base group-hover:text-amber-500 transition-colors">
                                                    {build.title}
                                                </h4>

                                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                    <CivBadge civilization={getCivNameFromCode(build.civ)} size="sm" />
                                                    {build.strategy && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-[10px] bg-amber-500/10 text-amber-700 border-amber-500/20"
                                                        >
                                                            <Flame className="w-3 h-3 mr-1" />
                                                            {build.strategy}
                                                        </Badge>
                                                    )}
                                                    {importedAoe4GuidesIds.has(build.id) && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-[10px] bg-green-500/10 text-green-700 border-green-500/20"
                                                        >
                                                            <Check className="w-3 h-3 mr-1" />
                                                            Imported
                                                        </Badge>
                                                    )}
                                                </div>

                                                {build.description && (
                                                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                                                        {build.description}
                                                    </p>
                                                )}

                                                <div className="flex items-center gap-4 mt-3">
                                                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Eye className="w-3.5 h-3.5" />
                                                        {build.views.toLocaleString()}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <ThumbsUp className="w-3.5 h-3.5" />
                                                        {build.upvotes}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <User className="w-3.5 h-3.5" />
                                                        {build.author}
                                                    </span>
                                                </div>
                                            </div>

                                            <Button
                                                size="sm"
                                                className={`flex-shrink-0 ${
                                                    importedAoe4GuidesIds.has(build.id)
                                                        ? "bg-muted text-muted-foreground hover:bg-muted/80"
                                                        : "bg-gradient-to-r from-amber-500 to-orange-600 text-white"
                                                }`}
                                                onClick={() => onImportFromBrowse(build.id)}
                                                disabled={isImporting}
                                            >
                                                {isImporting ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : importedAoe4GuidesIds.has(build.id) ? (
                                                    <>
                                                        <Download className="w-4 h-4 mr-1.5" />
                                                        Re-import
                                                    </>
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
                                        <p className="text-sm font-medium">No builds found</p>
                                        <p className="text-xs mt-1">Try adjusting your filters or search query</p>
                                    </div>
                                )}

                                {isBrowsing && (
                                    <div className="text-center py-16 text-muted-foreground">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-amber-500" />
                                        <p className="text-sm font-medium">Loading builds...</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    <DialogFooter className="flex-shrink-0 border-t px-6 py-4 bg-muted/30">
                        <div className="flex items-center justify-between w-full">
                            <p className="text-xs text-muted-foreground">Powered by AOE4 Guides API</p>
                            <Button variant="outline" onClick={() => onBrowseDialogChange(false)}>
                                Close
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
