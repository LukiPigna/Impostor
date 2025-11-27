export interface Player {
  id: string;
  name: string;
  isImpostor: boolean;
  word?: string; // The word they see (Impostor sees nothing or "IMPOSTOR")
}

export enum GameStage {
  SETUP = 'SETUP',
  MODE_SELECT = 'MODE_SELECT',
  CUSTOM_INPUT = 'CUSTOM_INPUT',
  LOADING_AI = 'LOADING_AI',
  DISTRIBUTE = 'DISTRIBUTE',
  PLAYING = 'PLAYING',
  REVEAL = 'REVEAL',
}

export enum GameMode {
  FAMOUS = 'FAMOUS',
  CUSTOM = 'CUSTOM',
}

export type SupportedLanguage = 'en' | 'es';
