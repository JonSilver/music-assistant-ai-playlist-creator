/**
 * Music Assistant API commands and configuration
 */

// Music Assistant WebSocket commands
export const MA_COMMANDS = {
    SEARCH: 'music/search',
    FAVORITES: 'music/favorites',
    LIBRARY_ITEMS: 'music/library_items',
    CREATE_PLAYLIST: 'music/playlists/create_playlist',
    ADD_PLAYLIST_TRACKS: 'music/playlists/add_playlist_tracks'
} as const;

// Media types
export const MEDIA_TYPES = {
    TRACK: 'track',
    ARTIST: 'artist',
    ALBUM: 'album',
    PLAYLIST: 'playlist'
} as const;

// WebSocket message prefix
export const WS_MESSAGE_PREFIX = 'msg_';
