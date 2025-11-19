#!/usr/bin/env bash
#
# SYNOPSIS
#     Generate and create an AI playlist in Music Assistant
#
# DESCRIPTION
#     Calls the Music Assistant AI Playlist Creator API to generate a playlist based on a prompt,
#     then optionally creates it in Music Assistant. Supports polling or webhook-based completion.
#
# USAGE
#     ./new-ai-playlist.sh [OPTIONS]
#
# OPTIONS
#     -s, --server URL          Base URL of the AI Playlist Creator server (default: http://localhost:9876)
#     -p, --prompt TEXT         Natural language description of the playlist to generate (required)
#     -c, --count N             Number of tracks to generate (default: 20)
#     -n, --name TEXT           Name for the created playlist (defaults to prompt text)
#     -P, --provider ID         AI provider ID to use (optional)
#     -w, --webhook URL         Webhook URL for async completion notification (optional)
#     -N, --no-create           Generate tracks but don't create the playlist
#     -i, --interval SECONDS    Seconds between status polls (default: 2)
#     -t, --timeout SECONDS     Maximum seconds to wait for completion (default: 300)
#     -h, --help                Show this help message
#
# EXAMPLES
#     ./new-ai-playlist.sh -p "Upbeat 80s rock for a road trip" -c 25
#     ./new-ai-playlist.sh -p "Relaxing jazz for dinner" -n "Evening Jazz" -N
#     ./new-ai-playlist.sh -s "http://192.168.1.100:9876" -p "Workout mix" -P "claude-sonnet"
#

set -euo pipefail

# Defaults
SERVER_URL="http://localhost:9876"
PROMPT=""
TRACK_COUNT=20
PLAYLIST_NAME=""
PROVIDER_PREFERENCE=""
WEBHOOK_URL=""
NO_CREATE=false
POLL_INTERVAL=2
TIMEOUT=300

# Colour codes
GRAY='\033[0;90m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Colour

# Helper functions
timestamp() {
    date '+%H:%M:%S'
}

write_status() {
    local message="$1"
    local colour="${2:-$CYAN}"
    echo -e "${GRAY}[$(timestamp)]${NC} ${colour}${message}${NC}"
}

show_help() {
    sed -n '/^#/!q;s/^# \{0,1\}//p' "$0"
    exit 0
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -s|--server)
            SERVER_URL="$2"
            shift 2
            ;;
        -p|--prompt)
            PROMPT="$2"
            shift 2
            ;;
        -c|--count)
            TRACK_COUNT="$2"
            shift 2
            ;;
        -n|--name)
            PLAYLIST_NAME="$2"
            shift 2
            ;;
        -P|--provider)
            PROVIDER_PREFERENCE="$2"
            shift 2
            ;;
        -w|--webhook)
            WEBHOOK_URL="$2"
            shift 2
            ;;
        -N|--no-create)
            NO_CREATE=true
            shift
            ;;
        -i|--interval)
            POLL_INTERVAL="$2"
            shift 2
            ;;
        -t|--timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            ;;
        *)
            echo "Unknown option: $1" >&2
            echo "Use -h or --help for usage information" >&2
            exit 1
            ;;
    esac
done

# Validate required parameters
if [[ -z "$PROMPT" ]]; then
    echo "Error: Prompt is required (use -p or --prompt)" >&2
    exit 1
fi

