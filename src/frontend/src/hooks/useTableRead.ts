import { extractCharacters } from "@/lib/fountainParser";
import {
  getSpeaker,
  preprocessTextForSpeech,
  shouldSpeak,
} from "@/lib/speechUtils";
import { KOKORO_VOICES, ttsRegistry } from "@/lib/tts";
import type { TTSProvider, TTSSynthesisSettings } from "@/lib/tts";
import type { KokoroProvider } from "@/lib/tts/kokoro-provider";
import type {
  CharacterDialogueCount,
  ParsedElement,
  VoiceAssignment,
} from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";

export type { VoiceAssignment, CharacterDialogueCount };

interface UseTableReadReturn {
  isPlaying: boolean;
  currentIndex: number;
  progress: number;
  play: () => void;
  pause: () => void;
  skipForward: () => void;
  skipBack: () => void;
  seekTo: (index: number) => void;
  isInitializing: boolean;
  characters: CharacterDialogueCount[];
  availableVoices: SpeechSynthesisVoice[];
  defaultVoiceAssignments: Record<string, VoiceAssignment>;
}

/**
 * Build evenly-spread, maximally-distinct default voice assignments
 * for a list of characters using Kokoro voice IDs.
 *
 * - Narrator always gets af_heart (pitch 1.0, rate 0.95) — prominent, clear
 * - Remaining characters cycle through all 29 Kokoro voices in order
 * - Pitch is evenly spaced from 0.6 to 1.5 across all characters
 * - Rate alternates: slow (0.75–0.95) for even indexes, fast (1.1–1.4) for odd
 * - No two adjacent characters have similar pitch AND rate
 */
function buildDistinctDefaults(
  characters: CharacterDialogueCount[],
  language: string,
): Map<string, VoiceAssignment> {
  const defaults = new Map<string, VoiceAssignment>();
  if (characters.length === 0) return defaults;

  // Narrator gets a fixed prominent voice
  defaults.set("Narrator", {
    voiceName: "af_heart",
    pitch: 1.0,
    rate: 0.95,
    language,
  });

  const nonNarrator = characters.filter((c) => c.name !== "Narrator");
  const count = nonNarrator.length;
  if (count === 0) return defaults;

  // Cycle through all Kokoro voices starting from index 1 (skip af_heart for narrator)
  const voicePool = KOKORO_VOICES.slice(1); // 28 voices after narrator

  // Evenly space pitch from 0.6 to 1.5
  const pitchMin = 0.6;
  const pitchMax = 1.5;

  // Alternate slow/fast rates for maximum contrast
  const slowRates = [0.75, 0.8, 0.85, 0.9, 0.95];
  const fastRates = [1.1, 1.15, 1.2, 1.25, 1.3, 1.4];

  nonNarrator.forEach((char, i) => {
    const voiceIndex = i % voicePool.length;
    const voiceName = voicePool[voiceIndex].id;

    // Evenly spread pitch across range
    const pitchStep = count > 1 ? (pitchMax - pitchMin) / (count - 1) : 0;
    const rawPitch = pitchMin + pitchStep * i;
    const pitch = Math.round(rawPitch * 10) / 10;

    // Alternate slow/fast to ensure contrast between adjacent characters
    const rate =
      i % 2 === 0
        ? slowRates[Math.floor(i / 2) % slowRates.length]
        : fastRates[Math.floor(i / 2) % fastRates.length];

    defaults.set(char.name, {
      voiceName,
      pitch,
      rate,
      language,
    });
  });

  return defaults;
}

