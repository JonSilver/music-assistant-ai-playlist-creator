/**
 * Provider weights management component
 * Allows users to add, reorder, and remove provider keywords
 */

import React, { useState } from "react";

interface IProviderWeightsListProps {
    keywords: string[];
    onChange: (keywords: string[]) => void;
}

export const ProviderWeightsList: React.FC<IProviderWeightsListProps> = ({
    keywords,
    onChange
}) => {
    const [inputValue, setInputValue] = useState("");

    const handleAdd = (): void => {
        const trimmed = inputValue.trim();
        if (trimmed === "") return;

        // Avoid duplicates
        if (keywords.includes(trimmed)) {
            setInputValue("");
            return;
        }

        onChange([...keywords, trimmed]);
        setInputValue("");
    };

    const handleRemove = (index: number): void => {
        onChange(keywords.filter((_, i) => i !== index));
    };

    const handleMoveUp = (index: number): void => {
        if (index === 0) return;
        const newKeywords = [...keywords];
        [newKeywords[index - 1], newKeywords[index]] = [newKeywords[index], newKeywords[index - 1]];
        onChange(newKeywords);
    };

    const handleMoveDown = (index: number): void => {
        if (index === keywords.length - 1) return;
        const newKeywords = [...keywords];
        [newKeywords[index], newKeywords[index + 1]] = [newKeywords[index + 1], newKeywords[index]];
        onChange(newKeywords);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAdd();
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <input
                    type="text"
                    placeholder="Enter provider keyword (e.g., local, spotify, tidal)"
                    className="input input-bordered flex-1"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleAdd}
                    disabled={inputValue.trim() === ""}
                >
                    Add
                </button>
            </div>

            {keywords.length === 0 ? (
                <div className="text-sm opacity-60 italic">
                    No provider keywords configured. Add keywords to prioritise providers.
                </div>
            ) : (
                <div className="space-y-2">
                    <div className="text-sm opacity-80">Priority order (1 = highest priority):</div>
                    {keywords.map((keyword, index) => (
                        <div
                            key={`${keyword}-${index}`}
                            className="flex items-center gap-2 p-2 bg-base-200 rounded-lg"
                        >
                            <div className="badge badge-primary font-mono">{index + 1}</div>
                            <div className="flex-1 font-medium">{keyword}</div>
                            <div className="flex gap-1">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-ghost"
                                    onClick={() => handleMoveUp(index)}
                                    disabled={index === 0}
                                    title="Move up"
                                >
                                    ↑
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-ghost"
                                    onClick={() => handleMoveDown(index)}
                                    disabled={index === keywords.length - 1}
                                    title="Move down"
                                >
                                    ↓
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-ghost btn-error"
                                    onClick={() => handleRemove(index)}
                                    title="Remove"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="text-xs opacity-60 space-y-1">
                <p>• Keywords are matched case-insensitively anywhere in the provider name</p>
                <p>• If a provider matches multiple keywords, their weights are summed</p>
                <p>• Providers without keyword matches appear in their original order</p>
            </div>
        </div>
    );
};
