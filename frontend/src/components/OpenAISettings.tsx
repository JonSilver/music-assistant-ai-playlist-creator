import React from 'react'
import { TestResultDisplay } from './TestResultDisplay'

interface TestResult {
  success: boolean
  error?: string
}

interface OpenAISettingsProps {
  openaiApiKey: string
  setOpenaiApiKey: (value: string) => void
  openaiBaseUrl: string
  setOpenaiBaseUrl: (value: string) => void
  testingOpenAI: boolean
  testResults: { openai?: TestResult }
  testOpenAI: () => Promise<void>
}

export const OpenAISettings = ({
  openaiApiKey,
  setOpenaiApiKey,
  openaiBaseUrl,
  setOpenaiBaseUrl,
  testingOpenAI,
  testResults,
  testOpenAI
}: OpenAISettingsProps): React.JSX.Element => (
  <>
    <div className="form-control mb-4">
      <label className="label">
        <span className="label-text">OpenAI API Key</span>
      </label>
      <input
        type="password"
        placeholder="sk-..."
        className="input input-bordered w-full"
        value={openaiApiKey}
        onChange={e => {
          setOpenaiApiKey(e.target.value)
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
        className="input input-bordered w-full"
        value={openaiBaseUrl}
        onChange={e => {
          setOpenaiBaseUrl(e.target.value)
        }}
      />
      <label className="label">
        <span className="label-text-alt">For OpenAI-compatible endpoints</span>
      </label>
    </div>

    <button
      className="btn btn-sm btn-outline mb-4"
      onClick={() => {
        void testOpenAI()
      }}
      disabled={testingOpenAI || openaiApiKey.trim().length === 0}
    >
      {testingOpenAI && <span className="loading loading-spinner loading-xs"></span>}
      {testingOpenAI ? 'Testing...' : 'Test API Key'}
    </button>
    <TestResultDisplay
      result={testResults.openai}
      successMessage="API key valid!"
      errorPrefix="API key test failed"
    />
  </>
)
