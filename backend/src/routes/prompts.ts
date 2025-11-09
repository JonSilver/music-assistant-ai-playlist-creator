import type { Router, Request, Response } from 'express'
import type { PlaylistDatabase } from '../db/schema.js'

export const setupPromptsRoutes = (router: Router, db: PlaylistDatabase): void => {
  // Get prompt history
  router.get('/prompts/history', (_req: Request, res: Response) => {
    const history = db.getPromptHistory(50)
    res.json(history)
  })

  // Get preset prompts
  router.get('/prompts/presets', (_req: Request, res: Response) => {
    const presets = db.getPresetPrompts()
    res.json(presets)
  })
}
