import WebSocket from 'ws'
import { attempt } from '@jfdi/attempt'
import type { MATrack } from '@shared/types'

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
  private pendingRequests = new Map<
    string,
    {
      resolve: (value: unknown) => void
      reject: (error: Error) => void
    }
  >()

  constructor(private url: string) {}

  async connect(): Promise<void> {
    const wsUrl = this.url.replace(/^http/, 'ws') + '/ws'

    const [err] = await attempt(async () => {
      this.ws = new WebSocket(wsUrl)

      return new Promise<void>((resolve, reject) => {
        if (this.ws === null) {
          reject(new Error('WebSocket not initialized'))
          return
        }

        this.ws.on('open', () => {
          resolve()
        })
        this.ws.on('error', err => {
          reject(err)
        })
        this.ws.on('message', data => {
          this.handleMessage(data.toString())
        })
      })
    })

    if (err !== undefined) {
      throw new Error(`Failed to connect to Music Assistant: ${err.message}`)
    }
  }

  private handleMessage(data: string): void {
    const [err, message] = attempt(() => JSON.parse(data) as MAResponse)

    if (err !== undefined) {
      console.error('Failed to parse MA message:', err)
      return
    }

    const pending = this.pendingRequests.get(message.message_id)

    if (pending === undefined) return

    if (message.error !== undefined && message.error !== null) {
      pending.reject(new Error(message.error.message))
    } else {
      pending.resolve(message.result)
    }

    this.pendingRequests.delete(message.message_id)
  }

  private async sendCommand<T>(command: string, params?: Record<string, unknown>): Promise<T> {
    if (this.ws === null || this.ws.readyState !== WebSocket.OPEN) {
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

      const [err] = attempt(() => {
        this.ws?.send(JSON.stringify(message))
      })

      if (err !== undefined) {
        this.pendingRequests.delete(messageId)
        reject(err)
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
    const [err, result] = await attempt(async () => {
      const response = await this.sendCommand<{ items: { name: string }[] }>('music/favorites', {
        media_type: 'artist'
      })
      return response.items.map(item => item.name)
    })

    // If favorites endpoint doesn't exist or fails, return empty array
    return err !== undefined ? [] : result
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
