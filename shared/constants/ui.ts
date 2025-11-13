/**
 * UI text strings and labels
 */

// Track filter options
export const TRACK_FILTERS = {
    ALL: 'all',
    MATCHED: 'matched',
    UNMATCHED: 'unmatched'
} as const;

// UI labels
export const UI_LABELS = {
    // Track status
    FOUND: 'Found',
    NOT_FOUND: 'Not Found',
    MATCHING: 'Matching...',

    // Actions
    REPLACE: 'Replace',
    RETRY: 'Retry',
    REMOVE: 'Remove',
    CLEAR: 'Clear',
    REFINE: 'Refine Playlist',
    CREATE: 'Create Playlist in Music Assistant',
    SAVE: 'Save',
    CANCEL: 'Cancel',
    TEST: 'Test',

    // Status
    CREATING: 'Creating...',
    GENERATING: 'Generating...',
    TESTING: 'Testing...',
    LOADING: 'Loading...',

    // Sections
    GENERATED_TRACKS: 'Generated Tracks',
    SETTINGS: 'Settings',
    HISTORY: 'History',
    PRESETS: 'Presets'
} as const;

// Error messages
export const ERROR_MESSAGES = {
    MA_URL_NOT_CONFIGURED: 'Music Assistant URL not configured',
    NO_AI_PROVIDERS: 'No AI providers configured',
    PROVIDER_NOT_FOUND: 'Selected AI provider not found',
    INVALID_SETTINGS: 'Invalid settings',
    CONNECTION_FAILED: 'Connection failed',
    REQUEST_TIMEOUT: 'Request timeout',
    WS_NOT_INITIALIZED: 'WebSocket not initialized',
    WS_NOT_CONNECTED: 'Not connected to Music Assistant',
    PARSE_FAILED: 'Failed to parse MA message',
    UNKNOWN_ERROR: 'An unknown error occurred'
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
    SETTINGS_SAVED: 'Settings saved successfully',
    PLAYLIST_CREATED: 'Playlist created successfully',
    CONNECTION_OK: 'Connection successful'
} as const;

// Match percentage thresholds
export const MATCH_THRESHOLDS = {
    PERFECT: 100,
    MIN_DISPLAY: 0
} as const;
