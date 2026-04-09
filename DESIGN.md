# Design Brief: Cinematic Voice Studio

**Purpose:** Professional screenplay table read application for collaborative script reading. Dark, focused interface for voice configuration and playback synchronization.

**Category:** Productivity (screenplay tool)

**Tone & Aesthetic:** Cinematic, editorial, professional—like a film production interface. Deep blacks, sharp hierarchy, character-driven color system. Premium tech, not generic.

## Color Palette

| Token | Light | Dark | Purpose |
|-------|-------|------|---------|
| Background | `0.98 0 0` | `0.10 0 0` | Main canvas, deepest level |
| Card | `1 0 0` | `0.14 0 0` | Elevated surfaces, character panels |
| Primary (Purple) | `0.55 0.20 280` | `0.68 0.24 280` | Playback controls, highlighting |
| Accent (Cyan) | `0.65 0.18 320` | `0.72 0.22 320` | Secondary actions, focus states |
| Destructive (Red) | `0.60 0.25 25` | `0.62 0.28 25` | Stop/reset actions |
| Muted | `0.95 0 0` | `0.18 0 0` | Inactive state, disabled text |

**Character Palette** (Voice Studio badges):
- Warm: `0.65 0.26 35` — narrator, age 40+
- Cool: `0.70 0.24 200` — young characters
- Electric: `0.60 0.30 340` — energetic roles
- Emerald: `0.70 0.26 145` — supporting cast
- Gold: `0.72 0.28 85` — featured roles

## Typography

| Usage | Font | Weight | Size |
|-------|------|--------|------|
| Display (Scene headings) | Fraunces, serif | 400 | 18–24px |
| Body (UI labels, hints) | General Sans, sans-serif | 400 | 14px |
| Screenplay (Action, dialogue) | General Sans, sans-serif | 400 | 13px |
| Mono (Code-like) | JetBrains Mono, monospace | 400 | 12px |

**Hierarchy:** Display establishes scene structure. Body UI stays neutral, transparent. Screenplay text is calm and scannable.

## Structural Zones

| Zone | Surface | Border | Purpose |
|------|---------|--------|---------|
| Backdrop (0) | `background` (0.10 L) | None | Canvas, no boundary |
| Card Level (1) | `card` (0.14 L) | Subtle 0.22 L | Character panels, voice settings |
| Elevated (2) | `card` (0.14 L) | Primary glow | Sticky controls, active state |
| Popover (3) | `popover` (0.16 L) | `ring` (purple) | Dropdowns, modals |

**Sticky Controls (Bottom):** Semi-transparent backdrop blur, card-level background, bottom border separator. Play, pause, skip buttons always visible during scroll.

## Component Patterns

- **Character Badge:** 40×40px circle, centered initial, bold text, color-coded by role frequency
- **Voice Slider:** Horizontal track (muted bg), range input, smooth thumb with hover glow
- **Pitch/Rate Label:** Semantic color (warm=pitch, cool=rate), mono font for numeric display
- **Script Block (Current):** Left border primary color, soft background tint, smooth highlight
- **Button (Playback):** Icon + label, primary color, elevated shadow on hover, accessible focus ring

## Spacing & Rhythm

- Gap unit: 8px (Tailwind default)
- Section padding: 16–24px
- Character card grid: 2 columns (tablet), 1 column (mobile)
- Voice controls within card: Compact vertical rhythm, minimal padding

## Motion

- **Entrance:** Slide-in-right (0.3s ease-out) for Voice Studio tab
- **Playback pulse:** Glow animation (2s loop) on active playback button
- **Scroll reveal:** Current script block fades in as user scrolls
- **Transitions:** All interactive elements default 0.2s ease-in-out

## Signature Detail

**Character Initials in Circles:** Each voice gets a bold, color-coded badge with the character's initial—visual identity beyond drop-downs. On Voice Studio tab, initials are arranged by dialogue frequency (narrator first, then descending). Each circle acts as a "character identity anchor" for the voice controls below.

## Constraints

- No gradients on text (readability)
- No blur/frosted glass on interactive elements (hover clarity)
- Accent colors sparingly—only highlights and active states
- All controls high-contrast for accessibility (WCAG AA+)
- Screenplay text always scannable—no background overlays
