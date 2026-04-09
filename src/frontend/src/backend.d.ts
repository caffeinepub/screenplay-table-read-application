import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type ScreenplayId = string;
export type Timestamp = bigint;
export interface ScreenplaySummary {
    id: ScreenplayId;
    title: string;
    createdAt: Timestamp;
    language: string;
}
export interface Screenplay {
    id: ScreenplayId;
    title: string;
    content: string;
    createdAt: Timestamp;
    language: string;
}
export interface CharacterVoiceSetting {
    character: string;
    rate: number;
    voiceUri: string;
    providerType?: string;
    pitch: number;
}
export interface backendInterface {
    addScreenplay(title: string, language: string, content: string): Promise<{
        __kind__: "ok";
        ok: ScreenplayId;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteScreenplay(id: ScreenplayId): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getActiveProvider(screenplayId: ScreenplayId): Promise<string>;
    getScreenplay(id: ScreenplayId): Promise<Screenplay | null>;
    getVoiceSettings(screenplayId: ScreenplayId): Promise<Array<CharacterVoiceSetting>>;
    listScreenplays(): Promise<Array<ScreenplaySummary>>;
    saveVoiceSettings(screenplayId: ScreenplayId, settings: Array<CharacterVoiceSetting>, activeProvider: string | null): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
}
