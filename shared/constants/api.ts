/**
 * API endpoint paths and network configuration
 */

// API Endpoints
export const API_ENDPOINTS = {
    SETTINGS: '/settings',
    PROMPTS_HISTORY: '/prompts/history',
    PROMPTS_PRESETS: '/prompts/presets',
    HEALTH: '/health',
    PLAYLISTS_GENERATE: '/playlists/generate',
    PLAYLISTS_CREATE: '/playlists/create',
    PLAYLISTS_JOB: '/playlists/jobs/:jobId',
    PLAYLISTS_JOB_STREAM: '/playlists/jobs/:jobId/stream'
} as const;

// Base paths
export const API_BASE_PATH = '/api';

// Default URLs
export const DEFAULT_BACKEND_PORT = '3333';

// Payload limits
export const PAYLOAD_LIMIT = '10mb';

// WebSocket paths
export const WS_PATH = '/ws';
