/**
 * WebSpeechProvider — wraps the browser's built-in window.speechSynthesis.
 * Used as a fallback when Kokoro TTS is unavailable or still loading.
 */

import type {
  TTSProvider,
  TTSProviderStatus,
  TTSSynthesisSettings,
  TTSVoice,
} from "./provider";

export class WebSpeechProvider implements TTSProvider {
  readonly id = "web-speech";
  readonly name = "Web Speech API";
  readonly description = "Built-in browser voices — no download required";

  private voices: TTSVoice[] = [];
  private synth: SpeechSynthesis | null = null;
  private ready = false;

  isAvailable(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  isReady(): boolean {
    return this.ready && this.voices.length > 0;
  }

  getStatus(): TTSProviderStatus {
    if (!this.isAvailable()) return "unavailable";
    if (!this.ready) return "loading";
    return "ready";
  }

  getVoices(): TTSVoice[] {
    if (!this.isAvailable()) return [];
    this.ensureInitialized();
    return this.voices;
  }

  /**
   * Load voices from speechSynthesis and keep them updated.
   * Call this early (e.g. on app mount) to get voices fast.
   */
  ensureInitialized(language?: string): void {
    if (!this.isAvailable()) return;
    if (this.synth) return;

    this.synth = window.speechSynthesis;

    const loadVoices = () => {
      const all = this.synth!.getVoices();
      const langCode = language?.split("-")[0].toLowerCase();
      const filtered = langCode
        ? all.filter((v) => v.lang.toLowerCase().startsWith(langCode))
        : all;
      const source = filtered.length > 0 ? filtered : all;

      this.voices = source.map((v) => ({
        id: v.name,
        name: v.name,
        lang: v.lang,
        raw: v,
      }));
      this.ready = this.voices.length > 0;
    };

    loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
  }

  synthesize(text: string, settings: TTSSynthesisSettings): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.isAvailable() || !this.synth) {
        reject(new Error("Web Speech API is not available"));
        return;
      }

      const utt = new SpeechSynthesisUtterance(text);
      utt.pitch = settings.pitch ?? 1.0;
      utt.rate = settings.rate ?? 1.0;
      utt.volume = 1.0;
      if (settings.language) utt.lang = settings.language;

      if (settings.voiceId) {
        const voice = this.synth
          .getVoices()
          .find((v) => v.name === settings.voiceId);
        if (voice) utt.voice = voice;
      }

      utt.onend = () => resolve();
      utt.onerror = (e) => {
        if (e.error === "interrupted") {
          resolve(); // expected on cancel
        } else {
          reject(new Error(`Speech error: ${e.error}`));
        }
      };

      this.synth.speak(utt);
    });
  }

  cancel(): void {
    this.synth?.cancel();
  }

  dispose(): void {
    this.synth?.cancel();
    this.synth = null;
    this.voices = [];
    this.ready = false;
  }
}
