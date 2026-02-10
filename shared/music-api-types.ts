/**
 * External music API types with Zod validation
 * Split from types.ts to respect the 200-line file limit
 */

import { z } from 'zod'

// Track suggestion sources
export const TRACK_SOURCES = ['ai', 'lastfm', 'musicbrainz'] as const
/** @public */
export const TrackSourceSchema = z.enum(TRACK_SOURCES)
/** @public */
export type TrackSource = z.infer<typeof TrackSourceSchema>

// External music API provider types
export const MUSIC_API_PROVIDERS = ['lastfm', 'musicbrainz'] as const
/** @public */
export const MusicApiProviderTypeSchema = z.enum(MUSIC_API_PROVIDERS)
/** @public */
export type MusicApiProviderType = z.infer<typeof MusicApiProviderTypeSchema>

// External track from a music API
export const ExternalTrackSchema = z.object({
  title: z.string(),
  artist: z.string(),
  album: z.string().optional(),
  source: MusicApiProviderTypeSchema,
  confidence: z.number().min(0).max(1).optional(),
  externalUrl: z.string().optional()
})
/** @public */
export type ExternalTrack = z.infer<typeof ExternalTrackSchema>

// Music API provider configuration
export const MusicApiProviderConfigSchema = z.object({
  type: MusicApiProviderTypeSchema,
  enabled: z.boolean(),
  apiKey: z.string().optional()
})
/** @public */
export type MusicApiProviderConfig = z.infer<typeof MusicApiProviderConfigSchema>

// Blend modes for combining AI + external tracks
export const BLEND_MODES = ['supplement', 'enrich', 'replace'] as const
/** @public */
export const BlendModeSchema = z.enum(BLEND_MODES)
/** @public */
export type BlendMode = z.infer<typeof BlendModeSchema>

// Full blend configuration
export const MusicApiBlendConfigSchema = z.object({
  enabled: z.boolean(),
  providers: z.array(MusicApiProviderConfigSchema),
  blendMode: BlendModeSchema,
  maxExternalTracks: z.number().optional()
})
/** @public */
export type MusicApiBlendConfig = z.infer<typeof MusicApiBlendConfigSchema>
