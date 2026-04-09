import { VoiceStudio } from "@/components/VoiceStudio";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetScreenplay, useGetVoiceSettings } from "@/hooks/useQueries";
import { useTableRead } from "@/hooks/useTableRead";
import type { VoiceAssignment } from "@/hooks/useTableRead";
import { parseScreenplay } from "@/lib/fountainParser";
import type { ParsedElement } from "@/types";
import { CHARACTER_COLORS, getCharacterColor, getInitials } from "@/types";
import {
  ArrowLeft,
  Loader2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface ScreenplayPlayerProps {
  screenplayId: string;
  onBack: () => void;
}

export function ScreenplayPlayer({
  screenplayId,
  onBack,
}: ScreenplayPlayerProps) {
  const { data: screenplay, isLoading } = useGetScreenplay(screenplayId);
  const { data: savedSettings = [] } = useGetVoiceSettings(screenplayId);
  const [parsedElements, setParsedElements] = useState<ParsedElement[]>([]);
  const [voiceAssignments, setVoiceAssignments] = useState<
    Record<string, VoiceAssignment>
  >({});
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const elementRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [activeTab, setActiveTab] = useState<string>("play");

  const {
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
  } = useTableRead(
    parsedElements,
    screenplay?.language ?? "en-US",
    voiceAssignments,
  );

  const handleVoiceAssignmentsChange = useCallback(
    (assignments: Record<string, VoiceAssignment>) => {
      setVoiceAssignments(assignments);
    },
    [],
  );

  // Parse screenplay content
  useEffect(() => {
    if (screenplay?.content) {
      setParsedElements(parseScreenplay(screenplay.content));
    }
  }, [screenplay]);

  // Auto-scroll to current block — also re-fires when switching to the play tab
  useEffect(() => {
    if (activeTab !== "play") return;
    if (currentIndex >= 0 && elementRefs.current.has(currentIndex)) {
      const el = elementRefs.current.get(currentIndex);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentIndex, activeTab]);

  // Build a character-to-color-index map
  const characterColorMap = new Map<string, number>();
  characters.forEach((char, i) => {
    characterColorMap.set(char.name, i);
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Skeleton className="h-8 w-24 mb-6" />
        <Skeleton className="h-12 w-72 mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!screenplay) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Screenplay not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-6 pb-36 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          data-ocid="back-button"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <h2 className="text-xl font-bold font-display truncate">
          {screenplay.title}
        </h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4" data-ocid="tab-list">
          <TabsTrigger value="play" data-ocid="tab-play">
            Play
          </TabsTrigger>
          <TabsTrigger value="voices" data-ocid="tab-voices">
            Voice Studio
          </TabsTrigger>
        </TabsList>

        {/* Play Tab */}
        <TabsContent value="play">
          <Card>
            <CardContent className="p-0">
              <ScrollArea
                className="h-[calc(100vh-360px)] min-h-[400px]"
                ref={scrollAreaRef}
              >
                <div className="screenplay-content p-6 space-y-1 scrollbar-thin">
                  {parsedElements.map((element, index) => {
                    const isActive = index === currentIndex;
                    const colorIdx = element.character
                      ? getCharacterColor(
                          characterColorMap.get(element.character) ?? 0,
                        )
                      : null;
                    const color =
                      colorIdx !== null ? CHARACTER_COLORS[colorIdx] : null;

                    return (
                      <div
                        key={`${element.type}-${index}`}
                        ref={(el) => {
                          if (el) elementRefs.current.set(index, el);
                        }}
                        role="presentation"
                        onClick={() => seekTo(index)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") seekTo(index);
                        }}
                        className={`relative transition-all duration-200 rounded-sm px-3 py-1 cursor-pointer ${
                          isActive
                            ? "script-block-active"
                            : "opacity-70 hover:opacity-90"
                        }`}
                        data-ocid={isActive ? "active-block" : undefined}
                      >
                        {element.type === "scene_heading" && (
                          <p className="font-bold uppercase text-xs tracking-widest text-primary py-2">
                            {element.text}
                          </p>
                        )}
                        {element.type === "action" && (
                          <p className="text-foreground/90">{element.text}</p>
                        )}
                        {element.type === "character" && color && (
                          <div className="flex items-center gap-2 mt-3 ml-[25%]">
                            <span
                              className={`character-badge w-7 h-7 text-[10px] ${color.bg} ${color.text}`}
                              aria-hidden
                            >
                              {getInitials(element.text)}
                            </span>
                            <p
                              className={`font-bold uppercase text-sm tracking-wide ${color.text}`}
                            >
                              {element.text}
                            </p>
                          </div>
                        )}
                        {element.type === "dialogue" && color && (
                          <p
                            className={`ml-[25%] mr-[15%] ${isActive ? color.text : "text-foreground/80"}`}
                          >
                            {element.text}
                          </p>
                        )}
                        {element.type === "parenthetical" && (
                          <p className="ml-[30%] mr-[20%] text-muted-foreground italic text-sm">
                            {element.text}
                          </p>
                        )}
                        {element.type === "transition" && (
                          <p className="text-right text-xs uppercase tracking-widest text-muted-foreground py-2">
                            {element.text}
                          </p>
                        )}
                      </div>
                    );
                  })}
                  {parsedElements.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                      <p className="text-muted-foreground">
                        No readable content found in this screenplay.
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Voice Studio Tab */}
        <TabsContent value="voices">
          <VoiceStudio
            screenplayId={screenplayId}
            characters={characters}
            availableVoices={availableVoices}
            voiceAssignments={voiceAssignments}
            defaultVoiceAssignments={defaultVoiceAssignments}
            onVoiceAssignmentsChange={handleVoiceAssignmentsChange}
            savedSettings={savedSettings}
            scriptLanguage={screenplay.language}
          />
        </TabsContent>
      </Tabs>

      {/* Sticky Playback Controls */}
      <div
        className="sticky-controls fixed bottom-0 left-0 right-0"
        data-ocid="playback-controls"
      >
        <div className="container mx-auto max-w-5xl px-4 py-3">
          {/* Progress bar */}
          <div className="progress-track mb-3">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={skipBack}
              disabled={currentIndex < 0 || isInitializing}
              aria-label="Skip back"
              data-ocid="skip-back"
            >
              <SkipBack className="w-4 h-4" />
            </Button>

            <Button
              size="lg"
              onClick={isPlaying ? pause : play}
              disabled={isInitializing || parsedElements.length === 0}
              className="w-32 gap-2"
              data-ocid="play-pause"
            >
              {isInitializing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isPlaying ? (
                <>
                  <Pause className="w-5 h-5" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Play
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={skipForward}
              disabled={
                currentIndex >= parsedElements.length - 1 || isInitializing
              }
              aria-label="Skip forward"
              data-ocid="skip-forward"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {currentIndex >= 0 && parsedElements.length > 0 && (
            <p className="text-center text-xs text-muted-foreground mt-2">
              {currentIndex + 1} / {parsedElements.length}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
