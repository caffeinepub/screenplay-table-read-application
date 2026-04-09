/**
 * TTS module entry — creates the registry singleton, registers all built-in
 * providers, and re-exports everything consumers need.
 *
 * Providers are registered in priority order:
 *   1. Kokoro (primary, best quality)
 *   2. Web Speech (fallback)
 *
 * Add future providers (ElevenLabs, OpenAI TTS, custom ONNX) here.
 */

export type {
  TTSProvider,
  TTSProviderStatus,
  TTSProviderWithEvents,
  TTSProviderListener,
  TTSSynthesisSettings,
  TTSVoice,
} from "./provider";

export { ttsRegistry } from "./registry";
export { KokoroProvider, KOKORO_VOICES } from "./kokoro-provider";
export { WebSpeechProvider } from "./web-speech-provider";

import { KokoroProvider } from "./kokoro-provider";
import { ttsRegistry } from "./registry";
import { WebSpeechProvider } from "./web-speech-provider";

// Register providers — Kokoro first so it becomes the persisted default
const kokoro = new KokoroProvider();
const webSpeech = new WebSpeechProvider();

ttsRegistry.registerProvider(kokoro);
ttsRegistry.registerProvider(webSpeech);

// Initialize Web Speech early so voices are available quickly
webSpeech.ensureInitialized();

// Proactively start loading Kokoro model in the background.
// This ensures the model is downloading immediately on app load
// rather than waiting for the first synthesize() call.
kokoro.initialize().catch(() => {
  // Error captured in provider state — UI will show retry option
});
