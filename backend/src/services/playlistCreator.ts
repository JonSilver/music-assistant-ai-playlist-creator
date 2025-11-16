import { MusicAssistantClient } from "./musicAssistant.js";
import type { TrackMatch } from "../../../shared/types.js";

export const createPlaylist = async (
    playlistName: string,
    tracks: TrackMatch[],
    musicAssistantUrl: string
): Promise<{ playlistId: string; tracksAdded: number; playlistUrl: string }> => {
    const maClient = new MusicAssistantClient(musicAssistantUrl);
    await maClient.connect();

    const playlistId = await maClient.createPlaylist(playlistName.trim());

    const trackUris = tracks
        .filter(m => m.matched && m.maTrack !== undefined)
        .map(m => {
            if (m.maTrack === undefined) {
                throw new Error("Unexpected undefined maTrack");
            }
            return m.maTrack.uri;
        });

    if (trackUris.length > 0) {
        await maClient.addTracksToPlaylist(playlistId, trackUris);
    }

    maClient.disconnect();

    const playlistUrl = `${musicAssistantUrl}/#/playlists/library/${playlistId}`;

    return { playlistId, tracksAdded: trackUris.length, playlistUrl };
};
