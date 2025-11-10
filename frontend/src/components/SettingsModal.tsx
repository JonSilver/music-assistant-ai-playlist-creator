import React from 'react'
import { TestResultDisplay } from './TestResultDisplay'
import { AnthropicSettings } from './AnthropicSettings'
import { OpenAISettings } from './OpenAISettings'

interface TestResult {
  success: boolean
  error?: string
}

interface SettingsModalProps {
  show: boolean
  onClose: () => void
  musicAssistantUrl: string
  setMusicAssistantUrl: (value: string) => void
  aiProvider: 'claude' | 'openai'
  setAiProvider: (value: 'claude' | 'openai') => void
  anthropicApiKey: string
  setAnthropicApiKey: (value: string) => void
  anthropicModel: string
  setAnthropicModel: (value: string) => void
  openaiApiKey: string
  setOpenaiApiKey: (value: string) => void
  openaiModel: string
  setOpenaiModel: (value: string) => void
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
}

export const SettingsModal = ({
  show,
  onClose,
  musicAssistantUrl,
  setMusicAssistantUrl,
  aiProvider,
  setAiProvider,
  anthropicApiKey,
  setAnthropicApiKey,
  anthropicModel,
  setAnthropicModel,
  openaiApiKey,
  setOpenaiApiKey,
  openaiModel,
  setOpenaiModel,
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
  onSave
}: SettingsModalProps): React.JSX.Element | null => {
  if (!show) return null

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-lg mb-4">Settings</h3>

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
            anthropicModel={anthropicModel}
            setAnthropicModel={setAnthropicModel}
            testingAnthropic={testingAnthropic}
            testResults={testResults}
            testAnthropic={testAnthropic}
          />
        )}

        {aiProvider === 'openai' && (
          <OpenAISettings
            openaiApiKey={openaiApiKey}
            setOpenaiApiKey={setOpenaiApiKey}
            openaiModel={openaiModel}
            setOpenaiModel={setOpenaiModel}
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

        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={onSave}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}
