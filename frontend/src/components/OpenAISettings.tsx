import React from "react";
import { TestResultDisplay } from "./TestResultDisplay";

interface TestResult {
    success: boolean;
    error?: string;
}

interface OpenAISettingsProps {
    openaiApiKey: string;
    setOpenaiApiKey: (value: string) => void;
    openaiModel: string;
    setOpenaiModel: (value: string) => void;
    openaiBaseUrl: string;
    setOpenaiBaseUrl: (value: string) => void;
    testingOpenAI: boolean;
    testResults: { openai?: TestResult };
    testOpenAI: () => Promise<void>;
}

const OPENAI_MODELS = [
    { value: "gpt-4-turbo-preview", label: "GPT-4 Turbo" },
    { value: "gpt-4", label: "GPT-4" },
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini" },
    { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" }
];

export const OpenAISettings = ({
    openaiApiKey,
    setOpenaiApiKey,
    openaiModel,
    setOpenaiModel,
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
                    setOpenaiApiKey(e.target.value);
                }}
            />
        </div>

        <div className="form-control mb-4">
            <label className="label">
                <span className="label-text">OpenAI Model</span>
            </label>
            <select
                className="select select-bordered w-full"
                value={openaiModel}
                onChange={e => {
                    setOpenaiModel(e.target.value);
                }}
            >
                {OPENAI_MODELS.map(model => (
                    <option key={model.value} value={model.value}>
                        {model.label}
                    </option>
                ))}
            </select>
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
                    setOpenaiBaseUrl(e.target.value);
                }}
            />
            <label className="label">
                <span className="label-text-alt">For OpenAI-compatible endpoints</span>
            </label>
        </div>

        <button
            className="btn btn-sm btn-outline mb-4"
            onClick={() => {
                void testOpenAI();
            }}
            disabled={testingOpenAI || openaiApiKey.trim().length === 0}
        >
            {testingOpenAI && <span className="loading loading-spinner loading-xs"></span>}
            {testingOpenAI ? "Testing..." : "Test API Key"}
        </button>
        <TestResultDisplay
            result={testResults.openai}
            successMessage="API key valid!"
            errorPrefix="API key test failed"
        />
    </>
);
