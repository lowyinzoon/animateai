"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { createClient } from "@/lib/supabase/client";
import { FileText, Import } from "lucide-react";
import { toast } from "sonner";
import type { StoryboardPanel } from "@/types";

interface ScriptImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (panels: StoryboardPanel[], scriptId: string) => void;
}

interface ScriptItem {
  id: string;
  title: string;
  content: string | null;
  created_at: string;
}

export function ScriptImportDialog({
  open,
  onOpenChange,
  onImport,
}: ScriptImportDialogProps) {
  const [scripts, setScripts] = useState<ScriptItem[]>([]);
  const [selectedScript, setSelectedScript] = useState<ScriptItem | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (open) {
      loadScripts();
    }
  }, [open]);

  const loadScripts = async () => {
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Load scripts from assets table (type = "script")
      const { data } = await supabase
        .from("assets")
        .select("id, name, prompt, metadata, created_at")
        .eq("user_id", user.id)
        .eq("type", "script")
        .order("created_at", { ascending: false });

      if (data) {
        setScripts(
          data.map((s) => ({
            id: s.id,
            title: s.name || "Untitled Script",
            content: (s.metadata as Record<string, unknown>)?.content as string || s.prompt || null,
            created_at: s.created_at,
          }))
        );
      }
    } catch {
      toast.error("Failed to load scripts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedScript?.content) {
      toast.error("Selected script has no content");
      return;
    }

    setIsParsing(true);
    try {
      const response = await fetch("/api/parse-script-to-panels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script_content: selectedScript.content }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to parse script");
      }

      toast.success(`Imported ${data.panels.length} panels from script`);
      onImport(data.panels, selectedScript.id);
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import from Script</DialogTitle>
          <DialogDescription>
            Select a script to automatically generate storyboard panels from its content.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner className="h-6 w-6" />
          </div>
        ) : scripts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No scripts found. Create a script first to import it.
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2">
                {scripts.map((script) => (
                  <Card
                    key={script.id}
                    className={`p-3 cursor-pointer transition-colors duration-200 ${
                      selectedScript?.id === script.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-accent/50"
                    }`}
                    onClick={() => setSelectedScript(script)}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {script.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(script.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            <Button
              className="w-full"
              disabled={!selectedScript || isParsing}
              onClick={handleImport}
            >
              {isParsing ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Parsing script...
                </>
              ) : (
                <>
                  <Import className="mr-2 h-4 w-4" />
                  Import Panels
                </>
              )}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
