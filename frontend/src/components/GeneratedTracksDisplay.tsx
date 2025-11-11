import React from 'react';
import type { TrackMatch } from '../../../shared/types';

interface GeneratedTracksDisplayProps {
    tracks: TrackMatch[];
    creating: boolean;
    replacingTrackIndex: number | null;
    retryingTrackIndex: number | null;
    trackFilter: 'all' | 'matched' | 'unmatched';
    onTrackFilterChange: (filter: 'all' | 'matched' | 'unmatched') => void;
    onReplaceTrack: (index: number) => void;
    onRetryTrack: (index: number) => void;
    onRemoveTrack: (index: number) => void;
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
        if (trackFilter === 'matched') return track.matched;
        if (trackFilter === 'unmatched') return !track.matched;
        return true;
    });

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="card-title mb-2">Generated Tracks</h2>
                        <div className="text-sm space-y-1">
                            <p>
                                <span className="font-semibold">{matchedCount}</span> of{' '}
                                <span className="font-semibold">{totalCount}</span> tracks found in
                                your library
                                {matchPercentage > 0 && (
                                    <span className="ml-2 badge badge-sm badge-info">
                                        {matchPercentage}%
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="btn-group">
                        <button
                            className={`btn btn-sm ${trackFilter === 'all' ? 'btn-active' : ''}`}
                            onClick={() => {
                                onTrackFilterChange('all');
                            }}
                        >
                            All ({totalCount})
                        </button>
                        <button
                            className={`btn btn-sm ${trackFilter === 'matched' ? 'btn-active' : ''}`}
                            onClick={() => {
                                onTrackFilterChange('matched');
                            }}
                        >
                            Found ({matchedCount})
                        </button>
                        <button
                            className={`btn btn-sm ${trackFilter === 'unmatched' ? 'btn-active' : ''}`}
                            onClick={() => {
                                onTrackFilterChange('unmatched');
                            }}
                        >
                            Not Found ({totalCount - matchedCount})
                        </button>
                    </div>
                </div>

                {matchPercentage < 100 && matchPercentage > 0 && (
                    <div className="mb-4">
                        <div className="flex justify-between text-xs mb-1">
                            <span>Match Rate</span>
                            <span>{matchPercentage}%</span>
                        </div>
                        <progress
                            className="progress progress-success w-full"
                            value={matchPercentage}
                            max="100"
                        ></progress>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th className="w-12">#</th>
                                <th>Title</th>
                                <th>Artist</th>
                                <th>Album</th>
                                <th>Status</th>
                                <th>Actions</th>
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
                                        <tr
                                            key={actualIndex}
                                            className={track.matched ? '' : 'opacity-50'}
                                        >
                                            <td className="text-center opacity-60 font-mono text-sm">
                                                {actualIndex + 1}
                                            </td>
                                            <td>
                                                <div className="font-medium">
                                                    {track.suggestion.title}
                                                </div>
                                                {track.maTrack !== undefined && (
                                                    <div className="text-xs opacity-60">
                                                        {track.maTrack.provider}
                                                    </div>
                                                )}
                                            </td>
                                            <td>{track.suggestion.artist}</td>
                                            <td>{track.suggestion.album ?? '-'}</td>
                                            <td>
                                                {track.matching === true ? (
                                                    <span className="badge badge-warning gap-1">
                                                        <span className="loading loading-spinner loading-xs"></span>
                                                        Searching...
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
                                                        Found
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
                                                        Not Found
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="flex gap-1">
                                                    {!track.matched && !track.matching && (
                                                        <button
                                                            className="btn btn-ghost btn-xs"
                                                            onClick={() => {
                                                                onRetryTrack(actualIndex);
                                                            }}
                                                            disabled={
                                                                retryingTrackIndex === actualIndex
                                                            }
                                                        >
                                                            {retryingTrackIndex === actualIndex ? (
                                                                <>
                                                                    <span className="loading loading-spinner loading-xs"></span>
                                                                    Retrying...
                                                                </>
                                                            ) : (
                                                                'Retry'
                                                            )}
                                                        </button>
                                                    )}
                                                    <button
                                                        className="btn btn-ghost btn-xs"
                                                        onClick={() => {
                                                            onReplaceTrack(actualIndex);
                                                        }}
                                                        disabled={
                                                            replacingTrackIndex === actualIndex
                                                        }
                                                    >
                                                        {replacingTrackIndex === actualIndex ? (
                                                            <>
                                                                <span className="loading loading-spinner loading-xs"></span>
                                                                Replacing...
                                                            </>
                                                        ) : (
                                                            'Replace'
                                                        )}
                                                    </button>
                                                    <button
                                                        className="btn btn-ghost btn-xs"
                                                        onClick={() => {
                                                            onRemoveTrack(actualIndex);
                                                        }}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="card-actions justify-end mt-4">
                    <button className="btn btn-outline" onClick={onClear}>
                        Clear
                    </button>
                    <button className="btn btn-secondary" onClick={onRefine}>
                        Refine Playlist
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={onCreate}
                        disabled={creating || !hasMatchedTracks || isMatching}
                    >
                        {creating && <span className="loading loading-spinner"></span>}
                        {creating ? 'Creating...' : 'Create Playlist in Music Assistant'}
                    </button>
                </div>
            </div>
        </div>
    );
};
