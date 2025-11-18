import type { MATrack, TrackMatch } from "@shared/types";
import React from "react";

interface ITrackRowMobileProps {
    track: TrackMatch;
    index: number;
    selectedMatch: MATrack | undefined;
    hasMultipleMatches: boolean;
    statusBadge: React.ReactNode;
    actionButtons: React.ReactNode;
    formatMatchOption: (match: MATrack, idx: number) => string;
    onSelectMatch: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const TrackRowMobile: React.FC<ITrackRowMobileProps> = ({
    track,
    index,
    selectedMatch,
    hasMultipleMatches,
    statusBadge,
    actionButtons,
    formatMatchOption,
    onSelectMatch
}) => (
    <tr className="md:hidden">
        <td colSpan={6} className="p-0">
            <div className={`card bg-base-200 m-2 ${track.matched ? "" : "opacity-50"}`}>
                <div className="card-body p-3">
                    <div className="flex justify-between items-start gap-2 mb-2">
                        <span>{index + 1}</span>
                        <div className="flex gap-2 items-center">
                            {statusBadge}
                            {actionButtons}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="font-medium text-sm">
                            <span>
                                {selectedMatch !== undefined
                                    ? selectedMatch.name
                                    : track.suggestion.title}
                            </span>
                            <span className="text-xs opacity-70">
                                {" - "}
                                {selectedMatch !== undefined
                                    ? (selectedMatch.artists[0]?.name ?? track.suggestion.artist)
                                    : track.suggestion.artist}
                            </span>
                        </div>
                        <div className="text-xs opacity-60">
                            <span>
                                {selectedMatch !== undefined
                                    ? (selectedMatch.album?.name ?? "-")
                                    : (track.suggestion.album ?? "-")}
                            </span>
                            {selectedMatch !== undefined && (
                                <span className="text-xs opacity-50">
                                    {" "}
                                    ({selectedMatch.provider})
                                </span>
                            )}
                        </div>
                    </div>
                    {hasMultipleMatches && track.maMatches !== undefined && (
                        <div className="mt-2">
                            <select
                                className="select select-xs select-bordered w-full"
                                value={track.selectedMatchIndex ?? 0}
                                onChange={onSelectMatch}
                            >
                                {track.maMatches.map((match, idx) => (
                                    <option key={idx} value={idx}>
                                        {formatMatchOption(match, idx)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>
        </td>
    </tr>
);
