/**
 * Timeout values in milliseconds
 */

export const TIMEOUTS = {
    /** WebSocket command timeout */
    WS_COMMAND: 10000,
    /** AI API request timeout */
    AI_REQUEST: 30000,
    /** Short timeout for quick operations */
    SHORT: 1000,
    /** Animation/UI debounce */
    DEBOUNCE: 100
} as const;
