/**
 * Shared types between frontend and backend with Zod validation
 */

import { z } from 'zod'

// AI Provider schemas
export const AIProviderSchema = z.enum(['claude', 'openai'])
export type AIProvider = z.infer<typeof AIProviderSchema>

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
export type AIPlaylistResponse = z.infer<typeof AIPlaylistResponseSchema>

// Music Assistant Track
export const MATrackSchema = z.object({
  uri: z.string(),
  name: z.string(),
  artists: z.array(z.object({ name: z.string() })),
  album: z.object({ name: z.string() }).optional(),
  provider: z.string(),
  item_id: z.string()
})
export type MATrack = z.infer<typeof MATrackSchema>

// Track match result
export const TrackMatchSchema = z.object({
  suggestion: TrackSuggestionSchema,
  matched: z.boolean(),
  maTrack: MATrackSchema.optional(),
  confidence: z.number().optional(),
  matching: z.boolean().optional()
})
export type TrackMatch = z.infer<typeof TrackMatchSchema>

// Playlist creation request
export const CreatePlaylistRequestSchema = z.object({
  prompt: z.string(),
  playlistName: z.string().optional(),
  provider: AIProviderSchema.optional(),
  trackCount: z.number().optional()
})
export type CreatePlaylistRequest = z.infer<typeof CreatePlaylistRequestSchema>

// Playlist creation response
export const CreatePlaylistResponseSchema = z.object({
  success: z.boolean(),
  playlistId: z.string().optional(),
  playlistName: z.string(),
  matches: z.array(TrackMatchSchema),
  totalSuggested: z.number(),
  totalMatched: z.number(),
  error: z.string().optional()
})
export type CreatePlaylistResponse = z.infer<typeof CreatePlaylistResponseSchema>

// Refinement request
export const RefinePlaylistRequestSchema = z.object({
  originalPrompt: z.string(),
  refinementPrompt: z.string(),
  currentTracks: z.array(TrackMatchSchema),
  provider: AIProviderSchema.optional()
})
export type RefinePlaylistRequest = z.infer<typeof RefinePlaylistRequestSchema>

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
export const APIErrorSchema = z.object({
  error: z.string(),
  details: z.string().optional()
})
export type APIError = z.infer<typeof APIErrorSchema>

// Settings
export const AppSettingsSchema = z.object({
  musicAssistantUrl: z.string(),
  aiProvider: AIProviderSchema,
  anthropicApiKey: z.string().optional(),
  anthropicModel: z.string().optional(),
  openaiApiKey: z.string().optional(),
  openaiModel: z.string().optional(),
  openaiBaseUrl: z.string().optional(),
  customSystemPrompt: z.string().optional(),
  temperature: z.number().optional()
})
export type AppSettings = z.infer<typeof AppSettingsSchema>

// Settings request/response
export const UpdateSettingsRequestSchema = z.object({
  musicAssistantUrl: z.string().optional(),
  aiProvider: AIProviderSchema.optional(),
  anthropicApiKey: z.string().optional(),
  anthropicModel: z.string().optional(),
  openaiApiKey: z.string().optional(),
  openaiModel: z.string().optional(),
  openaiBaseUrl: z.string().optional(),
  customSystemPrompt: z.string().optional(),
  temperature: z.number().optional()
})
export type UpdateSettingsRequest = z.infer<typeof UpdateSettingsRequestSchema>

export const GetSettingsResponseSchema = AppSettingsSchema.extend({
  hasAnthropicKey: z.boolean(),
  hasOpenAIKey: z.boolean()
})
export type GetSettingsResponse = z.infer<typeof GetSettingsResponseSchema>

// Prompt history response
export const GetPromptHistoryResponseSchema = z.object({
  history: z.array(PromptHistorySchema)
})
export type GetPromptHistoryResponse = z.infer<typeof GetPromptHistoryResponseSchema>

// Preset prompts response
export const GetPresetPromptsResponseSchema = z.object({
  presets: z.array(PresetPromptSchema)
})
export type GetPresetPromptsResponse = z.infer<typeof GetPresetPromptsResponseSchema>

// Create playlist in MA response
export const CreatePlaylistInMAResponseSchema = z.object({
  success: z.boolean(),
  playlistId: z.string(),
  tracksAdded: z.number()
})
export type CreatePlaylistInMAResponse = z.infer<typeof CreatePlaylistInMAResponseSchema>

// Refine playlist response
export const RefinePlaylistResponseSchema = z.object({
  success: z.boolean(),
  matches: z.array(TrackMatchSchema),
  totalSuggested: z.number(),
  totalMatched: z.number()
})
export type RefinePlaylistResponse = z.infer<typeof RefinePlaylistResponseSchema>

// Test connection response
export const TestConnectionResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional()
})
export type TestConnectionResponse = z.infer<typeof TestConnectionResponseSchema>

// Generic success response
export const SuccessResponseSchema = z.object({
  success: z.boolean()
})
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>

// Helper to convert database row to PromptHistory (snake_case to camelCase)
export const convertPromptHistoryRow = (row: PromptHistoryRow): PromptHistory => ({
  id: row.id,
  prompt: row.prompt,
  timestamp: row.timestamp,
  playlistName: row.playlist_name ?? undefined,
  trackCount: row.track_count
})
