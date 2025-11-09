/**
 * Shared types between frontend and backend
 */

// AI Provider types
export type AIProvider = 'claude' | 'openai';

// Track suggestion from AI
export interface TrackSuggestion {
  title: string;
  artist: string;
  album?: string;
}

// AI Response
export interface AIPlaylistResponse {
  tracks: TrackSuggestion[];
  reasoning?: string;
}

// Music Assistant Track
export interface MATrack {
  uri: string;
  name: string;
  artists: Array<{ name: string }>;
  album?: { name: string };
  provider: string;
  item_id: string;
}

// Track match result
export interface TrackMatch {
  suggestion: TrackSuggestion;
  matched: boolean;
  maTrack?: MATrack;
  confidence?: number;
}

// Playlist creation request
export interface CreatePlaylistRequest {
  prompt: string;
  playlistName?: string;
  provider?: AIProvider;
}

// Playlist creation response
export interface CreatePlaylistResponse {
  success: boolean;
  playlistId?: string;
  playlistName: string;
  matches: TrackMatch[];
  totalSuggested: number;
  totalMatched: number;
  error?: string;
}

// Refinement request
export interface RefinePlaylistRequest {
  originalPrompt: string;
  refinementPrompt: string;
  currentTracks: TrackMatch[];
  provider?: AIProvider;
}

// Prompt history entry
export interface PromptHistory {
  id: number;
  prompt: string;
  timestamp: string;
  playlistName?: string;
  trackCount: number;
}

// Preset prompt
export interface PresetPrompt {
  id: string;
  name: string;
  description: string;
  prompt: string;
  category: 'workout' | 'chill' | 'party' | 'focus' | 'other';
}

// API Error response
export interface APIError {
  error: string;
  details?: string;
}
