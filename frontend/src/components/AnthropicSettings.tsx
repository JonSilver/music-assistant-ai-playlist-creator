import React from "react";
import { TestResultDisplay } from "./TestResultDisplay";

interface TestResult {
    success: boolean;
    error?: string;
}

interface AnthropicSettingsProps {
    anthropicApiKey: string;
    setAnthropicApiKey: (value: string) => void;
    anthropicModel: string;
    setAnthropicModel: (value: string) => void;
    testingAnthropic: boolean;
    testResults: { anthropic?: TestResult };
    testAnthropic: () => Promise<void>;
}

const CLAUDE_MODELS = [
    { value: "claude-sonnet-4-5-20250929", label: "Claude 4.5 Sonnet (Latest)" },
    { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
    { value: "claude-3-opus-20240229", label: "Claude 3 Opus" },
    { value: "claude-3-sonnet-20240229", label: "Claude 3 Sonnet" },
    { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku" }
];

export const AnthropicSettings = ({
    anthropicApiKey,
    setAnthropicApiKey,
    anthropicModel,
    setAnthropicModel,
    testingAnthropic,
    testResults,
    testAnthropic
}: AnthropicSettingsProps): React.JSX.Element => (
    <>
        <div className="form-control mb-4">
            <label className="label">
                <span className="label-text">Anthropic API Key</span>
            </label>
            <input
                type="password"
                placeholder="sk-ant-..."
                className="input input-bordered w-full"
                value={anthropicApiKey}
                onChange={e => {
                    setAnthropicApiKey(e.target.value);
                }}
            />
            <button
                className="btn btn-sm btn-outline mt-2"
                onClick={() => {
                    void testAnthropic();
                }}
                disabled={testingAnthropic || anthropicApiKey.trim().length === 0}
            >
                {testingAnthropic && <span className="loading loading-spinner loading-xs"></span>}
                {testingAnthropic ? "Testing..." : "Test API Key"}
            </button>
            <TestResultDisplay
                result={testResults.anthropic}
                successMessage="API key valid!"
                errorPrefix="API key test failed"
            />
        </div>

        <div className="form-control mb-4">
            <label className="label">
                <span className="label-text">Claude Model</span>
            </label>
            <select
                className="select select-bordered w-full"
                value={anthropicModel}
                onChange={e => {
                    setAnthropicModel(e.target.value);
                }}
            >
                {CLAUDE_MODELS.map(model => (
                    <option key={model.value} value={model.value}>
                        {model.label}
                    </option>
                ))}
            </select>
        </div>
    </>
);
