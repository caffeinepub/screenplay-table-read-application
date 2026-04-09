import type { ElementType, ParsedElement } from "@/types";

export type { ParsedElement, ElementType };

export function parseScreenplay(text: string): ParsedElement[] {
  const lines = text.split("\n");
  const elements: ParsedElement[] = [];
  let currentCharacter: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      currentCharacter = undefined;
      continue;
    }

    // Scene heading: INT./EXT. or forced with leading dot
    if (/^\.(?!\.)/.test(trimmed)) {
      // Forced scene heading
      elements.push({ type: "scene_heading", text: trimmed.slice(1) });
      currentCharacter = undefined;
      continue;
    }

    if (/^(INT|EXT|INT\.\/EXT|INT\/EXT|I\/E)[\.\s\-]/i.test(trimmed)) {
      elements.push({ type: "scene_heading", text: trimmed });
      currentCharacter = undefined;
      continue;
    }

    // Transition: ends with TO: or is uppercase with TO:
    if (
      /^[A-Z\s]+TO:\s*$/.test(trimmed) ||
      /^(FADE OUT|FADE IN|CUT TO|SMASH CUT|MATCH CUT):?\s*$/.test(trimmed)
    ) {
      elements.push({ type: "transition", text: trimmed });
      currentCharacter = undefined;
      continue;
    }

    // Forced action: leading !
    if (trimmed.startsWith("!")) {
      elements.push({ type: "action", text: trimmed.slice(1) });
      currentCharacter = undefined;
      continue;
    }

    // Character name: all caps, no lowercase, optional extension, not too long
    // Must not be a scene heading
    const charMatch = /^([A-Z][A-Z0-9\s\-'\.]+?)(\s*\([^)]+\))?\s*$/.exec(
      trimmed,
    );
    if (
      charMatch &&
      trimmed.length < 60 &&
      !/^(INT|EXT|INT\.\/EXT|INT\/EXT|I\/E)[\.\s\-]/i.test(trimmed) &&
      !/[a-z]/.test(trimmed.replace(/\([^)]+\)/g, ""))
    ) {
      const characterName = charMatch[1].trim();
      // Verify next non-empty line exists (to avoid treating isolated caps as character)
      let hasFollowingDialogue = false;
      for (let j = i + 1; j < lines.length && j <= i + 3; j++) {
        if (lines[j].trim()) {
          hasFollowingDialogue = true;
          break;
        }
      }
      if (hasFollowingDialogue) {
        currentCharacter = characterName;
        elements.push({
          type: "character",
          text: trimmed,
          character: characterName,
        });
        continue;
      }
    }

    // Parenthetical: follows a character
    if (/^\([^)]+\)$/.test(trimmed) && currentCharacter) {
      elements.push({
        type: "parenthetical",
        text: trimmed,
        character: currentCharacter,
      });
      continue;
    }

    // Dialogue: follows a character
    if (currentCharacter) {
      elements.push({
        type: "dialogue",
        text: trimmed,
        character: currentCharacter,
      });
      continue;
    }

    // Default: action/description
    elements.push({ type: "action", text: trimmed });
  }

  return elements;
}

export function extractCharacters(
  elements: ParsedElement[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const el of elements) {
    if (el.type === "dialogue" && el.character) {
      counts.set(el.character, (counts.get(el.character) ?? 0) + 1);
    }
  }
  return counts;
}
