import React from "react";
import type { PresetPrompt } from "../../../shared/types";

interface IPresetPromptsProps {
    presets: PresetPrompt[];
    onSelectPreset: (preset: PresetPrompt) => void;
}

export const PresetPrompts: React.FC<IPresetPromptsProps> = ({ presets, onSelectPreset }) => (
    <div className="card bg-base-100 shadow-xl mb-4">
        <div className="card-body">
            <h2 className="card-title">Quick Presets</h2>
            <div className="flex flex-wrap gap-2">
                {presets.map(preset => (
                    <button
                        key={preset.id}
                        className="btn btn-sm btn-outline"
                        onClick={() => {
                            onSelectPreset(preset);
                        }}
                    >
                        {preset.name}
                    </button>
                ))}
            </div>
        </div>
    </div>
);
