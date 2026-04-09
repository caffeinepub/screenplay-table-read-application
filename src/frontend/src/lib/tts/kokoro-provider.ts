/**
 * KokoroProvider — wraps kokoro-js for high-quality in-browser TTS.
 * The ONNX model is proactively loaded on initialize() and lazy-loaded
 * on first synthesize() as a fallback.
 * Loading progress (0-100) is tracked and exposed for the UI.
 *
 * API: KokoroTTS.from_pretrained(model_id, { dtype, progress_callback })
 * Returns: RawAudio with .toBlob() → Blob playable as audio/wav
 */

import type {
  TTSProvider,
  TTSProviderListener,
  TTSProviderStatus,
  TTSSynthesisSettings,
  TTSVoice,
} from "./provider";

// Built-in Kokoro voice list (kokoro-js 1.x bundled voices)
export const KOKORO_VOICES: TTSVoice[] = [
  { id: "af_heart", name: "Heart (F)", lang: "en-US" },
  { id: "af_bella", name: "Bella (F)", lang: "en-US" },
  { id: "af_nicole", name: "Nicole (F)", lang: "en-US" },
  { id: "af_aoede", name: "Aoede (F)", lang: "en-US" },
  { id: "af_kore", name: "Kore (F)", lang: "en-US" },
  { id: "af_sarah", name: "Sarah (F)", lang: "en-US" },
  { id: "af_nova", name: "Nova (F)", lang: "en-US" },
  { id: "af_sky", name: "Sky (F)", lang: "en-US" },
  { id: "af_alloy", name: "Alloy (F)", lang: "en-US" },
  { id: "af_jessica", name: "Jessica (F)", lang: "en-US" },
  { id: "af_river", name: "River (F)", lang: "en-US" },
  { id: "am_adam", name: "Adam (M)", lang: "en-US" },
  { id: "am_michael", name: "Michael (M)", lang: "en-US" },
  { id: "am_fenrir", name: "Fenrir (M)", lang: "en-US" },
  { id: "am_puck", name: "Puck (M)", lang: "en-US" },
  { id: "am_echo", name: "Echo (M)", lang: "en-US" },
  { id: "am_eric", name: "Eric (M)", lang: "en-US" },
  { id: "am_liam", name: "Liam (M)", lang: "en-US" },
  { id: "am_onyx", name: "Onyx (M)", lang: "en-US" },
  { id: "am_santa", name: "Santa (M)", lang: "en-US" },
  { id: "am_zeus", name: "Zeus (M)", lang: "en-US" },
  { id: "bf_emma", name: "Emma / British (F)", lang: "en-GB" },
  { id: "bf_isabella", name: "Isabella / British (F)", lang: "en-GB" },
  { id: "bf_alice", name: "Alice / British (F)", lang: "en-GB" },
  { id: "bf_lily", name: "Lily / British (F)", lang: "en-GB" },
  { id: "bm_george", name: "George / British (M)", lang: "en-GB" },
  { id: "bm_fable", name: "Fable / British (M)", lang: "en-GB" },
  { id: "bm_lewis", name: "Lewis / British (M)", lang: "en-GB" },
  { id: "bm_daniel", name: "Daniel / British (M)", lang: "en-GB" },
];

const KOKORO_MODEL_ID = "onnx-community/Kokoro-82M-v1.0";

interface KokoroInstance {
  generate(
    text: string,
    options: { voice: string; speed?: number },
  ): Promise<{ toBlob(): Promise<Blob> }>;
}

interface KokoroProgressInfo {
  status: string;
  progress?: number;
}

export class KokoroProvider implements TTSProvider {
  readonly id = "kokoro";
  readonly name = "Kokoro TTS";
  readonly description =
    "High-quality neural voices (82M params, runs locally)";

  private status: TTSProviderStatus = "unavailable";
  private loadingProgress = 0;
  private loadError: string | null = null;
  private listeners: Set<TTSProviderListener> = new Set();
  private tts: KokoroInstance | null = null;
  private loadPromise: Promise<void> | null = null;
  private currentAudio: HTMLAudioElement | null = null;

  isAvailable(): boolean {
    return (
      typeof window !== "undefined" &&
      typeof WebAssembly !== "undefined" &&
      typeof window.AudioContext !== "undefined"
    );
  }

  isReady(): boolean {
    return this.status === "ready";
  }

  getStatus(): TTSProviderStatus {
    return this.status;
  }

  getLoadingProgress(): number {
    return this.loadingProgress;
  }

  /** Returns the last error message if status === 'error', otherwise null */
  getLoadError(): string | null {
    return this.loadError;
  }

