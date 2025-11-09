import WebSocket from 'ws'
import { attempt } from '@jfdi/attempt'
import type { MATrack } from '../../../shared/types.js'

interface MAMessage {
  message_id: string
  command: string
  [key: string]: unknown
}

interface MAResponse {
  message_id: string
  result?: unknown
  error?: {
    error_code: string
    message: string
  }
}

interface MASearchResult {
  items: MATrack[]
}

export class MusicAssistantClient {
  private ws: WebSocket | null = null
  private messageId = 0
  private pendingRequests = new Map<string, {
    resolve: (value: unknown) => void
    reject: (error: Error) => void
  }>()

  constructor(private url: string) {}

  async connect(): Promise<void> {
    const wsUrl = this.url.replace(/^http/, 'ws') + '/ws'

    const result = await attempt(async () => {
      this.ws = new WebSocket(wsUrl)

      return new Promise<void>((resolve, reject) => {
        if (!this.ws) {
          reject(new Error('WebSocket not initialized'))
          return
        }

        this.ws.on('open', () => resolve())
        this.ws.on('error', err => reject(err))
        this.ws.on('message', data => this.handleMessage(data.toString()))
      })
    })

    if (!result.ok) {
      throw new Error(`Failed to connect to Music Assistant: ${result.error.message}`)
    }
  }

  private handleMessage(data: string): void {
    const result = attempt(() => JSON.parse(data) as MAResponse)

    if (!result.ok) {
      console.error('Failed to parse MA message:', result.error)
      return
    }

    const message = result.value
    const pending = this.pendingRequests.get(message.message_id)

    if (!pending) return

    if (message.error) {
      pending.reject(new Error(message.error.message))
    } else {
      pending.resolve(message.result)
    }

    this.pendingRequests.delete(message.message_id)
  }

  private async sendCommand<T>(command: string, params?: Record<string, unknown>): Promise<T> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to Music Assistant')
    }

    const messageId = `msg_${this.messageId++}`
    const message: MAMessage = {
      message_id: messageId,
      command,
      ...params
    }

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(messageId, { resolve: resolve as (value: unknown) => void, reject })

      const result = attempt(() => {
        this.ws?.send(JSON.stringify(message))
      })

      if (!result.ok) {
        this.pendingRequests.delete(messageId)
        reject(result.error)
      }

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(messageId)) {
          this.pendingRequests.delete(messageId)
          reject(new Error('Request timeout'))
        }
      }, 30000)
    })
  }

  async searchTracks(query: string, limit = 50): Promise<MATrack[]> {
    const result = await this.sendCommand<MASearchResult>('music/search', {
      search_query: query,
      media_types: ['track'],
      limit
    })

    return result.items
  }

  async getFavoriteArtists(): Promise<string[]> {
    const favResult = await attempt(async () => {
      const result = await this.sendCommand<{ items: Array<{ name: string }> }>('music/favorites', {
        media_type: 'artist'
      })
      return result.items.map(item => item.name)
    })

    // If favorites endpoint doesn't exist or fails, return empty array
    return favResult.ok ? favResult.value : []
  }

  async getLibraryTracks(limit = 1000): Promise<MATrack[]> {
    const result = await this.sendCommand<{ items: MATrack[] }>('music/library_items', {
      media_type: 'track',
      limit
    })

    return result.items
  }

  async createPlaylist(name: string, providerInstance?: string): Promise<string> {
    const result = await this.sendCommand<{ playlist_id: string }>('music/playlist/create', {
      name,
      provider_instance: providerInstance
    })

    return result.playlist_id
  }

  async addTracksToPlaylist(playlistId: string, trackUris: string[]): Promise<void> {
    await this.sendCommand('music/playlist/add_tracks', {
      playlist_id: playlistId,
      uris: trackUris
    })
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.pendingRequests.clear()
  }
}
