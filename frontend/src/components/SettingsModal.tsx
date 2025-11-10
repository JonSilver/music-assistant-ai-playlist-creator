import React from 'react'

interface TestResult {
  success: boolean
  error?: string
}

interface SettingsModalProps {
  show: boolean
  onClose: () => void
  musicAssistantUrl: string
  onMusicAssistantUrlChange: (value: string) => void
  aiProvider: 'claude' | 'openai'
  onAiProviderChange: (value: 'claude' | 'openai') => void
  anthropicApiKey: string
  onAnthropicApiKeyChange: (value: string) => void
  openaiApiKey: string
  onOpenaiApiKeyChange: (value: string) => void
  openaiBaseUrl: string
  onOpenaiBaseUrlChange: (value: string) => void
  customSystemPrompt: string
  onCustomSystemPromptChange: (value: string) => void
  temperature: string
  onTemperatureChange: (value: string) => void
  testingMA: boolean
  testingAnthropic: boolean
  testingOpenAI: boolean
  testResults: {
    ma?: TestResult
    anthropic?: TestResult
    openai?: TestResult
  }
  onTestMA: () => void
  onTestAnthropic: () => void
  onTestOpenAI: () => void
  onSave: () => void
}

export const SettingsModal = ({
  show,
  onClose,
  musicAssistantUrl,
  onMusicAssistantUrlChange,
  aiProvider,
  onAiProviderChange,
  anthropicApiKey,
  onAnthropicApiKeyChange,
  openaiApiKey,
  onOpenaiApiKeyChange,
  openaiBaseUrl,
  onOpenaiBaseUrlChange,
  customSystemPrompt,
  onCustomSystemPromptChange,
  temperature,
  onTemperatureChange,
  testingMA,
  testingAnthropic,
  testingOpenAI,
  testResults,
  onTestMA,
  onTestAnthropic,
  onTestOpenAI,
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
            className="input input-bordered"
            value={musicAssistantUrl}
            onChange={e => {
              onMusicAssistantUrlChange(e.target.value)
            }}
          />
          <label className="label">
            <span className="label-text-alt">WebSocket URL of your Music Assistant server</span>
          </label>
          <button
            className="btn btn-sm btn-outline mt-2"
            onClick={onTestMA}
            disabled={testingMA || musicAssistantUrl.trim().length === 0}
          >
            {testingMA && <span className="loading loading-spinner loading-xs"></span>}
            {testingMA ? 'Testing...' : 'Test Connection'}
          </button>
          {testResults.ma !== undefined && (
            <div
              className={`alert ${testResults.ma.success ? 'alert-success' : 'alert-error'} mt-2`}
            >
              <span className="text-sm">
                {testResults.ma.success
                  ? 'Connection successful!'
                  : `Connection failed: ${testResults.ma.error ?? 'Unknown error'}`}
              </span>
            </div>
          )}
        </div>

        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">AI Provider</span>
          </label>
          <select
            className="select select-bordered"
            value={aiProvider}
            onChange={e => {
              onAiProviderChange(e.target.value as 'claude' | 'openai')
            }}
          >
            <option value="claude">Claude (Anthropic)</option>
            <option value="openai">OpenAI</option>
          </select>
        </div>

        {aiProvider === 'claude' && (
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">Anthropic API Key</span>
            </label>
            <input
              type="password"
              placeholder="sk-ant-..."
              className="input input-bordered"
              value={anthropicApiKey}
              onChange={e => {
                onAnthropicApiKeyChange(e.target.value)
              }}
            />
            <button
              className="btn btn-sm btn-outline mt-2"
              onClick={onTestAnthropic}
              disabled={testingAnthropic || anthropicApiKey.trim().length === 0}
            >
              {testingAnthropic && <span className="loading loading-spinner loading-xs"></span>}
              {testingAnthropic ? 'Testing...' : 'Test API Key'}
            </button>
            {testResults.anthropic !== undefined && (
              <div
                className={`alert ${testResults.anthropic.success ? 'alert-success' : 'alert-error'} mt-2`}
              >
                <span className="text-sm">
                  {testResults.anthropic.success
                    ? 'API key valid!'
                    : `API key test failed: ${testResults.anthropic.error ?? 'Unknown error'}`}
                </span>
              </div>
            )}
          </div>
        )}

        {aiProvider === 'openai' && (
          <>
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">OpenAI API Key</span>
              </label>
              <input
                type="password"
                placeholder="sk-..."
                className="input input-bordered"
                value={openaiApiKey}
                onChange={e => {
                  onOpenaiApiKeyChange(e.target.value)
                }}
              />
            </div>

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">OpenAI Base URL (Optional)</span>
              </label>
              <input
                type="text"
                placeholder="https://api.openai.com/v1"
                className="input input-bordered"
                value={openaiBaseUrl}
                onChange={e => {
                  onOpenaiBaseUrlChange(e.target.value)
                }}
              />
              <label className="label">
                <span className="label-text-alt">For OpenAI-compatible endpoints</span>
              </label>
            </div>

            <button
              className="btn btn-sm btn-outline mb-4"
              onClick={onTestOpenAI}
              disabled={testingOpenAI || openaiApiKey.trim().length === 0}
            >
              {testingOpenAI && <span className="loading loading-spinner loading-xs"></span>}
              {testingOpenAI ? 'Testing...' : 'Test API Key'}
            </button>
            {testResults.openai !== undefined && (
              <div
                className={`alert ${testResults.openai.success ? 'alert-success' : 'alert-error'} mb-4`}
              >
                <span className="text-sm">
                  {testResults.openai.success
                    ? 'API key valid!'
                    : `API key test failed: ${testResults.openai.error ?? 'Unknown error'}`}
                </span>
              </div>
            )}
          </>
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
            className="input input-bordered"
            value={temperature}
            onChange={e => {
              onTemperatureChange(e.target.value)
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
            className="textarea textarea-bordered h-32"
            placeholder="Override the default AI system prompt. Leave empty to use default."
            value={customSystemPrompt}
            onChange={e => {
              onCustomSystemPromptChange(e.target.value)
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
