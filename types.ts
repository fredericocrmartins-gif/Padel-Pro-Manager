
export enum Screen {
  HOME = 'HOME',
  PROFILE = 'PROFILE',
  PLAYERS = 'PLAYERS',
  LIVE_GAME = 'LIVE_GAME',
  TOURNAMENT_SUMMARY = 'TOURNAMENT_SUMMARY',
  TOURNAMENT_RESULTS = 'TOURNAMENT_RESULTS',
  TEAM_SETUP = 'TEAM_SETUP',
  SETTINGS = 'SETTINGS',
  GLOBAL_STATS = 'GLOBAL_STATS',
  LOCATIONS = 'LOCATIONS',
  HISTORY_DETAIL = 'HISTORY_DETAIL',
  TOURNAMENT_HISTORY = 'TOURNAMENT_HISTORY'
}

export interface CloudConfig {
  url: string;
  key: string;
  enabled: boolean;
}

export interface Player {
  id: string;
  name: string;
  lastName?: string;
  nickname?: string;
  birthDate?: string;
  hand?: 'Destro' | 'Canhoto';
  level: string; 
  rankingPoints?: number; 
  image: string;
  backgroundColor?: string;
}

export interface Location {
  id: string;
  name: string;
  type: 'Indoor' | 'Outdoor';
  address?: string;
  imageUrl?: string;
  googleMapsUrl?: string;
  websiteUrl?: string;
}

export interface Match {
  id: string;
  team1: Player[];
  team2: Player[];
  score1: number;
  score2: number;
  court: number;
  status: 'live' | 'finished' | 'scheduled';
  round: number;
  date?: string;
}

export interface Tournament {
  id: string;
  date: string;
  time: string;
  duration: number;
  locationId: string;
  confirmedPlayerIds: string[];
  status: 'scheduled' | 'live' | 'finished' | 'cancelled';
  matches?: Match[];
}
