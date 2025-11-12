/**
 * API endpoint paths and network configuration
 */

// API Endpoints
export const API_ENDPOINTS = {
    SETTINGS: '/settings',
    PROMPTS_HISTORY: '/prompts/history',
    PROMPTS_PRESETS: '/prompts/presets',
    PLAYLIST_GENERATE: '/playlist/generate',
    PLAYLIST_CREATE: '/playlist/create',
    PLAYLIST_REFINE: '/playlist/refine',
    HEALTH: '/health'
} as const;

// Base paths
export const API_BASE_PATH = '/api';

// Port numbers
export const PORTS = {
    FRONTEND_DEV: 5555,
    BACKEND_DEV: 3333,
    MUSIC_ASSISTANT_DEFAULT: 8095
} as const;

// Default URLs
export const DEFAULT_BACKEND_PORT = '3333';

// Payload limits
export const PAYLOAD_LIMIT = '10mb';

// WebSocket paths
export const WS_PATH = '/ws';