  getVoices(): TTSVoice[] {
    return KOKORO_VOICES;
  }

  addListener(listener: TTSProviderListener): void {
    this.listeners.add(listener);
  }

  removeListener(listener: TTSProviderListener): void {
    this.listeners.delete(listener);
  }

  private notify(): void {
    for (const l of this.listeners) l();
  }

  private setProgress(p: number): void {
    this.loadingProgress = p;
    this.notify();
  }

  private async loadModel(): Promise<void> {
    if (this.tts !== null) return;
    if (this.loadPromise) return this.loadPromise;

    this.status = "loading";
    this.loadingProgress = 0;
    this.loadError = null;
    this.notify();

    console.info("[KokoroProvider] Starting initialization...");

    this.loadPromise = (async () => {
      try {
        const { KokoroTTS } = await import("kokoro-js");

        const tts = await KokoroTTS.from_pretrained(KOKORO_MODEL_ID, {
          dtype: "q8",
          device: "wasm",
          progress_callback: (info: KokoroProgressInfo) => {
            if (
              info.status === "progress" &&
              typeof info.progress === "number"
            ) {
              const pct = Math.round(info.progress);
              console.info(`[KokoroProvider] Downloading model... ${pct}%`);
              this.setProgress(pct);
            } else if (info.status === "initiate") {
              console.info("[KokoroProvider] Model download initiated");
              this.setProgress(5);
            } else if (info.status === "download") {
              this.setProgress(Math.max(this.loadingProgress, 10));
            } else if (info.status === "done") {
              console.info(
                "[KokoroProvider] Model files downloaded, initializing WASM...",
              );
              this.setProgress(90);
            }
          },
        });

        this.tts = tts as unknown as KokoroInstance;
        this.loadingProgress = 100;
        this.loadError = null;
        this.status = "ready";
        this.notify();
        console.info("[KokoroProvider] Ready ✓ — all 29 voices available");
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : typeof err === "string"
              ? err
              : "Unknown error";
        console.error(
          "[KokoroProvider] FAILED to load model:",
          errorMessage,
          err,
        );
        this.status = "error";
        this.loadingProgress = 0;
        this.loadError = errorMessage;
        this.loadPromise = null;
        this.notify();
        throw err;
      }
    })();

    return this.loadPromise;
  }

  /**
   * Proactively initialize the model. Call this on app mount so the model
   * downloads in the background before the user hits play.
   */
  async initialize(): Promise<void> {
    if (!this.isAvailable()) {
      console.warn(
        "[KokoroProvider] WebAssembly or AudioContext not available — skipping init",
      );
      return;
    }
    // Fire and don't await — background loading, errors are captured in state
    this.loadModel().catch(() => {
      // Error already captured in this.loadError and status set to "error"
    });
  }

  /**
   * Retry a failed initialization. Resets error state and tries again.
   */
  async retry(): Promise<void> {
    if (this.status !== "error") return;
    this.tts = null;
    this.loadPromise = null;
    this.loadError = null;
    console.info("[KokoroProvider] Retrying initialization...");
    await this.initialize();
  }

  async synthesize(
    text: string,
    settings: TTSSynthesisSettings,
  ): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error("Kokoro TTS is not available in this environment");
    }

    await this.loadModel();

    if (this.status !== "ready" || !this.tts) {
      throw new Error("Kokoro model is not ready");
    }

    const voiceId =
      settings.voiceId && KOKORO_VOICES.find((v) => v.id === settings.voiceId)
        ? settings.voiceId
        : "af_heart";

    const speed = settings.rate ?? 1.0;

    // RawAudio.toBlob() returns a WAV Blob
    const audio = await this.tts.generate(text, { voice: voiceId, speed });
    const blob: Blob = await audio.toBlob();
    const url = URL.createObjectURL(blob);

    return new Promise<void>((resolve, reject) => {
      const el = new Audio(url);
      this.currentAudio = el;
      el.onended = () => {
        this.currentAudio = null;
        URL.revokeObjectURL(url);
        resolve();
      };
      el.onerror = () => {
        this.currentAudio = null;
        URL.revokeObjectURL(url);
        reject(new Error("Audio playback error"));
      };
      el.play().catch((err: unknown) => {
        this.currentAudio = null;
        URL.revokeObjectURL(url);
        reject(err);
      });
    });
  }

  cancel(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.src = "";
      this.currentAudio = null;
    }
  }

  dispose(): void {
    this.cancel();
    this.tts = null;
    this.loadPromise = null;
    this.status = "unavailable";
    this.loadError = null;
    this.listeners.clear();
  }
}
