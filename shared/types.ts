/**
 * Shared types between frontend and backend with Zod validation
 */

import { z } from 'zod'

// Re-export settings-related types and schemas from settings-schema
export {
  type AppSettings,
  type UpdateSettingsRequest,
  type GetSettingsResponse,
  type AIProvider,
  type AIProviderConfig,
  type ProviderType,
  type SettingKey,
  AI_PROVIDERS,
  PROVIDER_TYPES,
  AIProviderConfigSchema,
  UpdateSettingsRequestSchema,
  settingsUtils,
  SETTINGS_FIELDS
} from './settings-schema.js'

// AI Provider schemas (for backwards compatibility)
/** @public */
export const AIProviderSchema = z.enum(['claude', 'openai'])

// Track suggestion from AI
export const TrackSuggestionSchema = z.object({
  title: z.string(),
  artist: z.string(),
  album: z.string().optional()
})
export type TrackSuggestion = z.infer<typeof TrackSuggestionSchema>

// AI Response
export const AIPlaylistResponseSchema = z.object({
  tracks: z.array(TrackSuggestionSchema),
  reasoning: z.string().optional()
})
/** @public */
export type AIPlaylistResponse = z.infer<typeof AIPlaylistResponseSchema>

// Music Assistant Track
export const MATrackSchema = z.object({
  uri: z.string(),
  name: z.string(),
  artists: z.array(z.object({ name: z.string() })),
  album: z.object({ name: z.string() }).nullable().optional(),
  provider: z.string(),
  item_id: z.string()
})
export type MATrack = z.infer<typeof MATrackSchema>

// Track match result
export const TrackMatchSchema = z.object({
  suggestion: TrackSuggestionSchema,
  matched: z.boolean(),
  maTrack: MATrackSchema.optional(),
  maMatches: z.array(MATrackSchema).optional(),
  selectedMatchIndex: z.number().optional(),
  confidence: z.number().optional(),
  matching: z.boolean().optional()
})
export type TrackMatch = z.infer<typeof TrackMatchSchema>

// Playlist creation request
/** @public */
export const CreatePlaylistRequestSchema = z.object({
  prompt: z.string(),
  playlistName: z.string().optional(),
  providerId: z.string().optional(),
  trackCount: z.number().optional()
})

// Backend API schemas
export const BackendGeneratePlaylistRequestSchema = z.object({
  prompt: z.string().min(1),
  providerPreference: z.string().optional(),
  webhookUrl: z.string().optional(),
  trackCount: z.number().optional()
})
/** @public */
export type BackendGeneratePlaylistRequest = z.infer<typeof BackendGeneratePlaylistRequestSchema>

export const BackendGeneratePlaylistResponseSchema = z.object({
  jobId: z.string()
})
/** @public */
export type BackendGeneratePlaylistResponse = z.infer<typeof BackendGeneratePlaylistResponseSchema>

export const BackendJobProgressUpdateSchema = z.object({
  jobId: z.string(),
  status: z.enum(["pending", "generating_ai", "matching_tracks", "creating_playlist", "completed", "failed"]),
  tracks: z.array(TrackMatchSchema).optional(),
  totalTracks: z.number().optional(),
  matchedTracks: z.number().optional(),
  playlistUrl: z.string().optional(),
  error: z.string().optional()
})
/** @public */
export type BackendJobProgressUpdate = z.infer<typeof BackendJobProgressUpdateSchema>

export const BackendCreatePlaylistRequestSchema = z.object({
  playlistName: z.string().min(1),
  prompt: z.string(),
  tracks: z.array(TrackMatchSchema)
})
/** @public */
export type BackendCreatePlaylistRequest = z.infer<typeof BackendCreatePlaylistRequestSchema>

export const BackendCreatePlaylistResponseSchema = z.object({
  success: z.boolean(),
  playlistId: z.string(),
  playlistUrl: z.string(),
  tracksAdded: z.number()
})
/** @public */
export type BackendCreatePlaylistResponse = z.infer<typeof BackendCreatePlaylistResponseSchema>

export const BackendRefinePlaylistRequestSchema = z.object({
  refinementPrompt: z.string().min(1),
  currentTracks: z.array(TrackMatchSchema),
  providerPreference: z.string().optional()
})
/** @public */
export type BackendRefinePlaylistRequest = z.infer<typeof BackendRefinePlaylistRequestSchema>

export const BackendRefinePlaylistResponseSchema = z.object({
  tracks: z.array(TrackMatchSchema)
})
/** @public */
export type BackendRefinePlaylistResponse = z.infer<typeof BackendRefinePlaylistResponseSchema>

