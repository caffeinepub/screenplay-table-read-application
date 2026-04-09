import type {
  CharacterVoiceSetting,
  Screenplay,
  ScreenplaySummary,
} from "@/backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";

export type { Screenplay, ScreenplaySummary, CharacterVoiceSetting };

export function useListScreenplays() {
  const { actor, isFetching } = useActor();

  return useQuery<ScreenplaySummary[]>({
    queryKey: ["screenplays"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listScreenplays();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetScreenplay(id: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Screenplay | null>({
    queryKey: ["screenplay", id],
    queryFn: async () => {
      if (!actor || !id) return null;
      return actor.getScreenplay(id);
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useAddScreenplay() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      language,
      content,
    }: {
      title: string;
      language: string;
      content: string;
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      const result = await actor.addScreenplay(title, language, content);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["screenplays"] });
    },
  });
}

export function useDeleteScreenplay() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not initialized");
      const result = await actor.deleteScreenplay(id);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["screenplays"] });
    },
  });
}

export function useGetVoiceSettings(screenplayId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<CharacterVoiceSetting[]>({
    queryKey: ["voiceSettings", screenplayId],
    queryFn: async () => {
      if (!actor || !screenplayId) return [];
      return actor.getVoiceSettings(screenplayId);
    },
    enabled: !!actor && !isFetching && !!screenplayId,
  });
}

export function useSaveVoiceSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      screenplayId,
      settings,
      activeProvider,
    }: {
      screenplayId: string;
      settings: CharacterVoiceSetting[];
      activeProvider?: string | null;
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      const result = await actor.saveVoiceSettings(
        screenplayId,
        settings,
        activeProvider ?? null,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["voiceSettings", variables.screenplayId],
      });
    },
  });
}
