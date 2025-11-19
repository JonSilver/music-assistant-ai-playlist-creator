#!/usr/bin/env bash
#
# SYNOPSIS
#     Test script for AI Playlist Creator
#
# DESCRIPTION
#     Generates a test playlist using the new-ai-playlist.sh script to verify the API is working
#
# USAGE
#     ./test-ai-playlist.sh [OPTIONS]
#
# OPTIONS
#     -s, --server URL    Base URL of the AI Playlist Creator server (default: http://localhost:3333)
#     -N, --no-create     Generate tracks but don't create the playlist in Music Assistant
#     -h, --help          Show this help message
#
# EXAMPLES
#     ./test-ai-playlist.sh
#     ./test-ai-playlist.sh -s "http://192.168.1.100:9876" -N
#

set -euo pipefail

# Defaults
SERVER_URL="http://localhost:3333"
NO_CREATE=false

# Colour codes
GRAY='\033[0;90m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Colour

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
        -N|--no-create)
            NO_CREATE=true
            shift
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

echo -e "${CYAN}======================================${NC}"
echo -e "${CYAN}AI Playlist Creator - Test Script${NC}"
echo -e "${CYAN}======================================${NC}"
echo ""

# Test parameters
TEST_PROMPT="Classic rock anthems from the 70s and 80s"
TEST_TRACK_COUNT=10
TEST_PLAYLIST_NAME="Test Playlist - $(date '+%Y-%m-%d %H:%M')"

echo -e "${YELLOW}Test Parameters:${NC}"
echo -e "${GRAY}  Server: $SERVER_URL${NC}"
echo -e "${GRAY}  Prompt: $TEST_PROMPT${NC}"
echo -e "${GRAY}  Tracks: $TEST_TRACK_COUNT${NC}"
echo -e "${GRAY}  Create: $([[ "$NO_CREATE" == false ]] && echo "true" || echo "false")${NC}"
echo ""

# Check if new-ai-playlist.sh exists
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_PATH="$SCRIPT_DIR/new-ai-playlist.sh"

if [[ ! -f "$SCRIPT_PATH" ]]; then
    echo -e "${RED}Error: new-ai-playlist.sh not found at: $SCRIPT_PATH${NC}" >&2
    exit 1
fi

if [[ ! -x "$SCRIPT_PATH" ]]; then
    chmod +x "$SCRIPT_PATH"
fi

# Test server connectivity
echo -e "${CYAN}Testing server connectivity...${NC}"
if curl -s -f "$SERVER_URL/api/settings" > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ Server is reachable${NC}"
else
    echo -e "${RED}  ✗ Server is not reachable${NC}" >&2
    exit 1
fi

echo ""

# Build arguments for new-ai-playlist.sh
ARGS=(
    -s "$SERVER_URL"
    -p "$TEST_PROMPT"
    -c "$TEST_TRACK_COUNT"
    -n "$TEST_PLAYLIST_NAME"
)

if [[ "$NO_CREATE" == true ]]; then
    ARGS+=(-N)
fi

# Run the playlist generation
if "$SCRIPT_PATH" "${ARGS[@]}"; then
    echo ""
    echo -e "${CYAN}======================================${NC}"
    echo -e "${GREEN}Test Result: SUCCESS${NC}"
    echo -e "${CYAN}======================================${NC}"
    echo ""
    exit 0
else
    echo ""
    echo -e "${CYAN}======================================${NC}"
    echo -e "${RED}Test Result: FAILED${NC}"
    echo -e "${CYAN}======================================${NC}"
    echo ""
    exit 1
fi
