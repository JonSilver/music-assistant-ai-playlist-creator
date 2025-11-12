import React from "react";
import type { GetSettingsResponse, PresetPrompt, PromptHistory } from "@shared/types";
import type { UsePlaylistReturn } from "../hooks/usePlaylist";
import { Navbar } from "./Navbar";
import { AlertMessage } from "./AlertMessage";
import { PresetPrompts } from "./PresetPrompts";
import { PlaylistCreatorForm } from "./PlaylistCreatorForm";
import { GeneratedTracksDisplay } from "./GeneratedTracksDisplay";
import { HistoryModal } from "./HistoryModal";
import { RefinePlaylistModal } from "./RefinePlaylistModal";

interface MainViewProps {
    settings: GetSettingsResponse;
    selectedProviderId: string | null;
    setSelectedProviderId: (id: string) => void;
    error: string | null;
    successMessage: string | null;
    clearError: () => void;
    clearSuccess: () => void;
    presets: PresetPrompt[];
    playlist: UsePlaylistReturn;
    history: PromptHistory[];
    showHistory: boolean;
    showRefine: boolean;
    openSettings: () => void;
    openHistory: () => void;
    closeHistory: () => void;
    openRefine: () => void;
    closeRefine: () => void;
}

export const MainView = ({
    settings,
    selectedProviderId,
    setSelectedProviderId,
    error,
    successMessage,
    clearError,
    clearSuccess,
    presets,
    playlist,
    history,
    showHistory,
    showRefine,
    openSettings,
    openHistory,
    closeHistory,
    openRefine,
    closeRefine
}: MainViewProps): React.JSX.Element => (
    <div className="min-h-screen bg-base-200">
        <Navbar onShowSettings={openSettings} onShowHistory={openHistory} />

        {error !== null && <AlertMessage type="error" message={error} onDismiss={clearError} />}
        {successMessage !== null && (
            <AlertMessage type="success" message={successMessage} onDismiss={clearSuccess} />
        )}

        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <PresetPrompts
                    presets={presets}
                    onSelectPreset={preset => {
                        playlist.setPrompt(preset.prompt);
                        playlist.setPlaylistName(preset.name);
                    }}
                />

                <PlaylistCreatorForm
                    playlistName={playlist.playlistName}
                    prompt={playlist.prompt}
                    trackCount={playlist.trackCount}
                    generating={playlist.generating}
                    providers={settings.aiProviders}
                    selectedProviderId={selectedProviderId}
                    onPlaylistNameChange={playlist.setPlaylistName}
                    onPromptChange={playlist.setPrompt}
                    onTrackCountChange={playlist.setTrackCount}
                    onProviderChange={setSelectedProviderId}
                    onGenerate={() => {
                        void playlist.generatePlaylist();
                    }}
                />

                {playlist.generatedTracks.length > 0 && (
                    <GeneratedTracksDisplay
                        tracks={playlist.generatedTracks}
                        creating={playlist.creating}
                        replacingTrackIndex={playlist.replacingTrackIndex}
                        retryingTrackIndex={playlist.retryingTrackIndex}
                        trackFilter={playlist.trackFilter}
                        onTrackFilterChange={playlist.setTrackFilter}
                        onReplaceTrack={(index: number) => {
                            void playlist.replaceTrack(index);
                        }}
                        onRetryTrack={(index: number) => {
                            void playlist.retryTrack(index);
                        }}
                        onRemoveTrack={playlist.removeTrack}
                        onClear={playlist.clearTracks}
                        onRefine={openRefine}
                        onCreate={() => {
                            void playlist.createPlaylist();
                        }}
                    />
                )}
            </div>
        </div>

        <HistoryModal
            show={showHistory}
            history={history}
            onClose={closeHistory}
            onSelectHistory={(item: { prompt: string; playlistName?: string }) => {
                playlist.setPrompt(item.prompt);
                if (item.playlistName !== undefined) {
                    playlist.setPlaylistName(item.playlistName);
                }
                closeHistory();
            }}
        />

        <RefinePlaylistModal
            show={showRefine}
            onClose={closeRefine}
            refinementPrompt={playlist.refinementPrompt}
            onRefinementPromptChange={playlist.setRefinementPrompt}
            refining={playlist.refining}
            onRefine={() => {
                void playlist.refinePlaylist();
            }}
        />
    </div>
);
