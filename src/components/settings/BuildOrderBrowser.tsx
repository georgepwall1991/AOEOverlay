import { useState } from "react";
import { useBuildOrderStore } from "@/stores";
import { saveBuildOrder } from "@/lib/tauri";
import { importAoe4WorldBuild } from "@/lib/aoe4world";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Download, ExternalLink, Search, Info } from "lucide-react";
import type { BuildOrder } from "@/types";

export function BuildOrderBrowser() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<BuildOrder | null>(null);
  const { buildOrders, setBuildOrders } = useBuildOrderStore();

  const handleImport = async () => {
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const build = await importAoe4WorldBuild(url);
      setPreview(build);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to fetch build");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmImport = async () => {
    if (!preview) return;

    try {
      await saveBuildOrder(preview);
      setBuildOrders([...buildOrders, preview]);
      setPreview(null);
      setUrl("");
    } catch (_e: unknown) {
      setError("Failed to save build order");
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-muted/30 rounded-xl p-4 space-y-4 border border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-medium">AoE4World Import</h2>
            <p className="text-[11px] text-muted-foreground">Import any build order from aoe4world.com</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste URL (e.g. aoe4world.com/builds/123)"
            className="text-sm bg-background/50 border-white/10"
          />
          <Button onClick={handleImport} disabled={isLoading || !url.trim()} className="shrink-0">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fetch"}
          </Button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs border border-destructive/20 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {preview && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <Card className="bg-background/40 border-amber-500/30 overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-amber-100">{preview.name}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-200">
                    {preview.civilization} • {preview.difficulty}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{preview.description}</p>
                <div className="flex items-center gap-2">
                  <Button size="sm" className="flex-1 gap-2" onClick={confirmImport}>
                    <Download className="w-3.5 h-3.5" />
                    Add to my library
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setPreview(null)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Pro Player Resources
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <a
            href="https://aoe4world.com/builds"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-white/5 hover:bg-muted/30 transition-colors group"
          >
            <div className="flex flex-col">
              <span className="text-xs font-medium group-hover:text-amber-400 transition-colors">AoE4World Builds</span>
              <span className="text-[10px] text-muted-foreground">Community database</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-amber-400 transition-colors" />
          </a>
          <a
            href="https://age4builder.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-white/5 hover:bg-muted/30 transition-colors group"
          >
            <div className="flex flex-col">
              <span className="text-xs font-medium group-hover:text-amber-400 transition-colors">Age4Builder</span>
              <span className="text-[10px] text-muted-foreground">Interactive creator</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-amber-400 transition-colors" />
          </a>
        </div>
      </section>
    </div>
  );
}
