import React from "react";
import type { TrackMatch, MATrack } from "@shared/types";
import { UI_LABELS } from "@shared/constants";
import { RetryIcon } from "./icons/RetryIcon";
import { ReplaceIcon } from "./icons/ReplaceIcon";
import { TrashIcon } from "./icons/TrashIcon";
import { ExternalLinkIcon } from "./icons/ExternalLinkIcon";
import { CheckIcon } from "./icons/CheckIcon";
import { CrossIcon } from "./icons/CrossIcon";
import { TrackRowMobile } from "./TrackRowMobile";

interface ITrackRowProps {
    track: TrackMatch;
    index: number;
    replacingTrackIndex: number | null;
    retryingTrackIndex: number | null;
    musicAssistantUrl: string;
    onReplaceTrack: (index: number) => void;
    onRetryTrack: (index: number) => void;
    onRemoveTrack: (index: number) => void;
    onSelectMatch: (trackIndex: number, matchIndex: number) => void;
}

export const TrackRow: React.FC<ITrackRowProps> = ({
    track,
    index,
    replacingTrackIndex,
    retryingTrackIndex,
    musicAssistantUrl,
    onReplaceTrack,
    onRetryTrack,
    onRemoveTrack,
    onSelectMatch
}) => {
    const hasMultipleMatches = track.maMatches !== undefined && track.maMatches.length > 1;
    const selectedMatch =
        hasMultipleMatches && track.maMatches !== undefined
            ? track.maMatches[track.selectedMatchIndex ?? 0]
            : track.maTrack;

    const handleMatchSelection = (e: React.ChangeEvent<HTMLSelectElement>): void => {
        const matchIndex = parseInt(e.target.value, 10);
        onSelectMatch(index, matchIndex);
    };

    const formatMatchOption = (match: MATrack, idx: number): string => {
        const artist = match.artists[0]?.name ?? "Unknown Artist";
        const album = match.album?.name;
        const provider = match.provider;
        return `${idx + 1}. ${match.name} - ${artist}${album !== undefined ? ` (${album})` : ""} [${provider}]`;
    };

    const getTrackUrl = (match: MATrack | undefined): string =>
        match !== undefined
            ? `${musicAssistantUrl}/#/tracks/${match.provider}/${match.item_id}`
            : "#";

    const statusBadge =
        track.matching === true ? (
            <span className="badge badge-warning gap-1">
                <span className="loading loading-spinner loading-xs"></span>
                {UI_LABELS.MATCHING}
            </span>
        ) : track.matched ? (
            <span className="badge badge-success gap-1">
                <CheckIcon />
                {UI_LABELS.FOUND}
                {hasMultipleMatches && track.maMatches !== undefined && (
                    <span className="ml-1">({track.maMatches.length})</span>
                )}
            </span>
        ) : (
            <span className="badge badge-error gap-1">
                <CrossIcon />
                {UI_LABELS.NOT_FOUND}
            </span>
        );

    const actionButtons = (
        <div className="flex gap-1">
            {track.matched && selectedMatch !== undefined && (
                <a
                    href={getTrackUrl(selectedMatch)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost btn-xs btn-square"
                    title="View in Music Assistant"
                >
                    <ExternalLinkIcon />
                </a>
            )}
            {!track.matched && track.matching !== true && (
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
                        <RetryIcon />
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
                    <ReplaceIcon />
                )}
            </button>
            <button
                className="btn btn-ghost btn-xs btn-square"
                onClick={() => {
                    onRemoveTrack(index);
                }}
                title={UI_LABELS.REMOVE}
            >
                <TrashIcon />
            </button>
        </div>
    );

    return (
        <>
            {/* Desktop table row */}
            <tr className={`hidden md:table-row ${track.matched ? "" : "opacity-50"}`}>
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
                        ? (selectedMatch.artists[0]?.name ?? track.suggestion.artist)
                        : track.suggestion.artist}
                </td>
                <td>
                    {selectedMatch !== undefined
                        ? (selectedMatch.album?.name ?? "-")
                        : (track.suggestion.album ?? "-")}
                </td>
                <td>{statusBadge}</td>
                <td>{actionButtons}</td>
            </tr>

            <TrackRowMobile
                track={track}
                index={index}
                selectedMatch={selectedMatch}
                hasMultipleMatches={hasMultipleMatches}
                statusBadge={statusBadge}
                actionButtons={actionButtons}
                formatMatchOption={formatMatchOption}
                onSelectMatch={handleMatchSelection}
            />
        </>
    );
};
