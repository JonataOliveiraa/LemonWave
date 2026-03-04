
export interface SoundDefinition {
  id: string;
  name: string;
  category: 'Item' | 'NPC' | 'Liquids' | 'Menu' | 'Misc' | 'DD2';
  url: string;
}

export interface SoundConfig {
  pitch: number;
  volume: number;
}

export interface SavedSound extends SoundConfig {
  id: string;
  soundName: string;
  customName?: string;
  timestamp: number;
}

export interface SearchResult {
  sounds: SoundDefinition[];
}
