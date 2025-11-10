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

// Settings
export interface AppSettings {
  musicAssistantUrl: string;
  aiProvider: AIProvider;
  anthropicApiKey?: string;
  openaiApiKey?: string;
  openaiBaseUrl?: string;
  customSystemPrompt?: string;
  temperature?: number;
}

// Settings request/response
export interface UpdateSettingsRequest {
  musicAssistantUrl?: string;
  aiProvider?: AIProvider;
  anthropicApiKey?: string;
  openaiApiKey?: string;
  openaiBaseUrl?: string;
  customSystemPrompt?: string;
  temperature?: number;
}

export interface GetSettingsResponse extends AppSettings {
  hasAnthropicKey: boolean;
  hasOpenAIKey: boolean;
}

// Prompt history response
export interface GetPromptHistoryResponse {
  history: PromptHistory[];
}

// Preset prompts response
export interface GetPresetPromptsResponse {
  presets: PresetPrompt[];
}

// Create playlist in MA response
export interface CreatePlaylistInMAResponse {
  success: boolean;
  playlistId: string;
  tracksAdded: number;
}

// Refine playlist response
export interface RefinePlaylistResponse {
  success: boolean;
  matches: TrackMatch[];
  totalSuggested: number;
  totalMatched: number;
}

// Test connection response
export interface TestConnectionResponse {
  success: boolean;
  error?: string;
}

// Generic success response
export interface SuccessResponse {
  success: boolean;
}
