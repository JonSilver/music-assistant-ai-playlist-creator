import React from "react";
import type { TrackMatch, MATrack } from "@shared/types";
import { UI_LABELS } from "@shared/constants";

interface TrackRowProps {
    track: TrackMatch;
    index: number;
    replacingTrackIndex: number | null;
    retryingTrackIndex: number | null;
    onReplaceTrack: (index: number) => void;
    onRetryTrack: (index: number) => void;
    onRemoveTrack: (index: number) => void;
    onSelectMatch: (trackIndex: number, matchIndex: number) => void;
}

export const TrackRow = ({
    track,
    index,
    replacingTrackIndex,
    retryingTrackIndex,
    onReplaceTrack,
    onRetryTrack,
    onRemoveTrack,
    onSelectMatch
}: TrackRowProps): React.JSX.Element => {
    const hasMultipleMatches =
        track.maMatches !== undefined && track.maMatches.length > 1;
    const selectedMatch = hasMultipleMatches && track.maMatches !== undefined
        ? track.maMatches[track.selectedMatchIndex ?? 0]
        : track.maTrack;

    const handleMatchSelection = (e: React.ChangeEvent<HTMLSelectElement>): void => {
        const matchIndex = parseInt(e.target.value, 10);
        onSelectMatch(index, matchIndex);
    };

    const formatMatchOption = (match: MATrack, idx: number): string => {
        const artist = match.artists?.[0]?.name ?? "Unknown Artist";
        const album = match.album?.name;
        const provider = match.provider;
        return `${idx + 1}. ${match.name} - ${artist}${album !== undefined ? ` (${album})` : ""} [${provider}]`;
    };

    return (
        <tr className={track.matched ? "" : "opacity-50"}>
            <td className="text-center opacity-60 font-mono text-sm">{index + 1}</td>
            <td>
                <div className="font-medium">
                    {selectedMatch !== undefined ? selectedMatch.name : track.suggestion.title}
                </div>
                {hasMultipleMatches && track.maMatches !== undefined && (
                    <div className="mt-2">
                        <select
                            className="select select-xs select-bordered w-full max-w-xs"
                            value={track.selectedMatchIndex ?? 0}
                            onChange={handleMatchSelection}
                        >
                            {track.maMatches.map((match, idx) => (
                                <option key={idx} value={idx}>
                                    {formatMatchOption(match, idx)}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                {selectedMatch !== undefined && (
                    <div className="text-xs opacity-60 mt-1">{selectedMatch.provider}</div>
                )}
            </td>
            <td>
                {selectedMatch !== undefined
                    ? selectedMatch.artists?.[0]?.name ?? track.suggestion.artist
                    : track.suggestion.artist}
            </td>
            <td>
                {selectedMatch !== undefined
                    ? selectedMatch.album?.name ?? "-"
                    : track.suggestion.album ?? "-"}
            </td>
            <td>
                {track.matching === true ? (
                    <span className="badge badge-warning gap-1">
                        <span className="loading loading-spinner loading-xs"></span>
                        {UI_LABELS.MATCHING}
                    </span>
                ) : track.matched ? (
                    <span className="badge badge-success gap-1">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            className="inline-block w-4 h-4 stroke-current"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 13l4 4L19 7"
                            ></path>
                        </svg>
                        {UI_LABELS.FOUND}
                        {hasMultipleMatches && track.maMatches !== undefined && (
                            <span className="ml-1">({track.maMatches.length})</span>
                        )}
                    </span>
                ) : (
                    <span className="badge badge-error gap-1">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            className="inline-block w-4 h-4 stroke-current"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                            ></path>
                        </svg>
                        {UI_LABELS.NOT_FOUND}
                    </span>
                )}
            </td>
            <td>
                <div className="flex gap-1">
                    {!track.matched && !track.matching && (
                        <button
                            className="btn btn-ghost btn-xs btn-square"
                            onClick={() => {
                                onRetryTrack(index);
                            }}
                            disabled={retryingTrackIndex === index}
                            title={UI_LABELS.RETRY}
                        >
                            {retryingTrackIndex === index ? (
                                <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    className="w-4 h-4 stroke-current"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                </svg>
                            )}
                        </button>
                    )}
                    <button
                        className="btn btn-ghost btn-xs btn-square"
                        onClick={() => {
                            onReplaceTrack(index);
                        }}
                        disabled={replacingTrackIndex === index}
                        title={UI_LABELS.REPLACE}
                    >
                        {replacingTrackIndex === index ? (
                            <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                className="w-4 h-4 stroke-current"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                />
                            </svg>
                        )}
                    </button>
                    <button
                        className="btn btn-ghost btn-xs btn-square"
                        onClick={() => {
                            onRemoveTrack(index);
                        }}
                        title={UI_LABELS.REMOVE}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            className="w-4 h-4 stroke-current"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    );
};
