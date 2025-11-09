import type { Router, Request, Response } from 'express'
import type { PlaylistDatabase } from '../db/schema.js'
import type { UpdateSettingsRequest, GetSettingsResponse } from '../../../shared/types.js'

export const setupSettingsRoutes = (router: Router, db: PlaylistDatabase): void => {
  // Get settings
  router.get('/settings', (_req: Request, res: Response) => {
    const musicAssistantUrl = db.getSetting('musicAssistantUrl') ?? ''
    const aiProvider = (db.getSetting('aiProvider') ?? 'claude') as 'claude' | 'openai'
    const anthropicKey = db.getSetting('anthropicApiKey')
    const openaiKey = db.getSetting('openaiApiKey')
    const openaiBaseUrl = db.getSetting('openaiBaseUrl')
    const customSystemPrompt = db.getSetting('customSystemPrompt')
    const temperatureStr = db.getSetting('temperature')
    const temperature = temperatureStr !== null ? parseFloat(temperatureStr) : undefined

    const response: GetSettingsResponse = {
      musicAssistantUrl,
      aiProvider,
      openaiBaseUrl: openaiBaseUrl ?? undefined,
      customSystemPrompt: customSystemPrompt ?? undefined,
      temperature,
      hasAnthropicKey: Boolean(anthropicKey),
      hasOpenAIKey: Boolean(openaiKey)
    }

    res.json(response)
  })

  // Update settings
  router.put('/settings', (req: Request, res: Response) => {
    const updates = req.body as UpdateSettingsRequest

    if (updates.musicAssistantUrl !== undefined) {
      db.setSetting('musicAssistantUrl', updates.musicAssistantUrl)
    }

    if (updates.aiProvider !== undefined) {
      db.setSetting('aiProvider', updates.aiProvider)
    }

    if (updates.anthropicApiKey !== undefined) {
      db.setSetting('anthropicApiKey', updates.anthropicApiKey)
    }

    if (updates.openaiApiKey !== undefined) {
      db.setSetting('openaiApiKey', updates.openaiApiKey)
    }

    if (updates.openaiBaseUrl !== undefined) {
      db.setSetting('openaiBaseUrl', updates.openaiBaseUrl)
    }

    if (updates.customSystemPrompt !== undefined) {
      db.setSetting('customSystemPrompt', updates.customSystemPrompt)
    }

    if (updates.temperature !== undefined) {
      db.setSetting('temperature', updates.temperature.toString())
    }

    res.json({ success: true })
  })
}