export function useTableRead(
  elements: ParsedElement[],
  language: string,
  voiceAssignments: Record<string, VoiceAssignment>,
): UseTableReadReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isInitializing, setIsInitializing] = useState(true);
  const [characters, setCharacters] = useState<CharacterDialogueCount[]>([]);
  const [defaultVoiceAssignments, setDefaultVoiceAssignments] = useState<
    Record<string, VoiceAssignment>
  >({});

  // Refs for stable closure behavior
  const isPlayingRef = useRef(false);
  const shouldContinueRef = useRef(false);
  const blockStartTimeRef = useRef<number>(0);
  const pendingSkipIndexRef = useRef<number | null>(null);
  const loopIndexRef = useRef<number>(-1);
  const defaultVoicesRef = useRef<Map<string, VoiceAssignment>>(new Map());
  const voiceAssignmentsRef =
    useRef<Record<string, VoiceAssignment>>(voiceAssignments);
  const elementsRef = useRef<ParsedElement[]>(elements);
  const cancelCurrentRef = useRef<(() => void) | null>(null);
  // Track whether defaults were assigned using Kokoro or Web Speech
  const defaultsUsedKokoroRef = useRef(false);

  // Keep refs in sync with latest props/state
  useEffect(() => {
    voiceAssignmentsRef.current = voiceAssignments;
  }, [voiceAssignments]);

  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  // Extract characters sorted: Narrator first, then by dialogue count desc
  useEffect(() => {
    const counts = extractCharacters(elements);
    const sorted = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
    setCharacters([{ name: "Narrator", count: 0 }, ...sorted]);
  }, [elements]);

  // Determine initialization status from the active provider
  useEffect(() => {
    const checkReady = () => {
      const provider = ttsRegistry.getActiveProvider();
      if (!provider) {
        setIsInitializing(true);
        return;
      }
      setIsInitializing(!provider.isReady());
    };

    checkReady();
    ttsRegistry.addListener(checkReady);

    // Also poll Web Speech (voices can arrive late)
    const interval = setInterval(checkReady, 500);
    setTimeout(() => clearInterval(interval), 10000);

    return () => {
      ttsRegistry.removeListener(checkReady);
      clearInterval(interval);
    };
  }, []);

  // Assign maximally-distinct default voices using Kokoro voice IDs eagerly.
  // We use the hard-coded KOKORO_VOICES list so defaults are set immediately,
  // even before the model finishes downloading.
  // When Kokoro becomes ready (after download), re-assign to ensure consistency.
  useEffect(() => {
    if (characters.length === 0) return;

    // Check if Kokoro is available (even if not ready yet)
    const kokoroProvider = ttsRegistry.getProvider("kokoro") as
      | KokoroProvider
      | undefined;
    const kokoroAvailable = kokoroProvider?.isAvailable() ?? false;

    // If Kokoro is available, use its voice IDs regardless of load state
    if (kokoroAvailable) {
      // Only rebuild if we haven't built Kokoro-based defaults yet
      if (!defaultsUsedKokoroRef.current) {
        defaultsUsedKokoroRef.current = true;
        const map = buildDistinctDefaults(characters, language);
        defaultVoicesRef.current = map;
        const asRecord: Record<string, VoiceAssignment> = {};
        for (const [k, v] of map) asRecord[k] = v;
        setDefaultVoiceAssignments(asRecord);
      }
      return;
    }

    // Web Speech fallback: assign using available voices spread across characters
    if (defaultVoicesRef.current.size > 0) return;

    const provider = ttsRegistry.getActiveProvider();
    const voices = provider?.getVoices() ?? [];
    if (voices.length === 0) return;

    const map = new Map<string, VoiceAssignment>();
    const count = characters.length;

    // Narrator first with prominent voice
    map.set("Narrator", {
      voiceName: voices[0]?.id,
      pitch: 1.0,
      rate: 0.95,
      language,
    });

    const nonNarrator = characters.filter((c) => c.name !== "Narrator");
    const voicePool = voices.slice(1);

    const pitchMin = 0.6;
    const pitchMax = 1.5;
    const slowRates = [0.75, 0.8, 0.85, 0.9, 0.95];
    const fastRates = [1.1, 1.15, 1.2, 1.25, 1.3];

    nonNarrator.forEach((char, i) => {
      const voiceName =
        voicePool.length > 0
          ? voicePool[i % voicePool.length].id
          : voices[0]?.id;
      const pitchStep = count > 1 ? (pitchMax - pitchMin) / (count - 1) : 0;
      const rawPitch = pitchMin + pitchStep * i;
      const pitch = Math.round(rawPitch * 10) / 10;
      const rate =
        i % 2 === 0
          ? slowRates[Math.floor(i / 2) % slowRates.length]
          : fastRates[Math.floor(i / 2) % fastRates.length];
      map.set(char.name, { voiceName, pitch, rate, language });
    });

    defaultVoicesRef.current = map;
    const asRecord: Record<string, VoiceAssignment> = {};
    for (const [k, v] of map) asRecord[k] = v;
    setDefaultVoiceAssignments(asRecord);
  }, [characters, language]);

  const buildSynthesisCall = useCallback(
    (
      element: ParsedElement,
    ): { text: string; settings: TTSSynthesisSettings } | null => {
      if (!shouldSpeak(element.type)) return null;

      const rawText = preprocessTextForSpeech(element.text, element.type);
      if (!rawText) return null;

      const speaker = getSpeaker(element.type, element.character);
      const assigned = voiceAssignmentsRef.current[speaker];
      const defaults = defaultVoicesRef.current.get(speaker);
      const va: VoiceAssignment = assigned ??
        defaults ?? { pitch: 1.0, rate: 1.0 };

      const settings: TTSSynthesisSettings = {
        voiceId: va.voiceName,
        pitch: va.pitch,
        rate: va.rate,
        language: va.language ?? language,
      };

      return { text: rawText, settings };
    },
    [language],
  );

  // Core playback loop
  const runPlayback = useCallback(
    (startIndex: number) => {
      loopIndexRef.current = startIndex;

      const advance = async () => {
        if (!shouldContinueRef.current) return;

        // Check for pending skip
        const skip = pendingSkipIndexRef.current;
        if (skip !== null) {
          pendingSkipIndexRef.current = null;
          loopIndexRef.current = skip;
          setCurrentIndex(skip);
          blockStartTimeRef.current = Date.now();
        }

        const idx = loopIndexRef.current;
        const elems = elementsRef.current;

        if (idx >= elems.length) {
          shouldContinueRef.current = false;
          isPlayingRef.current = false;
          setIsPlaying(false);
          setCurrentIndex(-1);
          return;
        }

        const element = elems[idx];
        const call = buildSynthesisCall(element);

        setCurrentIndex(idx);
        blockStartTimeRef.current = Date.now();

        if (!call) {
          loopIndexRef.current = idx + 1;
          advance();
          return;
        }

        const provider: TTSProvider | undefined =
          ttsRegistry.getActiveProvider();
        if (!provider) {
          loopIndexRef.current = idx + 1;
          advance();
          return;
        }

        // Store cancel fn so skipForward/skipBack can interrupt
        let cancelled = false;
        cancelCurrentRef.current = () => {
          cancelled = true;
          provider.cancel();
        };

        try {
          await provider.synthesize(call.text, call.settings);
          cancelCurrentRef.current = null;
          if (cancelled || !shouldContinueRef.current) return;
          loopIndexRef.current = loopIndexRef.current + 1;
          advance();
        } catch {
          cancelCurrentRef.current = null;
          if (!shouldContinueRef.current) return;
          // On any error, advance to next element
          loopIndexRef.current = loopIndexRef.current + 1;
          advance();
        }
      };

      advance();
    },
    [buildSynthesisCall],
  );

  const play = useCallback(() => {
    if (isInitializing) return;

    // Cancel current speech
    cancelCurrentRef.current?.();
    ttsRegistry.getActiveProvider()?.cancel();

    shouldContinueRef.current = true;
    isPlayingRef.current = true;
    pendingSkipIndexRef.current = null;
    setIsPlaying(true);

    const start =
      currentIndex <= 0 || currentIndex >= elementsRef.current.length
        ? 0
        : currentIndex;
    loopIndexRef.current = start;
    setCurrentIndex(start);
    blockStartTimeRef.current = Date.now();

    setTimeout(() => {
      if (shouldContinueRef.current) runPlayback(start);
    }, 50);
  }, [isInitializing, currentIndex, runPlayback]);

  const pause = useCallback(() => {
    shouldContinueRef.current = false;
    isPlayingRef.current = false;
    pendingSkipIndexRef.current = null;
    cancelCurrentRef.current?.();
    ttsRegistry.getActiveProvider()?.cancel();
    setIsPlaying(false);
  }, []);

  const skipForward = useCallback(() => {
    const next = loopIndexRef.current + 1;
    if (next >= elementsRef.current.length) return;

    if (isPlayingRef.current && shouldContinueRef.current) {
      pendingSkipIndexRef.current = next;
      cancelCurrentRef.current?.();
    } else {
      loopIndexRef.current = next;
      setCurrentIndex(next);
      blockStartTimeRef.current = Date.now();
    }
  }, []);

  const skipBack = useCallback(() => {
    const elapsed = Date.now() - blockStartTimeRef.current;
    const idx = loopIndexRef.current;
    const target = elapsed < 2000 && idx > 0 ? idx - 1 : Math.max(0, idx);

    if (isPlayingRef.current && shouldContinueRef.current) {
      pendingSkipIndexRef.current = target;
      cancelCurrentRef.current?.();
    } else {
      loopIndexRef.current = target;
      setCurrentIndex(target);
      blockStartTimeRef.current = Date.now();
    }
  }, []);

  const seekTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= elementsRef.current.length) return;

      // Stop any current synthesis and clear pending skips
      cancelCurrentRef.current?.();
      ttsRegistry.getActiveProvider()?.cancel();
      pendingSkipIndexRef.current = null;

      // Update position refs and state
      loopIndexRef.current = index;
      setCurrentIndex(index);
      blockStartTimeRef.current = Date.now();

      // Always start playback from the new position
      shouldContinueRef.current = true;
      isPlayingRef.current = true;
      setIsPlaying(true);

      // Small delay to let cancellation settle before starting the new loop
      setTimeout(() => {
        if (shouldContinueRef.current) runPlayback(index);
      }, 50);
    },
    [runPlayback],
  );

  const progress =
    elements.length > 0
      ? ((Math.max(0, currentIndex) + 1) / elements.length) * 100
      : 0;

  // availableVoices is kept for backward compat with VoiceStudio
  const availableVoices: SpeechSynthesisVoice[] =
    typeof window !== "undefined" && window.speechSynthesis
      ? window.speechSynthesis.getVoices()
      : [];

  return {
    isPlaying,
    currentIndex,
    progress,
    play,
    pause,
    skipForward,
    skipBack,
    seekTo,
    isInitializing,
    characters,
    availableVoices,
    defaultVoiceAssignments,
  };
}
