import { en } from "./en";
import { th } from "./th";

export type Lang = "th" | "en";

export const translations = { th, en } as const;

export type TranslationKeys = typeof th;
