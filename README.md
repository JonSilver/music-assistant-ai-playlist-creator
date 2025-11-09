# Music Assistant AI Playlist Creator

An AI-powered web application for creating intelligent playlists in Music Assistant. Describe your ideal playlist in natural language, and let AI select the perfect tracks from your library.

## Features

- **AI-Powered Suggestions**: Uses Claude or OpenAI to generate playlist suggestions based on natural language descriptions
- **Smart Library Matching**: Matches AI suggestions to your Music Assistant library using search
- **Iterative Refinement**: Refine generated playlists with additional instructions
- **Enhanced Visualization**: Match statistics, progress bars, and track filters
- **Connection Testing**: Test Music Assistant and AI API connections before saving settings
- **Customizable AI**: Adjust temperature and custom system prompts
- **Prompt History**: Track previously used prompts
- **Preset Prompts**: Quick access to common playlist types

## Prerequisites

- Docker and docker-compose
- Music Assistant server running on your local network
- Claude API key or OpenAI API key

## Installation

1. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

2. (Optional) Edit `.env` to customize:
   ```bash
   DATA_PATH=./data     # Where to store the database
   APP_PORT=9876        # Port to access the web UI
   ```

3. Start the container:
   ```bash
   docker-compose up -d
   ```

4. Open http://localhost:9876 in your browser

5. Go to Settings and configure:
   - Music Assistant URL (e.g., `http://192.168.1.100:8095`)
   - AI Provider (Claude or OpenAI)
   - API Key
   - Test the connections to verify

## Usage

1. Enter a playlist description (e.g., "Upbeat 80s rock for a road trip")
2. Click "Generate Playlist"
3. Review the AI-suggested tracks
4. Use filters to view All/Found/Not Found tracks
5. Remove unwanted tracks or click "Refine Playlist" for adjustments
6. Click "Create Playlist in Music Assistant"

## Data Storage

The SQLite database is stored in the directory specified by `DATA_PATH` (defaults to `./data`). This contains:
- Application settings
- Prompt history
- Preset prompts

To use a different location, edit `DATA_PATH` in your `.env` file.

## Updating

```bash
docker-compose down
docker-compose pull
docker-compose up -d
```

## Development

For local development without Docker:

```bash
npm install
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:3001

See `claude.md` for technical documentation.

## License

ISC

## Acknowledgments

- [Music Assistant](https://music-assistant.io)
- [daisyUI](https://daisyui.com)
- [Anthropic Claude](https://anthropic.com)
- [OpenAI](https://openai.com)
- [@jfdi/attempt](https://github.com/jfdi-dev/iffyjs)
