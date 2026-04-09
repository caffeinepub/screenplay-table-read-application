import { type Backend, createActor } from "@/backend";
import { useActor as useCoreActor } from "@caffeineai/core-infrastructure";

export function useActor(): { actor: Backend | null; isFetching: boolean } {
  return useCoreActor<Backend>(createActor);
}
