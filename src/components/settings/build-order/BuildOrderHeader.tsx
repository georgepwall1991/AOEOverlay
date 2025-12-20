import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Search, X, Library, Download, Globe, Upload, Plus, ChevronDown
} from "lucide-react";

interface BuildOrderHeaderProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onBrowseClick: () => void;
    onImportAoe4World: () => void;
    onImportAoe4Guides: () => void;
    onImportJson: () => void;
    onCreateNew: () => void;
}

export function BuildOrderHeader({
    searchQuery,
    onSearchChange,
    onBrowseClick,
    onImportAoe4World,
    onImportAoe4Guides,
    onImportJson,
    onCreateNew,
}: BuildOrderHeaderProps) {
    return (
        <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search local builds..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10 h-9 bg-muted/20 border-white/5 focus-visible:ring-amber-500/50"
                />
                {searchQuery && (
                    <button
                        onClick={() => onSearchChange("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
            <div className="flex gap-2">
                {/* Browse AOE4 Guides */}
                <Button
                    size="sm"
                    variant="outline"
                    onClick={onBrowseClick}
                    className="h-9 border-amber-500/30 hover:bg-amber-500/10"
                >
                    <Library className="w-4 h-4 mr-1 text-amber-500" />
                    Browse
                </Button>

                {/* Import dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline" className="h-9">
                            <Download className="w-4 h-4 mr-1" />
                            Import
                            <ChevronDown className="w-3 h-3 ml-1" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={onImportAoe4World}>
                            <Globe className="w-4 h-4 mr-2" />
                            From aoe4world.com
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onImportAoe4Guides}>
                            <Globe className="w-4 h-4 mr-2" />
                            From aoe4guides.com
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onImportJson}>
                            <Upload className="w-4 h-4 mr-2" />
                            From JSON (age4builder)
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Button size="sm" onClick={onCreateNew} className="h-9 bg-amber-600 hover:bg-amber-700">
                    <Plus className="w-4 h-4 mr-1" />
                    New
                </Button>
            </div>
        </div>
    );
}
