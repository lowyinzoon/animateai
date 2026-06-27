"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { GenreSelector } from "@/components/script/genre-selector";
import { ScriptEditor } from "@/components/script/script-editor";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { toast } from "sonner";
import { Wand2, FileText, Trash2 } from "lucide-react";
import type { Script } from "@/types";

export default function ScriptPage() {
  const [prompt, setPrompt] = useState("");
  const [genre, setGenre] = useState("Action");
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedScripts, setSavedScripts] = useState<Script[]>([]);
  const supabase = createClient();

  const loadScripts = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("scripts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      setSavedScripts(data);
    }
  }, [supabase]);

  useEffect(() => {
    loadScripts();
  }, [loadScripts]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setContent("");

    try {
      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, genre, length }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Generation failed");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const text = parsed.choices?.[0]?.delta?.content || "";
                fullContent += text;
                setContent(fullContent);
              } catch {
                // skip unparseable chunks
              }
            }
          }
        }
      }

      if (!title) {
        setTitle(`${genre} Script - ${new Date().toLocaleDateString()}`);
      }

      toast.success("Script generated!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const scriptTitle = title || `${genre} Script - ${new Date().toLocaleDateString()}`;

    const { error } = await supabase.from("scripts").insert({
      user_id: user.id,
      title: scriptTitle,
      content,
      genre,
    });

    if (error) {
      toast.error("Failed to save script");
      return;
    }

    // Also save as asset
    await supabase.from("assets").insert({
      user_id: user.id,
      type: "script",
      name: scriptTitle,
      prompt,
      metadata: { genre, length, content_preview: content.substring(0, 200) },
    });

    toast.success("Script saved!");
    loadScripts();
  };

  const handleLoadScript = (script: Script) => {
    setTitle(script.title);
    setContent(script.content || "");
    setGenre(script.genre || "Action");
  };

  const handleDeleteScript = async (id: string) => {
    const { error } = await supabase.from("scripts").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete script");
      return;
    }
    setSavedScripts((prev) => prev.filter((s) => s.id !== id));
    toast.success("Script deleted");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Script Writing</h1>
        <p className="text-muted-foreground mt-1">
          Generate compelling scripts and stories with AI
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Left panel - controls */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Script Title</Label>
            <Input
              id="title"
              placeholder="My Awesome Script"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">Story Concept</Label>
            <Textarea
              id="prompt"
              placeholder="Describe your story concept... e.g., 'A young wizard discovers a portal to a parallel universe where magic is forbidden'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <GenreSelector selected={genre} onSelect={setGenre} />

          <div className="space-y-2">
            <Label>Script Length</Label>
            <Select value={length} onValueChange={(v) => { if (v) setLength(v as "short" | "medium" | "long"); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Short (~500-800 words)</SelectItem>
                <SelectItem value="medium">Medium (~1500-2000 words)</SelectItem>
                <SelectItem value="long">Long (~3000-4000 words)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleGenerate}
            className="w-full"
            disabled={isGenerating || !prompt.trim()}
          >
            {isGenerating ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Script
              </>
            )}
          </Button>

          {/* Saved Scripts */}
          <Separator />
          <h3 className="text-sm font-semibold">Saved Scripts</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {savedScripts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No saved scripts yet</p>
            ) : (
              savedScripts.map((script) => (
                <Card key={script.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardHeader className="p-3 pb-1">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium flex items-center gap-2" onClick={() => handleLoadScript(script)}>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {script.title}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteScript(script.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <p className="text-xs text-muted-foreground">
                      {script.genre} &middot;{" "}
                      {new Date(script.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Right panel - editor */}
        <div>
          <ScriptEditor content={content} onChange={setContent} onSave={handleSave} />
        </div>
      </div>
    </div>
  );
}
