import type { DataProvider } from "./provider";
// import { mockProvider } from "./mock/mockProvider";
import { liveProvider } from "./live/liveProvider";

// Live backend: https://rootcode-herbtrace-api.onrender.com
// Supabase bucket: harvest-photos (anon key, public policies)
// To revert to mock during debugging, swap the two lines above.
export const dataProvider: DataProvider = liveProvider;

export type { DataProvider };
export * from "./types";
