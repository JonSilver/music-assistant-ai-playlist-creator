import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { attempt } from '@jfdi/attempt'
import type { AIProvider, TrackSuggestion } from '../../../shared/types.js'

interface AIPlaylistRequest {
  prompt: string
  favoriteArtists?: string[]
  provider: AIProvider
}

interface AIPlaylistResponse {
  tracks: TrackSuggestion[]
  reasoning?: string
}

export class AIService {
  private anthropic: Anthropic | null = null
  private openai: OpenAI | null = null

  constructor(
    private anthropicKey?: string,
    private openaiKey?: string,
    private openaiBaseUrl?: string
  ) {
    if (anthropicKey) {
      this.anthropic = new Anthropic({ apiKey: anthropicKey })
    }
    if (openaiKey) {
      this.openai = new OpenAI({
        apiKey: openaiKey,
        baseURL: openaiBaseUrl
      })
    }
  }

  private buildSystemPrompt(favoriteArtists?: string[]): string {
    let prompt = `You are a music playlist curator assistant. Your job is to create thoughtful, cohesive playlists based on user descriptions.

IMPORTANT: Return ONLY valid JSON in the exact format specified below. No other text.

Format your response as JSON:
{
  "tracks": [
    {
      "title": "Song Title",
      "artist": "Artist Name",
      "album": "Album Name"
    }
  ],
  "reasoning": "Brief explanation of playlist curation choices"
}`

    if (favoriteArtists && favoriteArtists.length > 0) {
      prompt += `\n\nThe user's favorite artists include: ${favoriteArtists.join(', ')}.
When appropriate, consider including tracks from these artists or similar artists.`
    }

    prompt += `\n\nGuidelines:
- Create 15-30 tracks unless user specifies otherwise
- Ensure good flow and cohesion
- Match the mood, genre, and era requested
- Include artist and album information for better matching
- Be specific with track titles and artist names
- Consider the user's favorite artists when relevant`

    return prompt
  }

  async generatePlaylist(request: AIPlaylistRequest): Promise<AIPlaylistResponse> {
    const systemPrompt = this.buildSystemPrompt(request.favoriteArtists)

    if (request.provider === 'claude') {
      return this.generateWithClaude(request.prompt, systemPrompt)
    }
    return this.generateWithOpenAI(request.prompt, systemPrompt)
  }

  private async generateWithClaude(
    userPrompt: string,
    systemPrompt: string
  ): Promise<AIPlaylistResponse> {
    if (!this.anthropic) {
      throw new Error('Claude API key not configured')
    }

    const result = await attempt(async () => {
      const response = await this.anthropic!.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      })

      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude')
      }

      return this.parseAIResponse(content.text)
    })

    if (!result.ok) {
      throw new Error(`Claude API error: ${result.error.message}`)
    }

    return result.value
  }

  private async generateWithOpenAI(
    userPrompt: string,
    systemPrompt: string
  ): Promise<AIPlaylistResponse> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured')
    }

    const result = await attempt(async () => {
      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0]?.message.content
      if (!content) {
        throw new Error('No response from OpenAI')
      }

      return this.parseAIResponse(content)
    })

    if (!result.ok) {
      throw new Error(`OpenAI API error: ${result.error.message}`)
    }

    return result.value
  }

  private parseAIResponse(content: string): AIPlaylistResponse {
    const parseResult = attempt(() => JSON.parse(content) as AIPlaylistResponse)

    if (!parseResult.ok) {
      throw new Error('Failed to parse AI response as JSON')
    }

    const data = parseResult.value

    // Validate response structure
    if (!data.tracks || !Array.isArray(data.tracks)) {
      throw new Error('Invalid AI response: missing tracks array')
    }

    // Validate each track
    for (const track of data.tracks) {
      if (!track.title || !track.artist) {
        throw new Error('Invalid track in AI response: missing title or artist')
      }
    }

    return data
  }
}
