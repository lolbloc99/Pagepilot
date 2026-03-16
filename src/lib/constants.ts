export const LANGUAGES = [
  "Francais",
  "English",
  "Espanol",
  "Deutsch",
  "Italiano",
  "Portugues",
  "Nederlands",
  "Polski",
  "Svenska",
  "Norsk",
  "Dansk",
  "Suomi",
  "Cesky",
  "Magyar",
  "Romana",
  "Turkce",
  "Arabic",
  "Japanese",
  "Korean",
  "Chinese (Simplified)",
] as const;

export type Language = (typeof LANGUAGES)[number];
