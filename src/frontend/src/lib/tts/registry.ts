/**
 * TTS Provider Registry — singleton that manages all registered providers.
 * Persist active provider choice to localStorage so it survives page reloads.
 */

import type { TTSProvider, TTSProviderListener } from "./provider";

const STORAGE_KEY = "tts_active_provider";

class TTSRegistry {
  private providers: Map<string, TTSProvider> = new Map();
  private activeId: string | null = null;
  private listeners: Set<TTSProviderListener> = new Set();

  /** Register a provider. First registered becomes the default. */
  registerProvider(provider: TTSProvider): void {
    this.providers.set(provider.id, provider);
    // First registered = default if nothing persisted yet
    if (this.activeId === null) {
      const stored = this.readStorage();
      this.activeId = stored ?? provider.id;
    }
    this.notify();
  }

  getProvider(id: string): TTSProvider | undefined {
    return this.providers.get(id);
  }

  listProviders(): TTSProvider[] {
    return Array.from(this.providers.values());
  }

  getActiveProvider(): TTSProvider | undefined {
    if (this.activeId && this.providers.has(this.activeId)) {
      return this.providers.get(this.activeId);
    }
    // Fall back to first available
    return this.providers.values().next().value;
  }

  setActiveProvider(id: string): void {
    if (!this.providers.has(id)) return;
    this.activeId = id;
    this.writeStorage(id);
    this.notify();
  }

  getActiveId(): string | null {
    return this.activeId;
  }

  /** Subscribe to registry changes (provider switch, status update) */
  addListener(listener: TTSProviderListener): void {
    this.listeners.add(listener);
  }

  removeListener(listener: TTSProviderListener): void {
    this.listeners.delete(listener);
  }

  notify(): void {
    for (const l of this.listeners) l();
  }

  private readStorage(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private writeStorage(id: string): void {
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore — storage may be unavailable
    }
  }
}

export const ttsRegistry = new TTSRegistry();
