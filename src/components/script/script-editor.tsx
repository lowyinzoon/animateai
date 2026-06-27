"use client";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Copy, Download, Save } from "lucide-react";
import { toast } from "sonner";

interface ScriptEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave?: () => void;
  readOnly?: boolean;
}

export function ScriptEditor({ content, onChange, onSave, readOnly }: ScriptEditorProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `script-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Script</label>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!content}>
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDownload} disabled={!content}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          {onSave && (
            <Button variant="ghost" size="sm" onClick={onSave} disabled={!content}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          )}
        </div>
      </div>
      <Textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Your generated script will appear here..."
        className="min-h-[500px] font-mono text-sm resize-none"
        readOnly={readOnly}
      />
    </div>
  );
}
