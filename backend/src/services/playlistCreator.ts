import type { TrackMatch } from "../../../shared/types.js";
import { withMusicAssistant } from "../utils/maClientUtils.js";

export const createPlaylist = async (
    playlistName: string,
    tracks: TrackMatch[],
    musicAssistantUrl: string
): Promise<{ playlistId: string; tracksAdded: number; playlistUrl: string }> =>
    withMusicAssistant(musicAssistantUrl, async maClient => {
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

        const playlistUrl = `${musicAssistantUrl}/#/playlists/library/${playlistId}`;

        return { playlistId, tracksAdded: trackUris.length, playlistUrl };
    });
