import type { AIProviderConfig } from "@shared/types";
import type { GenerationPhase } from "../hooks/usePlaylist";
import React from "react";
import { LoadingButton } from "./LoadingButton";
import { VersionCopyrightFooter } from "./VersionCopyrightFooter";

const getLoadingText = (phase: GenerationPhase, providerName: string): string => {
    switch (phase) {
        case "enriching_external":
            return "Fetching from music APIs...";
        case "matching_tracks":
            return "Matching tracks in library...";
        default:
            return `Generating with ${providerName}...`;
    }
};

interface IPlaylistCreatorFormProps {
    playlistName: string;
    prompt: string;
    trackCount: string;
    generating: boolean;
    generationPhase: GenerationPhase;
    providers: AIProviderConfig[];
    selectedProviderId: string | null;
    onPlaylistNameChange: (value: string) => void;
    onPromptChange: (value: string) => void;
    onTrackCountChange: (value: string) => void;
    onProviderChange: (providerId: string) => void;
    onGenerate: () => void;
}

export const PlaylistCreatorForm: React.FC<IPlaylistCreatorFormProps> = ({
    playlistName,
    prompt,
    trackCount,
    generating,
    generationPhase,
    providers,
    selectedProviderId,
    onPlaylistNameChange,
    onPromptChange,
    onTrackCountChange,
    onProviderChange,
    onGenerate
}) => {
    const selectedProvider = providers.find(p => p.id === selectedProviderId);
    const providerName = selectedProvider?.name ?? "AI";

    return (
        <div className="card bg-base-100 shadow-xl mb-4">
            <div className="card-body">
                <h2 className="card-title">Create Playlist</h2>

                {providers.length > 1 && (
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">AI Provider</span>
                        </label>
                        <select
                            className="select select-bordered w-full"
                            value={selectedProviderId ?? ""}
                            onChange={e => {
                                onProviderChange(e.target.value);
                            }}
                        >
                            {providers.map(provider => (
                                <option key={provider.id} value={provider.id}>
                                    {provider.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="flex gap-4">
                    <div className="form-control flex-1">
                        <label className="label">
                            <span className="label-text">Playlist Name</span>
                        </label>
                        <input
                            type="text"
                            placeholder="My Awesome Playlist"
                            className="input input-bordered w-full"
                            value={playlistName}
                            onChange={e => {
                                onPlaylistNameChange(e.target.value);
                            }}
                        />
                    </div>

                    <div className="form-control w-32">
                        <label className="label">
                            <span className="label-text">Tracks</span>
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            placeholder="25"
                            className="input input-bordered w-full"
                            value={trackCount}
                            onChange={e => {
                                onTrackCountChange(e.target.value);
                            }}
                        />
                    </div>
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Describe your playlist</span>
                    </label>
                    <textarea
                        className="textarea textarea-bordered h-24 w-full"
                        placeholder="e.g., Upbeat workout music with rock and electronic tracks"
                        value={prompt}
                        onChange={e => {
                            onPromptChange(e.target.value);
                        }}
                    ></textarea>
                </div>

                <div className="relative card-actions justify-end">
                    <LoadingButton
                        loading={generating}
                        onClick={onGenerate}
                        disabled={
                            prompt.trim().length === 0 ||
                            playlistName.trim().length === 0 ||
                            providers.length === 0
                        }
                        loadingText={getLoadingText(generationPhase, providerName)}
                    >
                        Generate Playlist
                    </LoadingButton>

                    <VersionCopyrightFooter />
                </div>
            </div>
        </div>
    );
};
