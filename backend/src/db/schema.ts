import Database from 'better-sqlite3'
import { attempt } from '@jfdi/attempt'
import type { PresetPrompt, PromptHistory } from '../../../shared/types.js'

export class PlaylistDatabase {
  private db: Database.Database

  constructor(dbPath: string) {
    this.db = new Database(dbPath)
    this.initialize()
  }

  private initialize(): void {
    // Settings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `)

    // Prompt history table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS prompt_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prompt TEXT NOT NULL,
        playlist_name TEXT,
        track_count INTEGER NOT NULL,
        timestamp TEXT NOT NULL
      )
    `)

    // Preset prompts table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS preset_prompts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        prompt TEXT NOT NULL,
        category TEXT NOT NULL
      )
    `)

    // Always ensure default presets exist (insert or ignore)
    this.insertDefaultPresets()
  }

  private insertDefaultPresets(): void {
    const defaultPresets: PresetPrompt[] = [
      {
        id: 'workout-high-energy',
        name: 'High Energy Workout',
        description: 'Upbeat tracks to power through your workout',
        prompt:
          'Create a high-energy workout playlist with fast-paced, motivating tracks. Include rock, electronic, and hip-hop with strong beats and driving rhythms. Perfect for cardio and intense training.',
        category: 'workout'
      },
      {
        id: 'chill-focus',
        name: 'Focus & Study',
        description: 'Calm instrumental music for concentration',
        prompt:
          'Create a calm, focused playlist for studying or deep work. Include lo-fi, ambient, classical, and instrumental tracks. No lyrics, smooth transitions, steady tempo around 60-80 BPM.',
        category: 'focus'
      },
      {
        id: 'party-dance',
        name: 'Party Mix',
        description: 'Popular dance hits to get everyone moving',
        prompt:
          'Create an energetic party playlist with current and classic dance hits. Mix pop, dance, EDM, and hip-hop. High energy, recognizable tracks that get people on the dance floor.',
        category: 'party'
      },
      {
        id: 'chill-evening',
        name: 'Evening Relaxation',
        description: 'Mellow tracks for unwinding',
        prompt:
          'Create a relaxing evening playlist with mellow, soothing tracks. Include indie, acoustic, jazz, and soul. Perfect for winding down after a long day.',
        category: 'chill'
      },
      {
        id: 'road-trip',
        name: 'Road Trip',
        description: 'Sing-along classics for the open road',
        prompt:
          'Create an epic road trip playlist with classic rock, alternative, and sing-along anthems. Mix of decades, feel-good vibes, great for long drives.',
        category: 'other'
      },
      {
        id: 'peppy-classical',
        name: 'Peppy Classical',
        description: 'Upbeat and energetic classical pieces',
        prompt:
          'Create a lively classical playlist with energetic, upbeat orchestral pieces. Include fast movements from symphonies, concertos, and overtures. Think Vivaldi, Mozart, Rossini - bright, cheerful, and invigorating classical music.',
        category: 'other'
      },
      {
        id: 'dinner-party',
        name: 'Dinner Party',
        description: 'Sophisticated background music for entertaining',
        prompt:
          'Create an elegant dinner party playlist with sophisticated, conversation-friendly music. Include jazz standards, bossa nova, light classical, and smooth vocals. Classy and refined, perfect background ambiance for entertaining guests.',
        category: 'other'
      }
    ]

    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO preset_prompts (id, name, description, prompt, category)
      VALUES (?, ?, ?, ?, ?)
    `)

    for (const preset of defaultPresets) {
      stmt.run(preset.id, preset.name, preset.description, preset.prompt, preset.category)
    }
  }

  getSetting(key: string): string | null {
    const [err, result] = attempt(() => {
      const row = this.db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as
        | { value: string }
        | undefined
      return row?.value ?? null
    })

    return err !== undefined ? null : result
  }

  setSetting(key: string, value: string): void {
    const [err] = attempt(() => {
      this.db
        .prepare(
          `
        INSERT INTO settings (key, value, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?
      `
        )
        .run(key, value, Date.now(), value, Date.now())
    })

    if (err !== undefined) {
      throw new Error(`Failed to set setting: ${err.message}`)
    }
  }

  addPromptHistory(prompt: string, playlistName: string | null, trackCount: number): number {
    const [err, result] = attempt(() => {
      const info = this.db
        .prepare(
          `
        INSERT INTO prompt_history (prompt, playlist_name, track_count, timestamp)
        VALUES (?, ?, ?, ?)
      `
        )
        .run(prompt, playlistName, trackCount, new Date().toISOString())

      return info.lastInsertRowid as number
    })

    if (err !== undefined) {
      throw new Error(`Failed to add prompt history: ${err.message}`)
    }

    return result
  }

  getPromptHistory(limit = 50): PromptHistory[] {
    const [err, result] = attempt(() => {
      const rows = this.db
        .prepare(
          `
        SELECT id, prompt, playlist_name, track_count, timestamp
        FROM prompt_history
        ORDER BY id DESC
        LIMIT ?
      `
        )
        .all(limit) as PromptHistory[]

      return rows
    })

    return err !== undefined ? [] : result
  }

  getPresetPrompts(): PresetPrompt[] {
    const [err, result] = attempt(() => {
      const rows = this.db
        .prepare(
          `
        SELECT id, name, description, prompt, category
        FROM preset_prompts
        ORDER BY category, name
      `
        )
        .all() as PresetPrompt[]

      return rows
    })

    return err !== undefined ? [] : result
  }

  close(): void {
    this.db.close()
  }
}
