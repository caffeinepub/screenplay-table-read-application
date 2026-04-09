// Re-export backend types
export type {
  Screenplay,
  ScreenplaySummary,
  CharacterVoiceSetting,
  ScreenplayId,
  Timestamp,
} from "@/backend";

// Fountain parser types
export type ElementType =
  | "scene_heading"
  | "action"
  | "character"
  | "dialogue"
  | "parenthetical"
  | "transition"
  | "empty";

export interface ParsedElement {
  type: ElementType;
  text: string;
  character?: string;
}

// Voice assignment for a character (runtime, not persisted directly)
export interface VoiceAssignment {
  voiceName?: string;
  pitch: number;
  rate: number;
  language?: string;
}

// Character with dialogue count for sorting
export interface CharacterDialogueCount {
  name: string;
  count: number;
}

// Playback state
export interface PlaybackState {
  isPlaying: boolean;
  currentIndex: number;
  progress: number;
  isInitializing: boolean;
}

// Character color palette index (0-4, cycling)
export type CharacterColorIndex = 0 | 1 | 2 | 3 | 4;

export const CHARACTER_COLORS: Record<
  CharacterColorIndex,
  { bg: string; text: string; border: string; label: string }
> = {
  0: {
    bg: "bg-[oklch(0.65_0.26_35/0.2)]",
    text: "text-[oklch(0.75_0.26_35)]",
    border: "border-[oklch(0.65_0.26_35/0.4)]",
    label: "warm",
  },
  1: {
    bg: "bg-[oklch(0.70_0.24_200/0.2)]",
    text: "text-[oklch(0.80_0.24_200)]",
    border: "border-[oklch(0.70_0.24_200/0.4)]",
    label: "cool",
  },
  2: {
    bg: "bg-[oklch(0.60_0.30_340/0.2)]",
    text: "text-[oklch(0.72_0.30_340)]",
    border: "border-[oklch(0.60_0.30_340/0.4)]",
    label: "electric",
  },
  3: {
    bg: "bg-[oklch(0.70_0.26_145/0.2)]",
    text: "text-[oklch(0.78_0.26_145)]",
    border: "border-[oklch(0.70_0.26_145/0.4)]",
    label: "emerald",
  },
  4: {
    bg: "bg-[oklch(0.72_0.28_85/0.2)]",
    text: "text-[oklch(0.80_0.28_85)]",
    border: "border-[oklch(0.72_0.28_85/0.4)]",
    label: "gold",
  },
};

export function getCharacterColor(index: number): CharacterColorIndex {
  return (index % 5) as CharacterColorIndex;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
