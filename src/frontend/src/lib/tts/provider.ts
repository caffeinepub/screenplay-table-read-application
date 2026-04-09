/**
 * Core TTS provider interface — all providers implement this contract.
 * Extend by registering new providers in lib/tts/index.ts.
 */

export interface TTSVoice {
  /** Unique identifier for this voice within the provider */
  id: string;
  /** Human-readable display name */
  name: string;
  /** BCP-47 language tag, e.g. "en-US" */
  lang: string;
  /** Original provider-specific voice object (if any) */
  raw?: SpeechSynthesisVoice;
}

export interface TTSSynthesisSettings {
  voiceId?: string;
  pitch?: number;
  rate?: number;
  language?: string;
}

export type TTSProviderStatus = "loading" | "ready" | "error" | "unavailable";

export interface TTSProvider {
  /** Unique identifier used in registry */
  readonly id: string;
  /** Human-readable display name */
  readonly name: string;
  /** Short description shown in provider selector */
  readonly description: string;

  /** Whether the provider can run in this environment */
  isAvailable(): boolean;

  /** Whether the provider is ready to synthesize (model loaded, etc.) */
  isReady(): boolean;

  /** Current status for UI display */
  getStatus(): TTSProviderStatus;

  /** Optional loading progress 0–100 (providers that download models) */
  getLoadingProgress?(): number;

  /** All voices this provider offers */
  getVoices(): TTSVoice[];

  /**
   * Speak text with the given settings.
   * Resolves when speech is complete, rejects on hard error.
   */
  synthesize(text: string, settings: TTSSynthesisSettings): Promise<void>;

  /** Immediately cancel any ongoing or queued speech */
  cancel(): void;

  /** Release any resources (workers, model buffers, etc.) */
  dispose(): void;
}

/** Subscribe to provider status / progress changes */
export type TTSProviderListener = () => void;

export interface TTSProviderWithEvents extends TTSProvider {
  addListener(listener: TTSProviderListener): void;
  removeListener(listener: TTSProviderListener): void;
}
