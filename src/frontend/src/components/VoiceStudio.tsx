import type { CharacterVoiceSetting } from "@/backend";
import { TTSProviderSelector } from "@/components/TTSProviderSelector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useSaveVoiceSettings } from "@/hooks/useQueries";
import { useTTSProvider } from "@/hooks/useTTSProvider";
import type {
  CharacterDialogueCount,
  VoiceAssignment,
} from "@/hooks/useTableRead";
import { ttsRegistry } from "@/lib/tts";
import { CHARACTER_COLORS, getCharacterColor, getInitials } from "@/types";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Globe,
  Shuffle,
  Sparkles,
  Volume2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface VoiceStudioProps {
  screenplayId: string;
  characters: CharacterDialogueCount[];
  availableVoices: SpeechSynthesisVoice[];
  voiceAssignments: Record<string, VoiceAssignment>;
  defaultVoiceAssignments: Record<string, VoiceAssignment>;
  onVoiceAssignmentsChange: (
    assignments: Record<string, VoiceAssignment>,
  ) => void;
  savedSettings: CharacterVoiceSetting[];
  scriptLanguage: string;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Distinct pitch spread for randomize-all
function distinctPitches(count: number): number[] {
  if (count === 0) return [];
  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    const raw = 0.6 + (0.9 / Math.max(count - 1, 1)) * i;
    result.push(Math.round(raw * 10) / 10);
  }
  return result;
}

// Alternating slow/fast rates for randomize-all
function distinctRates(count: number): number[] {
  const slow = [0.75, 0.8, 0.85, 0.9, 0.95];
  const fast = [1.1, 1.15, 1.2, 1.25, 1.3, 1.4];
  return Array.from({ length: count }, (_, i) =>
    i % 2 === 0
      ? slow[Math.floor(i / 2) % slow.length]
      : fast[Math.floor(i / 2) % fast.length],
  );
}

