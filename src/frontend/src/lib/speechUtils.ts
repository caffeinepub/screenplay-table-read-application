/**
 * Preprocesses screenplay text for speech synthesis.
 * - Removes "..." (ellipsis) including unicode variant
 * - Removes "--" (em-dash shorthand)
 * - Replaces INT. → "inside", EXT. → "outside" in scene headings
 * - Cleans up excessive whitespace
 */
export function preprocessTextForSpeech(
  text: string,
  elementType?: string,
): string {
  let processed = text;

  // Scene heading abbreviations
  if (elementType === "scene_heading") {
    processed = processed.replace(/\bINT\.?\b/gi, "inside");
    processed = processed.replace(/\bEXT\.?\b/gi, "outside");
    processed = processed.replace(/\bINT\.\/EXT\.?\b/gi, "inside and outside");
    processed = processed.replace(/\bI\/E\.?\b/gi, "inside and outside");
  }

  // Remove ellipsis variants (must come before other punctuation handling)
  processed = processed.replace(/\.{3,}/g, "");
  processed = processed.replace(/\u2026/g, ""); // Unicode ellipsis …

  // Remove double-dashes and em-dashes when used as interruption markers
  processed = processed.replace(/--+/g, "");
  processed = processed.replace(/\u2014/g, ""); // Unicode em-dash —

  // Remove leftover punctuation clusters after removals (e.g. ",." or "!.")
  processed = processed.replace(/([,;:!?])\s*\./g, "$1");

  // Collapse multiple spaces and trim
  processed = processed.replace(/\s+/g, " ").trim();

  return processed;
}

/**
 * Determines if a parsed element should be spoken aloud.
 * Character labels and empty/parenthetical markers are skipped.
 */
export function shouldSpeak(type: string): boolean {
  return (
    type === "dialogue" ||
    type === "action" ||
    type === "scene_heading" ||
    type === "transition"
  );
}

/**
 * Returns the "speaker" key for a given element — used for voice assignment lookup.
 * Dialogue → character name, everything else → 'Narrator'
 */
export function getSpeaker(type: string, character?: string): string {
  if (type === "dialogue" && character) return character;
  return "Narrator";
}
