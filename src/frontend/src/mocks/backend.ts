import type { backendInterface } from "../backend";

const sampleScreenplayContent = `Title: The Last Scene
Credit: Written by
Author: A. Playwright
Draft date: April 2026

INT. COFFEE SHOP - DAY

A cozy corner café. Morning light streams through dusty windows.
ALEX, 30s, sits alone nursing a coffee. JORDAN enters.

JORDAN
You actually came.

ALEX
Did you think I wouldn't?

JORDAN
(sitting down)
I wasn't sure. After last night...

ALEX
Let's not talk about last night.

EXT. STREET - CONTINUOUS

JORDAN hurries out. ALEX follows, catching up.

ALEX (CONT'D)
Wait. I didn't mean it like that.

JORDAN
Then how did you mean it?

ALEX
I meant... I'm sorry.

INT. COFFEE SHOP - MOMENTS LATER

They return. The BARISTA brings two fresh cups.

NARRATOR
Some conversations change everything.

JORDAN
So what happens now?

ALEX
We figure it out. Together.
`;

export const mockBackend: backendInterface = {
  addScreenplay: async (_title, _language, _content) => ({
    __kind__: "ok",
    ok: "screenplay-1",
  }),

  deleteScreenplay: async (_id) => ({
    __kind__: "ok",
    ok: null,
  }),

  getScreenplay: async (_id) => ({
    id: "screenplay-1",
    title: "The Last Scene",
    content: sampleScreenplayContent,
    createdAt: BigInt(Date.now()) * BigInt(1_000_000),
    language: "en-US",
  }),

  getVoiceSettings: async (_screenplayId) => [
    {
      character: "NARRATOR",
      voiceUri: "",
      pitch: 1.0,
      rate: 0.9,
    },
    {
      character: "ALEX",
      voiceUri: "",
      pitch: 1.1,
      rate: 1.0,
    },
    {
      character: "JORDAN",
      voiceUri: "",
      pitch: 0.9,
      rate: 1.05,
    },
    {
      character: "BARISTA",
      voiceUri: "",
      pitch: 1.2,
      rate: 1.1,
    },
  ],

  listScreenplays: async () => [
    {
      id: "screenplay-1",
      title: "The Last Scene",
      createdAt: BigInt(Date.now()) * BigInt(1_000_000),
      language: "en-US",
    },
  ],

  saveVoiceSettings: async (_screenplayId, _settings, _activeProvider) => ({
    __kind__: "ok",
    ok: null,
  }),

  getActiveProvider: async (_screenplayId) => "web-speech",
};
