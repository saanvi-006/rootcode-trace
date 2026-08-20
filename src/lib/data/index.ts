import type { DataProvider } from "./provider";
import { mockProvider } from "./mock/mockProvider";
// import { liveProvider } from "./live/liveProvider";

// Flip this single line to go live once VITE_API_BASE_URL is confirmed.
export const dataProvider: DataProvider = mockProvider;

export type { DataProvider };
export * from "./types";