export function VoiceStudio({
  screenplayId,
  characters,
  availableVoices,
  voiceAssignments,
  defaultVoiceAssignments,
  onVoiceAssignmentsChange,
  savedSettings,
  scriptLanguage,
}: VoiceStudioProps) {
  const saveVoiceSettings = useSaveVoiceSettings();
  const hasLoadedSaved = useRef(false);
  const [copiedSettings, setCopiedSettings] = useState<VoiceAssignment | null>(
    null,
  );
  const [globalLanguage, setGlobalLanguage] = useState(scriptLanguage);
  const [selectedChar, setSelectedChar] = useState<string | null>(null);
  const { activeProvider } = useTTSProvider();

  // Load saved voice settings from backend once
  useEffect(() => {
    if (savedSettings.length > 0 && !hasLoadedSaved.current) {
      hasLoadedSaved.current = true;
      const loaded: Record<string, VoiceAssignment> = {};
      for (const s of savedSettings) {
        loaded[s.character] = {
          voiceName: s.voiceUri || undefined,
          pitch: s.pitch,
          rate: s.rate,
          language: globalLanguage,
        };
      }
      onVoiceAssignmentsChange(loaded);
    }
  }, [savedSettings, globalLanguage, onVoiceAssignmentsChange]);

  // Select first character on mount
  useEffect(() => {
    if (characters.length > 0 && !selectedChar) {
      setSelectedChar(characters[0].name);
    }
  }, [characters, selectedChar]);

  // Voices to display in the selector: prefer active provider voices,
  // fall back to Web Speech voices for backward compatibility
  const providerVoices = activeProvider?.voices ?? [];
  const displayVoices =
    providerVoices.length > 0
      ? providerVoices.map((v) => ({
          name: v.name,
          id: v.id,
          lang: v.lang,
        }))
      : availableVoices.map((v) => ({
          name: v.name,
          id: v.name,
          lang: v.lang,
        }));

  const availableLanguages = Array.from(
    new Set(displayVoices.map((v) => v.lang)),
  ).sort();

  // Resolved assignment: user-set > defaults from useTableRead > bare fallback
  const getAssignment = (name: string): VoiceAssignment =>
    voiceAssignments[name] ??
    defaultVoiceAssignments[name] ?? {
      pitch: 1.0,
      rate: 1.0,
      language: globalLanguage,
    };

  const updateAssignment = (
    character: string,
    updates: Partial<VoiceAssignment>,
  ) => {
    const current = getAssignment(character);
    onVoiceAssignmentsChange({
      ...voiceAssignments,
      [character]: { ...current, ...updates },
    });
  };

  const persistSettings = async (
    assignments: Record<string, VoiceAssignment>,
  ) => {
    const settings: CharacterVoiceSetting[] = Object.entries(assignments).map(
      ([char, a]) => ({
        character: char,
        voiceUri: a.voiceName ?? "",
        pitch: a.pitch,
        rate: a.rate,
      }),
    );
    try {
      await saveVoiceSettings.mutateAsync({ screenplayId, settings });
      toast.success("Voice settings saved");
    } catch {
      toast.error("Failed to save voice settings");
    }
  };

  const randomizeAll = () => {
    const shuffled = shuffleArray(displayVoices);
    const pitches = distinctPitches(characters.length);
    const rates = distinctRates(characters.length);
    const assignments: Record<string, VoiceAssignment> = {};
    characters.forEach((char, i) => {
      assignments[char.name] = {
        voiceName: shuffled[i % shuffled.length].id,
        pitch: pitches[i],
        rate: rates[i],
        language: globalLanguage,
      };
    });
    onVoiceAssignmentsChange(assignments);
    persistSettings(assignments);
    toast.success("All voices randomized!");
  };

  const testVoice = async (characterName: string) => {
    const a = getAssignment(characterName);
    const provider = ttsRegistry.getActiveProvider();
    if (!provider?.isReady()) {
      // Fall back to Web Speech for test if primary isn't ready
      const utt = new SpeechSynthesisUtterance(`Hello, I am ${characterName}.`);
      utt.pitch = a.pitch;
      utt.rate = a.rate;
      if (a.language) utt.lang = a.language;
      if (a.voiceName) {
        const v = availableVoices.find((vv) => vv.name === a.voiceName);
        if (v) utt.voice = v;
      }
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utt);
      return;
    }

    provider.cancel();
    try {
      await provider.synthesize(`Hello, I am ${characterName}.`, {
        voiceId: a.voiceName,
        pitch: a.pitch,
        rate: a.rate,
        language: a.language,
      });
    } catch {
      // ignore test errors
    }
  };

  const activeChar = selectedChar ?? characters[0]?.name ?? null;
  const activeAssignment = activeChar ? getAssignment(activeChar) : null;
  const activeColorIdx = activeChar
    ? getCharacterColor(characters.findIndex((c) => c.name === activeChar))
    : 0;
  const activeColor = CHARACTER_COLORS[activeColorIdx];

  return (
    <div className="space-y-4" data-ocid="voice-studio">
      {/* TTS Provider Section */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="font-display text-xl flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Voice Studio
              </CardTitle>
              <CardDescription>
                Choose your voice engine and assign distinct voices to each
                character
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <Select
                  value={globalLanguage}
                  onValueChange={(v) => setGlobalLanguage(v)}
                >
                  <SelectTrigger
                    className="w-36 h-8 text-xs"
                    data-ocid="language-select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLanguages.map((lang) => (
                      <SelectItem key={lang} value={lang} className="text-xs">
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                size="sm"
                onClick={randomizeAll}
                className="gap-1.5"
                data-ocid="randomize-all"
              >
                <Shuffle className="w-3.5 h-3.5" />
                Randomize
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <TTSProviderSelector />
        </CardContent>
      </Card>

      <div className="grid grid-cols-[260px_1fr] gap-4">
        {/* Character list */}
        <Card>
          <CardContent className="p-2">
            <ScrollArea className="h-[520px] scrollbar-thin">
              <div className="space-y-1 p-1">
                {characters.map((char, i) => {
                  const colorIdx = getCharacterColor(i);
                  const color = CHARACTER_COLORS[colorIdx];
                  const a = getAssignment(char.name);
                  const hasVoice = !!a.voiceName;
                  const isSelected = char.name === activeChar;

                  return (
                    <button
                      type="button"
                      key={char.name}
                      onClick={() => setSelectedChar(char.name)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-smooth ${
                        isSelected
                          ? `${color.bg} ${color.border} border`
                          : "hover:bg-muted/50"
                      }`}
                      data-ocid={`char-${char.name.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <span
                        className={`character-badge w-8 h-8 text-[11px] flex-shrink-0 ${color.bg} ${color.text} border ${color.border}`}
                      >
                        {getInitials(char.name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-medium truncate ${isSelected ? color.text : ""}`}
                        >
                          {char.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {char.name === "Narrator"
                            ? "narration"
                            : `${char.count} lines`}
                        </p>
                      </div>
                      {hasVoice ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Editor panel */}
        {activeChar && activeAssignment && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`character-badge w-10 h-10 text-sm ${activeColor.bg} ${activeColor.text} border ${activeColor.border}`}
                  >
                    {getInitials(activeChar)}
                  </span>
                  <div>
                    <CardTitle className="font-display text-lg">
                      {activeChar}
                    </CardTitle>
                    <CardDescription>
                      {activeChar === "Narrator"
                        ? "Narration voice"
                        : `${characters.find((c) => c.name === activeChar)?.count ?? 0} dialogue lines`}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCopiedSettings(activeAssignment);
                      toast.success(`Copied ${activeChar}'s settings`);
                    }}
                    disabled={!activeAssignment.voiceName}
                    aria-label="Copy settings"
                    data-ocid="copy-settings"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    Copy
                  </Button>
                  {copiedSettings && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateAssignment(activeChar, copiedSettings);
                        toast.success(`Pasted to ${activeChar}`);
                      }}
                      data-ocid="paste-settings"
                    >
                      Paste
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => testVoice(activeChar)}
                    className="gap-1.5"
                    data-ocid="test-voice"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    Test
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Voice select */}
              <div className="space-y-1.5">
                <Label htmlFor={`voice-${activeChar}`}>Voice</Label>
                <Select
                  value={activeAssignment.voiceName ?? ""}
                  onValueChange={(v) =>
                    updateAssignment(activeChar, { voiceName: v })
                  }
                >
                  <SelectTrigger
                    id={`voice-${activeChar}`}
                    data-ocid="voice-select"
                  >
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {displayVoices.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                        <span className="text-muted-foreground text-xs ml-1">
                          ({v.lang})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Pitch slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Pitch</Label>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {activeAssignment.pitch.toFixed(1)}
                  </Badge>
                </div>
                <Slider
                  min={0.5}
                  max={2.0}
                  step={0.05}
                  value={[activeAssignment.pitch]}
                  onValueChange={([v]) =>
                    updateAssignment(activeChar, { pitch: v })
                  }
                  className="cursor-pointer"
                  data-ocid="pitch-slider"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Low</span>
                  <span>Normal</span>
                  <span>High</span>
                </div>
              </div>

              {/* Rate slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Speed</Label>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {activeAssignment.rate.toFixed(1)}×
                  </Badge>
                </div>
                <Slider
                  min={0.5}
                  max={2.0}
                  step={0.05}
                  value={[activeAssignment.rate]}
                  onValueChange={([v]) =>
                    updateAssignment(activeChar, { rate: v })
                  }
                  className="cursor-pointer"
                  data-ocid="rate-slider"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Slow</span>
                  <span>Normal</span>
                  <span>Fast</span>
                </div>
              </div>

              <Separator />

              {/* Language select */}
              <div className="space-y-1.5">
                <Label htmlFor={`lang-${activeChar}`}>Language Override</Label>
                <Select
                  value={activeAssignment.language ?? globalLanguage}
                  onValueChange={(v) =>
                    updateAssignment(activeChar, { language: v })
                  }
                >
                  <SelectTrigger
                    id={`lang-${activeChar}`}
                    data-ocid="char-language-select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLanguages.map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full mt-2"
                onClick={() => persistSettings(voiceAssignments)}
                disabled={saveVoiceSettings.isPending}
                data-ocid="save-voice-settings"
              >
                Save All Voice Settings
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
