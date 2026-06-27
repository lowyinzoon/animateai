import { Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function ComingSoon({ title, description, icon: Icon }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="rounded-full bg-muted p-6 mb-6">
        <Icon className="h-12 w-12 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-muted-foreground mt-2 max-w-md">{description}</p>
      <div className="flex items-center gap-2 mt-6 text-sm text-muted-foreground">
        <Lock className="h-4 w-4" />
        <span>Coming in Phase 2</span>
      </div>
    </div>
  );
}
