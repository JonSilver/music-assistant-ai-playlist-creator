import type { Router, Request, Response } from 'express'
import { attemptPromise } from '@jfdi/attempt'
import { MusicAssistantClient } from '../services/musicAssistant.js'
import { AIService } from '../services/ai.js'
import type { PlaylistDatabase } from '../db/schema.js'
import type {
  UpdateSettingsRequest,
  GetSettingsResponse,
  TestConnectionResponse,
  SuccessResponse
} from '../../../shared/types.js'

export const setupSettingsRoutes = (router: Router, db: PlaylistDatabase): void => {
  // Get settings
  router.get('/settings', (_req: Request, res: Response) => {
    const musicAssistantUrl = db.getSetting('musicAssistantUrl') ?? ''
    const aiProvider = (db.getSetting('aiProvider') ?? 'claude') as 'claude' | 'openai'
    const anthropicKey = db.getSetting('anthropicApiKey')
    const anthropicModel = db.getSetting('anthropicModel')
    const openaiKey = db.getSetting('openaiApiKey')
    const openaiModel = db.getSetting('openaiModel')
    const openaiBaseUrl = db.getSetting('openaiBaseUrl')
    const customSystemPrompt = db.getSetting('customSystemPrompt')
    const temperatureStr = db.getSetting('temperature')
    const temperature = temperatureStr !== null ? parseFloat(temperatureStr) : undefined

    const response: GetSettingsResponse = {
      musicAssistantUrl,
      aiProvider,
      anthropicApiKey: anthropicKey ?? undefined,
      anthropicModel: anthropicModel ?? undefined,
      openaiApiKey: openaiKey ?? undefined,
      openaiModel: openaiModel ?? undefined,
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

    if (updates.anthropicModel !== undefined) {
      db.setSetting('anthropicModel', updates.anthropicModel)
    }

    if (updates.openaiApiKey !== undefined) {
      db.setSetting('openaiApiKey', updates.openaiApiKey)
    }

    if (updates.openaiModel !== undefined) {
      db.setSetting('openaiModel', updates.openaiModel)
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

    const response: SuccessResponse = { success: true }
    res.json(response)
  })

  // Test Music Assistant connection
  router.post('/settings/test/music-assistant', async (req: Request, res: Response) => {
    const { url } = req.body as { url: string }

    if (!url) {
      const errorResponse: TestConnectionResponse = { success: false, error: 'URL is required' }
      res.status(400).json(errorResponse)
      return
    }

    const [err, result] = await attemptPromise(async (): Promise<TestConnectionResponse> => {
      const client = new MusicAssistantClient(url)
      await client.connect()
      client.disconnect()
      return { success: true }
    })

    if (err !== undefined) {
      const errorResponse: TestConnectionResponse = { success: false, error: err.message }
      res.json(errorResponse)
      return
    }

    res.json(result)
  })

  // Test Anthropic API key
  router.post('/settings/test/anthropic', async (req: Request, res: Response) => {
    const { apiKey } = req.body as { apiKey: string }

    if (!apiKey) {
      const errorResponse: TestConnectionResponse = { success: false, error: 'API key is required' }
      res.status(400).json(errorResponse)
      return
    }

    const [err, result] = await attemptPromise(async (): Promise<TestConnectionResponse> => {
      const aiService = new AIService(apiKey, undefined, undefined)
      // Simple test prompt
      await aiService.generatePlaylist({
        prompt: 'Test',
        provider: 'claude'
      })
      return { success: true }
    })

    if (err !== undefined) {
      const errorResponse: TestConnectionResponse = { success: false, error: err.message }
      res.json(errorResponse)
      return
    }

    res.json(result)
  })

  // Test OpenAI API key
  router.post('/settings/test/openai', async (req: Request, res: Response) => {
    const { apiKey, baseUrl } = req.body as { apiKey: string; baseUrl?: string }

    if (!apiKey) {
      const errorResponse: TestConnectionResponse = { success: false, error: 'API key is required' }
      res.status(400).json(errorResponse)
      return
    }

    const [err, result] = await attemptPromise(async (): Promise<TestConnectionResponse> => {
      const aiService = new AIService(undefined, apiKey, baseUrl)
      // Simple test prompt
      await aiService.generatePlaylist({
        prompt: 'Test',
        provider: 'openai'
      })
      return { success: true }
    })

    if (err !== undefined) {
      const errorResponse: TestConnectionResponse = { success: false, error: err.message }
      res.json(errorResponse)
      return
    }

    res.json(result)
  })
}
