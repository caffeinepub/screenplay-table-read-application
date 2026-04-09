/**
 * TTSProviderSelector — prominent provider switcher for the Voice Studio.
 * Shows all registered providers with status badges and a loading progress bar
 * for Kokoro's model download. Includes error state with retry button and
 * clear user-visible messaging.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTTSProvider } from "@/hooks/useTTSProvider";
import type { TTSProviderStatus } from "@/lib/tts";
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Loader2,
  Mic,
  RefreshCw,
  WifiOff,
} from "lucide-react";

function statusBadge(status: TTSProviderStatus, progress: number) {
  switch (status) {
    case "ready":
      return (
        <Badge
          variant="secondary"
          className="bg-success/10 text-success border-success/20 gap-1 text-xs"
        >
          <CheckCircle2 className="w-3 h-3" />
          Ready
        </Badge>
      );
    case "loading":
      return (
        <Badge
          variant="secondary"
          className="bg-primary/10 text-primary border-primary/20 gap-1 text-xs"
        >
          <Loader2 className="w-3 h-3 animate-spin" />
          Loading {progress}%
        </Badge>
      );
    case "error":
      return (
        <Badge
          variant="secondary"
          className="bg-destructive/10 text-destructive border-destructive/20 gap-1 text-xs"
        >
          <AlertTriangle className="w-3 h-3" />
          Failed
        </Badge>
      );
    case "unavailable":
      return (
        <Badge
          variant="secondary"
          className="bg-muted text-muted-foreground text-xs gap-1"
        >
          <WifiOff className="w-3 h-3" />
          Unavailable
        </Badge>
      );
  }
}

function providerIcon(id: string) {
  if (id === "kokoro") return <Cpu className="w-4 h-4" />;
  return <Mic className="w-4 h-4" />;
}

export function TTSProviderSelector() {
  const {
    providers,
    activeProvider,
    setProvider,
    isKokoroLoading,
    kokoroProgress,
    kokoroError,
    retryKokoro,
  } = useTTSProvider();

  if (providers.length === 0) return null;

  const kokoroProvider = providers.find((p) => p.id === "kokoro");
  const kokoroIsActive = activeProvider?.id === "kokoro";

  return (
    <div className="space-y-3" data-ocid="tts-provider-selector">
      <div className="grid gap-2 sm:grid-cols-2">
        {providers.map((p) => {
          const isActive = activeProvider?.id === p.id;
          const isUnavailable = p.status === "unavailable";

          return (
            <button
              key={p.id}
              type="button"
              disabled={isUnavailable}
              onClick={() => !isUnavailable && setProvider(p.id)}
              className={`
                flex items-start gap-3 rounded-lg border px-4 py-3 text-left transition-all
                ${
                  isActive
                    ? "border-primary bg-primary/10 ring-1 ring-primary/40 shadow-sm"
                    : isUnavailable
                      ? "border-border/40 bg-muted/30 opacity-50 cursor-not-allowed"
                      : "border-border bg-card hover:border-primary/40 hover:bg-primary/5 cursor-pointer"
                }
              `}
              data-ocid={`provider-${p.id}`}
              aria-pressed={isActive}
              aria-label={`Use ${p.name}`}
            >
              <span
                className={`mt-0.5 flex-shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`}
              >
                {providerIcon(p.id)}
              </span>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-sm font-semibold ${isActive ? "text-primary" : "text-foreground"}`}
                  >
                    {p.name}
                  </span>
                  {isActive && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 h-4 bg-primary/20 text-primary border-primary/30"
                    >
                      Active
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-snug">
                  {p.description}
                </p>
                <div className="pt-0.5">
                  {statusBadge(p.status, p.loadingProgress)}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Kokoro loading progress bar */}
      {isKokoroLoading && (
        <div
          className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 space-y-2"
          data-ocid="kokoro-loading-banner"
        >
          <div className="flex items-center gap-2 text-sm text-primary">
            <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
            <span className="font-medium">
              Loading Kokoro voice model ({kokoroProgress}%)…
            </span>
          </div>
          <Progress value={kokoroProgress} className="h-1.5 bg-primary/10" />
          <p className="text-xs text-muted-foreground">
            High-quality neural voices are downloading — this happens once and
            is cached in your browser. Voice assignments are ready now, playback
            will begin once the model finishes.
          </p>
        </div>
      )}

      {/* Kokoro error banner with retry */}
      {kokoroError && kokoroProvider?.status === "error" && (
        <div
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 space-y-2"
          data-ocid="kokoro-error-banner"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-destructive">
                Kokoro TTS failed to load
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 break-words">
                {kokoroError}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {kokoroIsActive
                  ? "Falling back to browser voices for playback."
                  : "Browser voices are active as fallback."}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={retryKokoro}
              className="flex-shrink-0 gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
              data-ocid="kokoro-retry"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Kokoro ready confirmation (brief info row) */}
      {kokoroProvider?.status === "ready" && kokoroIsActive && (
        <div
          className="flex items-center gap-2 text-xs text-success px-1"
          data-ocid="kokoro-ready-indicator"
        >
          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            Kokoro neural voices active — 29 high-quality voices available
          </span>
        </div>
      )}
    </div>
  );
}
