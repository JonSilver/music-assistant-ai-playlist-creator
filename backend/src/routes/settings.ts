import type { Router, Request, Response } from 'express'
import { attempt } from '@jfdi/attempt'
import { MusicAssistantClient } from '../services/musicAssistant.js'
import { AIService } from '../services/ai.js'
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

  // Test Music Assistant connection
  router.post('/settings/test/music-assistant', async (req: Request, res: Response) => {
    const { url } = req.body as { url: string }

    if (!url) {
      res.status(400).json({ success: false, error: 'URL is required' })
      return
    }

    const [err, result] = await attempt(async () => {
      const client = new MusicAssistantClient(url)
      await client.connect()
      client.disconnect()
      return { success: true }
    })

    if (err !== undefined) {
      res.json({ success: false, error: err.message })
      return
    }

    res.json(result)
  })

  // Test Anthropic API key
  router.post('/settings/test/anthropic', async (req: Request, res: Response) => {
    const { apiKey } = req.body as { apiKey: string }

    if (!apiKey) {
      res.status(400).json({ success: false, error: 'API key is required' })
      return
    }

    const [err, result] = await attempt(async () => {
      const aiService = new AIService(apiKey, undefined, undefined)
      // Simple test prompt
      await aiService.generatePlaylist({
        prompt: 'Test',
        provider: 'claude'
      })
      return { success: true }
    })

    if (err !== undefined) {
      res.json({ success: false, error: err.message })
      return
    }

    res.json(result)
  })

  // Test OpenAI API key
  router.post('/settings/test/openai', async (req: Request, res: Response) => {
    const { apiKey, baseUrl } = req.body as { apiKey: string; baseUrl?: string }

    if (!apiKey) {
      res.status(400).json({ success: false, error: 'API key is required' })
      return
    }

    const [err, result] = await attempt(async () => {
      const aiService = new AIService(undefined, apiKey, baseUrl)
      // Simple test prompt
      await aiService.generatePlaylist({
        prompt: 'Test',
        provider: 'openai'
      })
      return { success: true }
    })

    if (err !== undefined) {
      res.json({ success: false, error: err.message })
      return
    }

    res.json(result)
  })
}
