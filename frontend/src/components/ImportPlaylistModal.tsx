import React, { useState, useEffect, useCallback } from "react";
import { attemptPromise } from "@jfdi/attempt";
import type { MAPlaylist } from "@shared/types";
import { getMAPlaylists } from "../services/playlistApi";

interface IImportPlaylistModalProps {
    show: boolean;
    onClose: () => void;
    onSelectPlaylist: (playlist: MAPlaylist) => void;
    importing: boolean;
    initialSearchQuery?: string;
}

export const ImportPlaylistModal: React.FC<IImportPlaylistModalProps> = ({
    show,
    onClose,
    onSelectPlaylist,
    importing,
    initialSearchQuery = ""
}) => {
    const [playlists, setPlaylists] = useState<MAPlaylist[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

    const loadPlaylists = useCallback(async (): Promise<void> => {
        setLoading(true);
        setError(null);

        const [err, result] = await attemptPromise(async () => getMAPlaylists());

        setLoading(false);

        if (err !== undefined) {
            setError(err.message);
            return;
        }

        setPlaylists(result);
    }, []);

    useEffect(() => {
        if (show) {
            setSearchQuery(initialSearchQuery);
            void loadPlaylists();
        }
    }, [show, loadPlaylists, initialSearchQuery]);

    if (!show) return null;

    const filteredPlaylists = playlists.filter(
        playlist =>
            playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            playlist.provider.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-2xl">
                <h3 className="font-bold text-lg mb-4">Import Playlist from Music Assistant</h3>

                {error !== null && (
                    <div className="alert alert-error mb-4">
                        <span>{error}</span>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-8">
                        <span className="loading loading-spinner loading-lg"></span>
                    </div>
                ) : (
                    <>
                        <div className="form-control mb-4">
                            <input
                                type="text"
                                placeholder="Search playlists..."
                                className="input input-bordered w-full"
                                value={searchQuery}
                                onChange={e => {
                                    setSearchQuery(e.target.value);
                                }}
                            />
                        </div>

                        {filteredPlaylists.length === 0 ? (
                            <p className="text-center py-8 text-base-content/50">
                                {playlists.length === 0
                                    ? "No playlists found in Music Assistant"
                                    : "No playlists match your search"}
                            </p>
                        ) : (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {filteredPlaylists.map(playlist => (
                                    <div
                                        key={`${playlist.provider}-${playlist.item_id}`}
                                        className={`card bg-base-200 ${importing ? "opacity-50" : "cursor-pointer hover:bg-base-300"}`}
                                        onClick={() => {
                                            if (!importing) {
                                                onSelectPlaylist(playlist);
                                            }
                                        }}
                                    >
                                        <div className="card-body p-4">
                                            <div className="flex justify-between items-center">
                                                <div className="flex-1">
                                                    <p className="font-semibold">{playlist.name}</p>
                                                    {playlist.owner !== undefined &&
                                                        playlist.owner.length > 0 && (
                                                            <p className="text-sm opacity-75">
                                                                by {playlist.owner}
                                                            </p>
                                                        )}
                                                </div>
                                                <div className="badge badge-outline ml-4">
                                                    {playlist.provider}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                <div className="modal-action">
                    {importing && <span className="loading loading-spinner loading-sm mr-2"></span>}
                    <button className="btn" onClick={onClose} disabled={importing}>
                        {importing ? "Importing..." : "Close"}
                    </button>
                </div>
            </div>
        </div>
    );
};