export const BackendRetryTrackRequestSchema = z.object({
  track: TrackMatchSchema,
  providerKeywords: z.array(z.string()).optional()
})
/** @public */
export type BackendRetryTrackRequest = z.infer<typeof BackendRetryTrackRequestSchema>

export const BackendRetryTrackResponseSchema = z.object({
  track: TrackMatchSchema
})
/** @public */
export type BackendRetryTrackResponse = z.infer<typeof BackendRetryTrackResponseSchema>

export const BackendReplaceTrackRequestSchema = z.object({
  trackToReplace: TrackMatchSchema,
  currentTracks: z.array(TrackMatchSchema),
  originalPrompt: z.string(),
  playlistName: z.string(),
  providerPreference: z.string().optional()
})
/** @public */
export type BackendReplaceTrackRequest = z.infer<typeof BackendReplaceTrackRequestSchema>

export const BackendReplaceTrackResponseSchema = z.object({
  track: TrackMatchSchema
})
/** @public */
export type BackendReplaceTrackResponse = z.infer<typeof BackendReplaceTrackResponseSchema>

export const BackendTestMARequestSchema = z.object({
  musicAssistantUrl: z.string()
})
/** @public */
export type BackendTestMARequest = z.infer<typeof BackendTestMARequestSchema>

export const BackendTestMAResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional()
})
/** @public */
export type BackendTestMAResponse = z.infer<typeof BackendTestMAResponseSchema>

// Playlist creation response
/** @public */
export const CreatePlaylistResponseSchema = z.object({
  success: z.boolean(),
  playlistId: z.string().optional(),
  playlistName: z.string(),
  matches: z.array(TrackMatchSchema),
  totalSuggested: z.number(),
  totalMatched: z.number(),
  error: z.string().optional()
})

// Refinement request
/** @public */
export const RefinePlaylistRequestSchema = z.object({
  originalPrompt: z.string(),
  refinementPrompt: z.string(),
  currentTracks: z.array(TrackMatchSchema),
  providerId: z.string().optional()
})

// Prompt history entry
export const PromptHistorySchema = z.object({
  id: z.number(),
  prompt: z.string(),
  timestamp: z.string(),
  playlistName: z.string().optional(),
  trackCount: z.number()
})
export type PromptHistory = z.infer<typeof PromptHistorySchema>

// Database row for prompt history (snake_case from SQLite)
export const PromptHistoryRowSchema = z.object({
  id: z.number(),
  prompt: z.string(),
  timestamp: z.string(),
  playlist_name: z.string().nullable(),
  track_count: z.number()
})
export type PromptHistoryRow = z.infer<typeof PromptHistoryRowSchema>

// Preset prompt
export const PresetPromptCategorySchema = z.enum(['workout', 'chill', 'party', 'focus', 'other'])
export const PresetPromptSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  prompt: z.string(),
  category: PresetPromptCategorySchema
})
export type PresetPrompt = z.infer<typeof PresetPromptSchema>

// API Error response
/** @public */
export const APIErrorSchema = z.object({
  error: z.string(),
  details: z.string().optional()
})

// Settings schemas removed - now imported from settings-schema.ts above

// Prompt history response
export const GetPromptHistoryResponseSchema = z.object({
  history: z.array(PromptHistorySchema)
})
/** @public */
export type GetPromptHistoryResponse = z.infer<typeof GetPromptHistoryResponseSchema>

// Preset prompts response
export const GetPresetPromptsResponseSchema = z.object({
  presets: z.array(PresetPromptSchema)
})
/** @public */
export type GetPresetPromptsResponse = z.infer<typeof GetPresetPromptsResponseSchema>

// Create playlist in MA response
/** @public */
export const CreatePlaylistInMAResponseSchema = z.object({
  success: z.boolean(),
  playlistId: z.string(),
  tracksAdded: z.number()
})

// Refine playlist response
/** @public */
export const RefinePlaylistResponseSchema = z.object({
  success: z.boolean(),
  matches: z.array(TrackMatchSchema),
  totalSuggested: z.number(),
  totalMatched: z.number()
})

// Test connection response
/** @public */
export const TestConnectionResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional()
})

// Generic success response
export const SuccessResponseSchema = z.object({
  success: z.boolean()
})
/** @public */
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>

// Helper to convert database row to PromptHistory (snake_case to camelCase)
/** @public */
export const convertPromptHistoryRow = (row: PromptHistoryRow): PromptHistory => ({
  id: row.id,
  prompt: row.prompt,
  timestamp: row.timestamp,
  playlistName: row.playlist_name ?? undefined,
  trackCount: row.track_count
})
