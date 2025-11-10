import React from 'react'
import { TestResultDisplay } from './TestResultDisplay'

interface TestResult {
  success: boolean
  error?: string
}

interface AnthropicSettingsProps {
  anthropicApiKey: string
  setAnthropicApiKey: (value: string) => void
  testingAnthropic: boolean
  testResults: { anthropic?: TestResult }
  testAnthropic: () => Promise<void>
}

export const AnthropicSettings = ({
  anthropicApiKey,
  setAnthropicApiKey,
  testingAnthropic,
  testResults,
  testAnthropic
}: AnthropicSettingsProps): React.JSX.Element => (
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
        setAnthropicApiKey(e.target.value)
      }}
    />
    <button
      className="btn btn-sm btn-outline mt-2"
      onClick={() => {
        void testAnthropic()
      }}
      disabled={testingAnthropic || anthropicApiKey.trim().length === 0}
    >
      {testingAnthropic && <span className="loading loading-spinner loading-xs"></span>}
      {testingAnthropic ? 'Testing...' : 'Test API Key'}
    </button>
    <TestResultDisplay
      result={testResults.anthropic}
      successMessage="API key valid!"
      errorPrefix="API key test failed"
    />
  </div>
)
