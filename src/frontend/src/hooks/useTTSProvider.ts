/**
 * useTTSProvider — React hook for observing and controlling the TTS registry.
 * Re-renders whenever the active provider changes or its status updates.
 */

import { ttsRegistry } from "@/lib/tts";
import type { TTSProviderStatus, TTSVoice } from "@/lib/tts";
import type { KokoroProvider } from "@/lib/tts/kokoro-provider";
import { useCallback, useEffect, useSyncExternalStore } from "react";

interface TTSProviderInfo {
  id: string;
  name: string;
  description: string;
  status: TTSProviderStatus;
  loadingProgress: number;
  loadError: string | null;
  voices: TTSVoice[];
}

interface UseTTSProviderReturn {
  /** Currently active provider info */
  activeProvider: TTSProviderInfo | null;
  /** All registered providers */
  providers: TTSProviderInfo[];
  /** Switch to a different provider by id */
  setProvider: (id: string) => void;
  /** Is Kokoro currently downloading / loading? */
  isKokoroLoading: boolean;
  /** Kokoro loading progress 0–100 */
  kokoroProgress: number;
  /** Kokoro load error message if status === 'error' */
  kokoroError: string | null;
  /** Retry loading Kokoro after an error */
  retryKokoro: () => void;
}

function getSnapshot(): string {
  // Return a stable string that changes whenever registry state changes.
  // We encode activeId + statuses of all providers.
  const parts = [ttsRegistry.getActiveId() ?? "none"];
  for (const p of ttsRegistry.listProviders()) {
    const progress =
      "getLoadingProgress" in p
        ? (p as KokoroProvider).getLoadingProgress()
        : 0;
    const error =
      "getLoadError" in p ? ((p as KokoroProvider).getLoadError() ?? "") : "";
    parts.push(`${p.id}:${p.getStatus()}:${progress}:${error}`);
  }
  return parts.join("|");
}

function subscribe(callback: () => void): () => void {
  ttsRegistry.addListener(callback);

  // Also subscribe to individual provider events if they support it
  for (const p of ttsRegistry.listProviders()) {
    if ("addListener" in p) {
      (p as KokoroProvider).addListener(callback);
    }
  }

  return () => {
    ttsRegistry.removeListener(callback);
    for (const p of ttsRegistry.listProviders()) {
      if ("removeListener" in p) {
        (p as KokoroProvider).removeListener(callback);
      }
    }
  };
}

function buildProviderInfo(id: string): TTSProviderInfo | null {
  const p = ttsRegistry.getProvider(id);
  if (!p) return null;
  const progress =
    "getLoadingProgress" in p ? (p as KokoroProvider).getLoadingProgress() : 0;
  const loadError =
    "getLoadError" in p ? (p as KokoroProvider).getLoadError() : null;
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.getStatus(),
    loadingProgress: progress,
    loadError,
    voices: p.getVoices(),
  };
}

export function useTTSProvider(): UseTTSProviderReturn {
  // useSyncExternalStore keeps this hook in sync with registry state
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const activeProvider = ttsRegistry.getActiveProvider();
  const allProviders = ttsRegistry.listProviders();

  const providers = allProviders
    .map((p) => buildProviderInfo(p.id))
    .filter((p): p is TTSProviderInfo => p !== null);

  const activeInfo = activeProvider
    ? buildProviderInfo(activeProvider.id)
    : null;

  const setProvider = useCallback((id: string) => {
    ttsRegistry.setActiveProvider(id);
  }, []);

  // Keep Web Speech voices in sync with language (re-check on mount)
  useEffect(() => {
    const webSpeech = ttsRegistry.getProvider("web-speech");
    if (webSpeech && "ensureInitialized" in webSpeech) {
      (
        webSpeech as import("@/lib/tts/web-speech-provider").WebSpeechProvider
      ).ensureInitialized();
    }
  }, []);

  const kokoroProvider = ttsRegistry.getProvider("kokoro") as
    | KokoroProvider
    | undefined;
  const isKokoroLoading = kokoroProvider?.getStatus() === "loading";
  const kokoroProgress = kokoroProvider?.getLoadingProgress() ?? 0;
  const kokoroError = kokoroProvider?.getLoadError?.() ?? null;

  const retryKokoro = useCallback(() => {
    const kp = ttsRegistry.getProvider("kokoro") as KokoroProvider | undefined;
    kp?.retry().catch(() => {
      // Error captured in provider state
    });
  }, []);

  return {
    activeProvider: activeInfo,
    providers,
    setProvider,
    isKokoroLoading,
    kokoroProgress,
    kokoroError,
    retryKokoro,
  };
}
