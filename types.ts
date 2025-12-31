export interface Player {
  id: string;
  name: string;
  isImpostor: boolean;
  word?: string;
}

export enum GameStage {
  SETUP = 'SETUP',
  MODE_SELECT = 'MODE_SELECT',
  CATEGORY_SELECT = 'CATEGORY_SELECT',
  CUSTOM_INPUT = 'CUSTOM_INPUT',
  LOADING_AI = 'LOADING_AI',
  DISTRIBUTE = 'DISTRIBUTE',
  PLAYING = 'PLAYING',
  REVEAL = 'REVEAL',
}

export enum GameMode {
  AI = 'AI',
  CUSTOM = 'CUSTOM',
  AMONG_US = 'AMONG_US',
  UNDERCOVER = 'UNDERCOVER',
  SONGS = 'SONGS',
}

export type Category = 
  | 'ANIMALS' 
  | 'FOOD' 
  | 'MOVIES' 
  | 'CITIES' 
  | 'OBJECTS' 
  | 'JOBS'
  | 'SPORTS'
  | 'CLOTHING'
  | 'COUNTRIES'
  | 'BRANDS'
  | 'CARTOONS'
  | 'INSTRUMENTS';

export type SupportedLanguage = 'en' | 'es';