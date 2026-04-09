import { Film } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/15 border border-primary/30">
          <Film className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight font-display bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Screenplay Table Read
          </h1>
          <p className="text-xs text-muted-foreground leading-none">
            Bring your script to life
          </p>
        </div>
      </div>
    </header>
  );
}
