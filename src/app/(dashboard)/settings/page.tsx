"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { toast } from "sonner";
import { Save, Eye, EyeOff, Key } from "lucide-react";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [klingKey, setKlingKey] = useState("");
  const [showOpenrouter, setShowOpenrouter] = useState(false);
  const [showKling, setShowKling] = useState(false);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (user?.user_metadata?.api_keys) {
      const keys = user.user_metadata.api_keys;
      setOpenrouterKey(keys.openrouter || "");
      setKlingKey(keys.kling || "");
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase.auth.updateUser({
      data: {
        api_keys: {
          openrouter: openrouterKey,
          kling: klingKey,
        },
      },
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("API keys saved!");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your API keys for AI features
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Image & Script Generation
                </CardTitle>
                <CardDescription>
                  OpenRouter API key for image generation, script writing, and
                  storyboard parsing
                </CardDescription>
              </div>
              {openrouterKey ? (
                <Badge variant="secondary">Configured</Badge>
              ) : (
                <Badge variant="outline">Not set</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="openrouter">OpenRouter API Key</Label>
              <div className="relative">
                <Input
                  id="openrouter"
                  type={showOpenrouter ? "text" : "password"}
                  value={openrouterKey}
                  onChange={(e) => setOpenrouterKey(e.target.value)}
                  placeholder="sk-or-v1-..."
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowOpenrouter(!showOpenrouter)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showOpenrouter ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Used for image generation, script writing, and storyboard
                parsing. Get your key at{" "}
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  openrouter.ai/keys
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Video Generation
                </CardTitle>
                <CardDescription>
                  Kling AI API key for video generation
                </CardDescription>
              </div>
              {klingKey ? (
                <Badge variant="secondary">Configured</Badge>
              ) : (
                <Badge variant="outline">Not set</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="kling">Kling API Key</Label>
              <div className="relative">
                <Input
                  id="kling"
                  type={showKling ? "text" : "password"}
                  value={klingKey}
                  onChange={(e) => setKlingKey(e.target.value)}
                  placeholder="sk-..."
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKling(!showKling)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKling ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Used for AI video generation via KIE AI
              </p>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving}>
          {saving ? (
            <LoadingSpinner className="mr-2 h-4 w-4" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save API Keys
        </Button>
      </form>
    </div>
  );
}
