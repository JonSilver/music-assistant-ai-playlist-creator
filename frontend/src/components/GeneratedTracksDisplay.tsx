import React from "react";
import type { TrackMatch } from "../../../shared/types";
import { UI_LABELS, TRACK_FILTERS, MATCH_THRESHOLDS } from "@shared/constants";
import { TrackRow } from "./TrackRow";

interface GeneratedTracksDisplayProps {
    tracks: TrackMatch[];
    creating: boolean;
    replacingTrackIndex: number | null;
    retryingTrackIndex: number | null;
    trackFilter: "all" | "matched" | "unmatched";
    onTrackFilterChange: (filter: "all" | "matched" | "unmatched") => void;
    onReplaceTrack: (index: number) => void;
    onRetryTrack: (index: number) => void;
    onRemoveTrack: (index: number) => void;
    onSelectMatch: (trackIndex: number, matchIndex: number) => void;
    onClear: () => void;
    onRefine: () => void;
    onCreate: () => void;
}

export const GeneratedTracksDisplay = ({
    tracks,
    creating,
    replacingTrackIndex,
    retryingTrackIndex,
    trackFilter,
    onTrackFilterChange,
    onReplaceTrack,
    onRetryTrack,
    onRemoveTrack,
    onSelectMatch,
    onClear,
    onRefine,
    onCreate
}: GeneratedTracksDisplayProps): React.JSX.Element | null => {
    if (tracks.length === 0) return null;

    const matchedCount = tracks.filter(t => t.matched).length;
    const totalCount = tracks.length;
    const matchPercentage = totalCount > 0 ? Math.round((matchedCount / totalCount) * 100) : 0;
    const hasMatchedTracks = matchedCount > 0;
    const isMatching = tracks.some(t => t.matching === true);

    const filteredTracks = tracks.filter(track => {
        if (trackFilter === TRACK_FILTERS.MATCHED) return track.matched;
        if (trackFilter === TRACK_FILTERS.UNMATCHED) return !track.matched;
        return true;
    });

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <div className="space-y-3 mb-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                        <div>
                            <h2 className="card-title mb-2">{UI_LABELS.GENERATED_TRACKS}</h2>
                            <div className="text-sm space-y-1">
                                <p>
                                    <span className="font-semibold">{matchedCount}</span> of{" "}
                                    <span className="font-semibold">{totalCount}</span> tracks found
                                    {matchPercentage > 0 && (
                                        <span className="ml-2 badge badge-sm badge-info">
                                            {matchPercentage}%
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="btn-group btn-group-horizontal flex-nowrap">
                            <button
                                className={`btn btn-xs sm:btn-sm flex-1 sm:flex-none ${trackFilter === TRACK_FILTERS.ALL ? "btn-active" : ""}`}
                                onClick={() => {
                                    onTrackFilterChange(TRACK_FILTERS.ALL);
                                }}
                            >
                                All ({totalCount})
                            </button>
                            <button
                                className={`btn btn-xs sm:btn-sm flex-1 sm:flex-none ${trackFilter === TRACK_FILTERS.MATCHED ? "btn-active" : ""}`}
                                onClick={() => {
                                    onTrackFilterChange(TRACK_FILTERS.MATCHED);
                                }}
                            >
                                Found ({matchedCount})
                            </button>
                            <button
                                className={`btn btn-xs sm:btn-sm flex-1 sm:flex-none ${trackFilter === TRACK_FILTERS.UNMATCHED ? "btn-active" : ""}`}
                                onClick={() => {
                                    onTrackFilterChange(TRACK_FILTERS.UNMATCHED);
                                }}
                            >
                                Missing ({totalCount - matchedCount})
                            </button>
                        </div>
                    </div>
                </div>

                {matchPercentage < MATCH_THRESHOLDS.PERFECT &&
                    matchPercentage > MATCH_THRESHOLDS.MIN_DISPLAY && (
                        <div className="mb-4">
                            <div className="flex justify-between text-xs mb-1">
                                <span>Match Rate</span>
                                <span>{matchPercentage}%</span>
                            </div>
                            <progress
                                className="progress progress-success w-full"
                                value={matchPercentage}
                                max={MATCH_THRESHOLDS.PERFECT}
                            ></progress>
                        </div>
                    )}

                <div className="overflow-x-auto">
                    <table className="table table-auto">
                        <thead className="hidden md:table-header-group">
                            <tr>
                                <th className="w-12">#</th>
                                <th className="min-w-[200px]">Title</th>
                                <th className="min-w-[150px]">Artist</th>
                                <th className="min-w-[150px]">Album</th>
                                <th className="w-32 whitespace-nowrap">Status</th>
                                <th className="w-28">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTracks.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 opacity-50">
                                        No tracks match the current filter
                                    </td>
                                </tr>
                            ) : (
                                filteredTracks.map(track => {
                                    const actualIndex = tracks.indexOf(track);
                                    return (
                                        <TrackRow
                                            key={actualIndex}
                                            track={track}
                                            index={actualIndex}
                                            replacingTrackIndex={replacingTrackIndex}
                                            retryingTrackIndex={retryingTrackIndex}
                                            onReplaceTrack={onReplaceTrack}
                                            onRetryTrack={onRetryTrack}
                                            onRemoveTrack={onRemoveTrack}
                                            onSelectMatch={onSelectMatch}
                                        />
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="card-actions justify-end mt-4">
                    <button className="btn btn-outline" onClick={onClear}>
                        {UI_LABELS.CLEAR}
                    </button>
                    <button className="btn btn-secondary" onClick={onRefine}>
                        {UI_LABELS.REFINE}
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={onCreate}
                        disabled={creating || !hasMatchedTracks || isMatching}
                    >
                        {creating && <span className="loading loading-spinner"></span>}
                        {creating ? UI_LABELS.CREATING : UI_LABELS.CREATE}
                    </button>
                </div>
            </div>
        </div>
    );
};
