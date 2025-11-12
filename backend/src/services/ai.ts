import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { attempt, attemptPromise } from "@jfdi/attempt";
import {
    type AIProviderConfig,
    type AIPlaylistResponse,
    AIPlaylistResponseSchema
} from "../../../shared/types.js";

interface AIPlaylistRequest {
    prompt: string;
    favoriteArtists?: string[];
    providerConfig: AIProviderConfig;
    customSystemPrompt?: string;
    trackCount?: number;
}

export class AIService {
    // No static clients - create per-request based on provider config
    constructor() {}

    private getAnthropicClient(config: AIProviderConfig): Anthropic {
        if (config.type !== "anthropic") {
            throw new Error("Provider is not Anthropic type");
        }
        return new Anthropic({ apiKey: config.apiKey });
    }

    private getOpenAIClient(config: AIProviderConfig): OpenAI {
        if (config.type !== "openai-compatible") {
            throw new Error("Provider is not OpenAI-compatible type");
        }
        return new OpenAI({
            apiKey: config.apiKey,
            baseURL: config.baseUrl
        });
    }

    private buildSystemPrompt(
        favoriteArtists?: string[],
        customPrompt?: string,
        trackCount?: number
    ): string {
        let prompt =
            customPrompt ??
            `You are a music playlist curator assistant. Your job is to create thoughtful, cohesive playlists based on user descriptions.

CRITICAL INSTRUCTION: You MUST respond with ONLY valid JSON. Do not include any text before or after the JSON. Do not use markdown code blocks. Do not add explanations. Start your response with { and end with }.

Required JSON format:
{
  "tracks": [
    {
      "title": "Song Title",
      "artist": "Artist Name",
      "album": "Album Name"
    }
  ],
  "reasoning": "Brief explanation of playlist curation choices"
}`;

        if (favoriteArtists && favoriteArtists.length > 0) {
            prompt += `\n\nThe user's favorite artists include: ${favoriteArtists.join(", ")}.
When appropriate, consider including tracks from these artists or similar artists.`;
        }

        // Only add guidelines if using default prompt
        if (!customPrompt) {
            const countGuideline = trackCount
                ? `- Create exactly ${trackCount} tracks`
                : "- Create 15-30 tracks unless user specifies otherwise";

            prompt += `\n\nGuidelines:
${countGuideline}
- Ensure good flow and cohesion
- Match the mood, genre, and era requested
- Include artist and album information for better matching
- Be specific with track titles and artist names
- Consider the user's favorite artists when relevant`;
        }

        return prompt;
    }

    async generatePlaylist(request: AIPlaylistRequest): Promise<AIPlaylistResponse> {
        const systemPrompt = this.buildSystemPrompt(
            request.favoriteArtists,
            request.customSystemPrompt,
            request.trackCount
        );
        const { providerConfig } = request;
        const temperature = providerConfig.temperature ?? 1.0;

        if (providerConfig.type === "anthropic") {
            return this.generateWithClaude(
                request.prompt,
                systemPrompt,
                temperature,
                providerConfig
            );
        }
        return this.generateWithOpenAI(request.prompt, systemPrompt, temperature, providerConfig);
    }

    private async generateWithClaude(
        userPrompt: string,
        systemPrompt: string,
        temperature: number,
        config: AIProviderConfig
    ): Promise<AIPlaylistResponse> {
        const client = this.getAnthropicClient(config);

        const [err, result] = await attemptPromise(async () => {
            const response = await client.messages.create({
                model: config.model,
                max_tokens: 4096,
                temperature,
                system: systemPrompt,
                messages: [
                    {
                        role: "user",
                        content: userPrompt
                    }
                ]
            });

            const content = response.content[0];
            if (content.type !== "text") {
                throw new Error("Unexpected response type from Claude");
            }

            return this.parseAIResponse(content.text);
        });

        if (err !== undefined) {
            throw new Error(`Claude API error: ${err.message}`);
        }

        return result;
    }

    private async generateWithOpenAI(
        userPrompt: string,
        systemPrompt: string,
        temperature: number,
        config: AIProviderConfig
    ): Promise<AIPlaylistResponse> {
        const client = this.getOpenAIClient(config);

        const [err, result] = await attemptPromise(async () => {
            const response = await client.chat.completions.create({
                model: config.model,
                temperature,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                response_format: { type: "json_object" }
            });

            const content = response.choices[0]?.message.content;
            if (content === null || content === undefined) {
                throw new Error("No response from OpenAI");
            }

            return this.parseAIResponse(content);
        });

        if (err !== undefined) {
            throw new Error(`OpenAI API error: ${err.message}`);
        }

        return result;
    }

    private parseAIResponse(content: string): AIPlaylistResponse {
        // Try to extract JSON from markdown code blocks if present
        let jsonContent = content.trim();
        const jsonMatch = /```(?:json)?\s*(\{[\s\S]*\})\s*```/.exec(jsonContent);
        if (jsonMatch !== null) {
            jsonContent = jsonMatch[1];
        }

        const [parseErr, data] = attempt(() => JSON.parse(jsonContent));

        if (parseErr !== undefined) {
            const preview = content.substring(0, 200);
            throw new Error(`Failed to parse AI response as JSON. Response start: ${preview}`);
        }

        // Validate response structure with Zod
        const parseResult = AIPlaylistResponseSchema.safeParse(data);
        if (!parseResult.success) {
            throw new Error(`Invalid AI response structure: ${parseResult.error.message}`);
        }

        return parseResult.data;
    }
}