# Use prompt as playlist name if not specified
if [[ -z "$PLAYLIST_NAME" ]]; then
    if [[ ${#PROMPT} -gt 50 ]]; then
        PLAYLIST_NAME="${PROMPT:0:47}..."
    else
        PLAYLIST_NAME="$PROMPT"
    fi
fi

# Build generation request JSON in temp file
TEMP_REQUEST=$(mktemp)
trap "rm -f $TEMP_REQUEST" EXIT

cat > "$TEMP_REQUEST" <<EOF
{
    "prompt": "$PROMPT",
    "trackCount": $TRACK_COUNT
EOF

if [[ -n "$PROVIDER_PREFERENCE" ]]; then
    echo ",\"providerPreference\": \"$PROVIDER_PREFERENCE\"" >> "$TEMP_REQUEST"
fi

if [[ -n "$WEBHOOK_URL" ]]; then
    echo ",\"webhookUrl\": \"$WEBHOOK_URL\"" >> "$TEMP_REQUEST"
fi

echo "}" >> "$TEMP_REQUEST"

write_status "Starting playlist generation..." "$GREEN"
write_status "Prompt: $PROMPT"
write_status "Tracks: $TRACK_COUNT"

# Start generation
GENERATE_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d @"$TEMP_REQUEST" \
    "$SERVER_URL/api/playlists/generate")

HTTP_CODE=$(echo "$GENERATE_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$GENERATE_RESPONSE" | head -n-1)

if [[ "$HTTP_CODE" != "200" ]]; then
    write_status "Failed to start generation: HTTP $HTTP_CODE" "$RED"
    echo "$RESPONSE_BODY" >&2
    exit 1
fi

JOB_ID=$(echo "$RESPONSE_BODY" | grep -o '"jobId":"[^"]*"' | cut -d'"' -f4)
if [[ -z "$JOB_ID" ]]; then
    write_status "Failed to extract job ID from response" "$RED"
    exit 1
fi

write_status "Job started: $JOB_ID" "$YELLOW"

# Poll for completion
START_TIME=$(date +%s)
LAST_STATUS=""

while true; do
    CURRENT_TIME=$(date +%s)
    ELAPSED=$((CURRENT_TIME - START_TIME))

    if [[ $ELAPSED -gt $TIMEOUT ]]; then
        write_status "Timeout after $TIMEOUT seconds" "$RED"
        exit 1
    fi

    STATUS_RESPONSE=$(curl -s "$SERVER_URL/api/playlists/jobs/$JOB_ID")
    CURRENT_STATUS=$(echo "$STATUS_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

    if [[ "$CURRENT_STATUS" != "$LAST_STATUS" ]]; then
        case "$CURRENT_STATUS" in
            generating_ai)
                write_status "Generating track suggestions with AI..." "$CYAN"
                ;;
            matching_tracks)
                write_status "Matching tracks in Music Assistant..." "$CYAN"
                ;;
            creating_playlist)
                write_status "Creating playlist..." "$CYAN"
                ;;
            completed)
                write_status "Completed!" "$CYAN"
                ;;
            failed)
                write_status "Failed!" "$RED"
                ;;
            *)
                write_status "$CURRENT_STATUS" "$CYAN"
                ;;
        esac
        LAST_STATUS="$CURRENT_STATUS"
    fi

    if [[ "$CURRENT_STATUS" == "completed" ]]; then
        # Check if webhook created the playlist
        PLAYLIST_URL=$(echo "$STATUS_RESPONSE" | grep -o '"playlistUrl":"[^"]*"' | cut -d'"' -f4 || true)
        if [[ -n "$WEBHOOK_URL" && -n "$PLAYLIST_URL" ]]; then
            write_status "Playlist created: $PLAYLIST_URL" "$GREEN"
            echo "{\"jobId\":\"$JOB_ID\",\"playlistUrl\":\"$PLAYLIST_URL\",\"status\":\"Created\"}"
            exit 0
        fi

        # Get tracks for manual creation
        write_status "Fetching matched tracks..."
        break
    fi

    if [[ "$CURRENT_STATUS" == "failed" ]]; then
        ERROR_MSG=$(echo "$STATUS_RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4 || echo "Unknown error")
        write_status "Generation failed: $ERROR_MSG" "$RED"
        exit 1
    fi

    sleep "$POLL_INTERVAL"
done

# Fetch full job status with tracks
JOB_STATUS=$(curl -s "$SERVER_URL/api/playlists/jobs/$JOB_ID")

# Count matched tracks (rough estimation using grep)
MATCHED_COUNT=$(echo "$JOB_STATUS" | grep -o '"matched":true' | wc -l || echo 0)
TOTAL_COUNT=$(echo "$JOB_STATUS" | grep -o '"matched":' | wc -l || echo 0)

if [[ $MATCHED_COUNT -eq $TOTAL_COUNT ]]; then
    write_status "Matched $MATCHED_COUNT/$TOTAL_COUNT tracks" "$GREEN"
else
    write_status "Matched $MATCHED_COUNT/$TOTAL_COUNT tracks" "$YELLOW"
fi

if [[ "$NO_CREATE" == true ]]; then
    write_status "Generation complete (not creating playlist)" "$GREEN"
    echo "{\"jobId\":\"$JOB_ID\",\"matchedCount\":$MATCHED_COUNT,\"totalCount\":$TOTAL_COUNT,\"status\":\"Generated\"}"
    exit 0
fi

# Create playlist in Music Assistant
write_status "Creating playlist: $PLAYLIST_NAME" "$GREEN"

# Escape JSON strings
ESCAPED_NAME=$(echo "$PLAYLIST_NAME" | sed 's/"/\\"/g')
ESCAPED_PROMPT=$(echo "$PROMPT" | sed 's/"/\\"/g')

# Extract tracks array and build request in temp file
TEMP_CREATE=$(mktemp)
trap "rm -f $TEMP_CREATE" EXIT

echo "{" > "$TEMP_CREATE"
echo "  \"playlistName\": \"$ESCAPED_NAME\"," >> "$TEMP_CREATE"
echo "  \"prompt\": \"$ESCAPED_PROMPT\"," >> "$TEMP_CREATE"
echo "  \"tracks\": " >> "$TEMP_CREATE"
echo "$JOB_STATUS" | grep -o '"tracks":\[.*\]' | cut -d':' -f2- >> "$TEMP_CREATE"
echo "}" >> "$TEMP_CREATE"

CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d @"$TEMP_CREATE" \
    "$SERVER_URL/api/playlists/create")

HTTP_CODE=$(echo "$CREATE_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$CREATE_RESPONSE" | head -n-1)

if [[ "$HTTP_CODE" != "200" ]]; then
    write_status "Failed to create playlist: HTTP $HTTP_CODE" "$RED"
    echo "$RESPONSE_BODY" >&2
    exit 1
fi

TRACKS_ADDED=$(echo "$RESPONSE_BODY" | grep -o '"tracksAdded":[0-9]*' | cut -d':' -f2 || echo 0)
PLAYLIST_URL=$(echo "$RESPONSE_BODY" | grep -o '"playlistUrl":"[^"]*"' | cut -d'"' -f4 || echo "")
PLAYLIST_ID=$(echo "$RESPONSE_BODY" | grep -o '"playlistId":"[^"]*"' | cut -d'"' -f4 || echo "")

write_status "Playlist created successfully!" "$GREEN"
write_status "Added $TRACKS_ADDED tracks" "$CYAN"
write_status "URL: $PLAYLIST_URL" "$CYAN"

echo "{\"jobId\":\"$JOB_ID\",\"playlistName\":\"$PLAYLIST_NAME\",\"playlistId\":\"$PLAYLIST_ID\",\"playlistUrl\":\"$PLAYLIST_URL\",\"tracksAdded\":$TRACKS_ADDED,\"status\":\"Created\"}"
