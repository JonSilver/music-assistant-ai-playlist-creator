import React from 'react'
import { TestResultDisplay } from './TestResultDisplay'
import { AnthropicSettings } from './AnthropicSettings'
import { OpenAISettings } from './OpenAISettings'

interface TestResult {
  success: boolean
  error?: string
}

interface SettingsPageProps {
  musicAssistantUrl: string
  setMusicAssistantUrl: (value: string) => void
  aiProvider: 'claude' | 'openai'
  setAiProvider: (value: 'claude' | 'openai') => void
  anthropicApiKey: string
  setAnthropicApiKey: (value: string) => void
  openaiApiKey: string
  setOpenaiApiKey: (value: string) => void
  openaiBaseUrl: string
  setOpenaiBaseUrl: (value: string) => void
  customSystemPrompt: string
  setCustomSystemPrompt: (value: string) => void
  temperature: string
  setTemperature: (value: string) => void
  testingMA: boolean
  testingAnthropic: boolean
  testingOpenAI: boolean
  testResults: {
    ma?: TestResult
    anthropic?: TestResult
    openai?: TestResult
  }
  testMA: () => Promise<void>
  testAnthropic: () => Promise<void>
  testOpenAI: () => Promise<void>
  onSave: () => void
  onCancel?: () => void
  showCancel: boolean
}

export const SettingsPage = ({
  musicAssistantUrl,
  setMusicAssistantUrl,
  aiProvider,
  setAiProvider,
  anthropicApiKey,
  setAnthropicApiKey,
  openaiApiKey,
  setOpenaiApiKey,
  openaiBaseUrl,
  setOpenaiBaseUrl,
  customSystemPrompt,
  setCustomSystemPrompt,
  temperature,
  setTemperature,
  testingMA,
  testingAnthropic,
  testingOpenAI,
  testResults,
  testMA,
  testAnthropic,
  testOpenAI,
  onSave,
  onCancel,
  showCancel
}: SettingsPageProps): React.JSX.Element => (
  <div className="min-h-screen bg-base-200 py-8">
    <div className="container mx-auto px-4 max-w-2xl">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="card-title text-2xl mb-6">Settings</h1>

          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">Music Assistant URL</span>
            </label>
            <input
              type="text"
              placeholder="http://192.168.1.100:8095"
              className="input input-bordered w-full"
              value={musicAssistantUrl}
              onChange={e => {
                setMusicAssistantUrl(e.target.value)
              }}
            />
            <label className="label">
              <span className="label-text-alt">WebSocket URL of your Music Assistant server</span>
            </label>
            <button
              className="btn btn-sm btn-outline mt-2"
              onClick={() => {
                void testMA()
              }}
              disabled={testingMA || musicAssistantUrl.trim().length === 0}
            >
              {testingMA && <span className="loading loading-spinner loading-xs"></span>}
              {testingMA ? 'Testing...' : 'Test Connection'}
            </button>
            <TestResultDisplay
              result={testResults.ma}
              successMessage="Connection successful!"
              errorPrefix="Connection failed"
            />
          </div>

          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">AI Provider</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={aiProvider}
              onChange={e => {
                setAiProvider(e.target.value as 'claude' | 'openai')
              }}
            >
              <option value="claude">Claude (Anthropic)</option>
              <option value="openai">OpenAI</option>
            </select>
          </div>

          {aiProvider === 'claude' && (
            <AnthropicSettings
              anthropicApiKey={anthropicApiKey}
              setAnthropicApiKey={setAnthropicApiKey}
              testingAnthropic={testingAnthropic}
              testResults={testResults}
              testAnthropic={testAnthropic}
            />
          )}

          {aiProvider === 'openai' && (
            <OpenAISettings
              openaiApiKey={openaiApiKey}
              setOpenaiApiKey={setOpenaiApiKey}
              openaiBaseUrl={openaiBaseUrl}
              setOpenaiBaseUrl={setOpenaiBaseUrl}
              testingOpenAI={testingOpenAI}
              testResults={testResults}
              testOpenAI={testOpenAI}
            />
          )}

          <div className="divider"></div>

          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">Temperature</span>
            </label>
            <input
              type="number"
              min="0"
              max="2"
              step="0.1"
              placeholder="1.0"
              className="input input-bordered w-full"
              value={temperature}
              onChange={e => {
                setTemperature(e.target.value)
              }}
            />
            <label className="label">
              <span className="label-text-alt">
                Controls randomness (0 = focused, 2 = creative). Default: 1.0
              </span>
            </label>
          </div>

          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">Custom System Prompt (Optional)</span>
            </label>
            <textarea
              className="textarea textarea-bordered h-32 w-full"
              placeholder="Override the default AI system prompt. Leave empty to use default."
              value={customSystemPrompt}
              onChange={e => {
                setCustomSystemPrompt(e.target.value)
              }}
            ></textarea>
            <label className="label">
              <span className="label-text-alt">
                Customize how the AI curates playlists. Must return JSON format.
              </span>
            </label>
          </div>

          <div className="card-actions justify-end gap-2">
            {showCancel && onCancel !== undefined && (
              <button className="btn btn-ghost" onClick={onCancel}>
                Cancel
              </button>
            )}
            <button className="btn btn-primary" onClick={onSave}>
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)
