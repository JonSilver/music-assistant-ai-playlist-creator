# Music Assistant AI Playlist Creator - User Specification

## Overview

The Music Assistant AI Playlist Creator is an AI-powered playlist generation tool that allows users to describe their ideal playlist in natural language and have it automatically created from their existing Music Assistant library. The application uses advanced AI models (Claude or OpenAI) to understand user intent and generate intelligent track suggestions that are then matched against the user's actual music collection.

---

## User Settings & Configuration

### Accessing Settings

Users access all configuration options through the Settings page, available via a gear icon in the application interface.

### Music Assistant Connection

Users must configure their Music Assistant server connection:

- **Music Assistant URL**: The web address where Music Assistant is running (e.g., `http://192.168.1.100:8095` or `http://homeassistant.local:8095`)
- **Connection Testing**: A "Test Connection" button allows users to verify the URL is correct and Music Assistant is reachable before saving

The application requires this connection to:
- Search the user's music library
- Retrieve favorite artists for AI context
- Create the final playlist

### AI Provider Configuration

Users can configure one or multiple AI providers and switch between them when generating playlists. This multi-provider support allows users to:
- Compare different AI models' playlist generation styles
- Use different providers for different playlist types
- Have backup providers if one service is unavailable

#### Adding an AI Provider

For each AI provider, users configure:

**1. Provider Name**
- A friendly name to identify this provider (e.g., "Claude 3.5 Sonnet", "GPT-4 Turbo", "Local Ollama")
- This name appears in a dropdown when creating playlists

**2. Provider Type**
- **Anthropic**: For using Claude models via Anthropic's API
- **OpenAI-compatible**: For using OpenAI's API, or any OpenAI-compatible endpoint (Ollama, local LLMs, alternative providers)

**3. API Key**
- The authentication key for the chosen provider
- Displayed as a password field for security
- Required for cloud providers (Anthropic, OpenAI)
- May be optional for local providers

**4. Model Selection**
- A dropdown menu that loads available models from the provider's API
- Users can select from models like:
  - Anthropic: claude-3-5-sonnet-20241022, claude-3-opus-20240229, etc.
  - OpenAI: gpt-4-turbo, gpt-4, gpt-3.5-turbo, etc.
  - Local/Ollama: Any locally installed models
- Alternatively, users can manually type a model name

**5. Base URL (Optional)**
- For OpenAI-compatible providers, the API endpoint URL
- Commonly used for:
  - Local LLM servers (e.g., `http://localhost:11434/v1` for Ollama)
  - Alternative OpenAI-compatible services
  - Self-hosted models
- Left empty for standard OpenAI API usage

**6. Temperature**
- A creativity control slider ranging from 0 to 2
- **Lower values (0-0.5)**: More consistent, predictable playlists
- **Medium values (0.5-1.0)**: Balanced creativity and consistency (recommended)
- **Higher values (1.0-2.0)**: More creative, diverse, unexpected suggestions
- Default is typically 0.7

**7. Provider Testing**
- "Test Provider" button validates the configuration
- Verifies the API key is valid and the selected model is accessible
- Displays success or error messages

**8. Provider Management**
- **Edit**: Modify existing provider configurations
- **Delete**: Remove providers that are no longer needed
- Providers are saved and persist across sessions

### Playlist Matching Preferences

**Provider Weights (Optional)**

Users can prioritize which music sources to prefer when multiple versions of the same track exist in their library:

- An ordered list of provider keywords (e.g., "spotify", "tidal", "youtube", "local", "apple")
- When a track is available from multiple sources, the app prefers matches in this order
- If not configured, all sources are treated equally
- Common use cases:
  - Prefer higher quality sources (e.g., prioritize "tidal" over "youtube")
  - Prefer streaming services over local files
  - Prefer local files for offline availability

### Advanced AI Configuration

**Custom System Prompt (Optional)**

Advanced users can override the default instructions given to the AI model:

- **Default Behavior**: The app uses a carefully crafted system prompt that instructs the AI on how to generate playlists
- **Custom Override**: Users can write their own system prompt to change AI behavior
- **Preview Option**: A modal allows users to view the current default system prompt before customizing
- **Use Cases**:
  - Focus on specific music eras or genres
  - Emphasize certain playlist characteristics (energy level, popularity, obscurity)
  - Add constraints (e.g., "never include explicit content")
  - Change output format or structure preferences

---

## Creating a Playlist - Complete Workflow

### Step 1: Describing Your Playlist

Users begin by describing their desired playlist in the main interface:

**Playlist Description Field**
- A large text area where users describe their ideal playlist in natural language
- Examples of effective descriptions:
  - "High energy workout music with electronic beats and strong bass"
  - "Relaxing evening jazz for reading, nothing too upbeat"
  - "Road trip classics from the 70s and 80s, mix of rock and pop"
  - "Focus music for deep work - ambient, minimal vocals, steady rhythm"
  - "Party mix with current hits and dance-friendly tracks"

The AI understands:
- **Mood and atmosphere**: energetic, relaxing, melancholic, upbeat, chill
- **Activities**: workout, study, party, dinner, driving, sleeping
- **Genres**: rock, jazz, electronic, classical, hip-hop, indie, etc.
- **Eras**: 70s, 80s, 90s, modern, contemporary
- **Specific attributes**: fast tempo, acoustic, instrumental, vocal-heavy
- **Constraints**: no explicit content, only popular tracks, deeper cuts

**Quick Presets**

Seven pre-configured playlist descriptions are available for common scenarios:

1. **High Energy Workout**: "Create an energizing workout playlist with high-tempo tracks, strong beats, and motivating energy. Mix of electronic, rock, and hip-hop."
2. **Focus & Study**: "Generate a focus playlist for studying or deep work. Instrumental or minimal vocals, steady rhythm, not too energetic. Electronic, ambient, or lo-fi preferred."
3. **Party Mix**: "Create an upbeat party playlist with popular dance tracks and crowd-pleasers. High energy, familiar songs that get people moving."
4. **Evening Relaxation**: "Generate a relaxing evening playlist for unwinding. Mellow, calm tracks with soothing melodies. Jazz, acoustic, ambient, or soft indie."
5. **Road Trip**: "Create a road trip playlist with feel-good tracks perfect for driving. Mix of classic rock, pop, and upbeat indie. Sing-along friendly."
6. **Peppy Classical**: "Generate an uplifting classical music playlist. Focus on bright, energetic pieces that are uplifting and invigorating. No somber or slow movements."
7. **Dinner Party**: "Create a sophisticated dinner party playlist. Jazz, bossa nova, soft soul, elegant and conversational-friendly background music."

Selecting a preset:
- Automatically fills in the description field
- Pre-populates an appropriate playlist name
- Can be edited before generating

**Playlist Name**
- A text field for naming the playlist that will be created
- Defaults to descriptive names like "AI Playlist - [timestamp]"
- Preset selections provide themed names (e.g., "High Energy Workout", "Road Trip Classics")
- Fully customizable before generation

**Number of Tracks**
- A numeric input specifying how many tracks to generate
- Default: 25 tracks
- Range: 1 to 100 tracks
- Larger playlists provide more variety but take longer to generate and match

**AI Provider Selection**
- If multiple AI providers are configured, a dropdown allows selection
- Different providers may generate different playlist styles
- Users can experiment with different models for different results

### Step 2: Generating the Playlist

When the user clicks "Generate Playlist", the following happens:

**Phase 1: Context Gathering**
- The application retrieves the user's favorite artists from Music Assistant
- This information helps the AI understand the user's library and preferences
- A loading indicator shows this background activity

**Phase 2: AI Generation**
- The selected AI model receives:
  - The user's playlist description
  - The requested number of tracks
  - Context about the user's music preferences
  - Instructions on how to format the response
- The AI generates a structured list of specific tracks (title, artist, album)
- A loading indicator shows "Generating playlist with [AI Provider Name]..."

**Phase 3: Library Matching**
- For each AI-suggested track, the app searches the Music Assistant library
- Each track displays real-time status:
  - **Matching...**: Currently searching the library
  - **Found**: Successfully matched to a track in the library
  - **Not Found**: No match found in the library
- Tracks are displayed in a table as they're matched

**Results Display**

Once complete, users see:

**Match Statistics Panel**
- Total tracks generated (e.g., "25 tracks")
- Number of successful matches (e.g., "18 found")
- Number of unmatched tracks (e.g., "7 not found")
- Match percentage (e.g., "72% match rate")
- Visual progress bar showing the match percentage in color-coded format

**Tracks Table**

A detailed table showing each track with:
- **Track Number**: Position in the playlist (1-25, etc.)
- **Title**: Song title
- **Artist**: Performing artist
- **Album**: Album name (if matched)
- **Status Badge**:
  - Green checkmark with "Found" for matched tracks
  - Red X with "Not Found" for unmatched tracks
  - Blue spinner with "Matching..." during searches
- **Provider Info**: For matched tracks, shows which music source (Spotify, Tidal, Local Files, etc.)
- **Actions**: Buttons for track management (detailed below)

**Filtering Options**
- **All Tracks**: Show the entire generated playlist
- **Found Only**: Display only successfully matched tracks
- **Not Found Only**: Show only tracks that need attention

### Step 3: Refining Individual Tracks

For each track, users have several options to improve matches:

**For Unmatched Tracks (Red X)**

1. **Retry Search**
   - Searches Music Assistant again for the same track
   - Useful if the initial search had minor spelling variations
   - Uses the exact AI-suggested title, artist, and album

2. **Replace Track**
   - Asks the AI to suggest alternative tracks
   - Criteria: "Similar artist or mood to [original track]"
   - AI provides 3-5 alternative suggestions
   - Each alternative is automatically searched in the library
   - User sees a dropdown of alternatives with match status
   - User can select any alternative to replace the original
   - If no alternatives match, user can request more suggestions

3. **Remove Track**
   - Deletes the track from the playlist preview
   - Reduces total track count
   - Useful for tracks that aren't essential or can't be found

**For Matched Tracks (Green Checkmark)**

1. **Select Different Match**
   - If a track exists in multiple formats or from multiple providers
   - A dropdown shows all available versions:
     - Provider name (Spotify, Tidal, Local, etc.)
     - Audio quality/format indicators (if available)
     - Album information to distinguish versions
   - User selects their preferred version
   - Respects provider weight preferences by default

2. **Replace Track**
   - Even matched tracks can be replaced if the user wants variety
   - Same process as unmatched track replacement
   - User receives alternative suggestions from the AI

3. **Remove Track**
   - Remove even matched tracks to customize the playlist further

**Interaction Feedback**
- All actions show loading spinners while processing
- Success/error messages confirm action results
- Table updates in real-time as changes are made

### Step 4: Batch Playlist Refinement (Optional)

Instead of refining individual tracks, users can refine the entire playlist:

**Refinement Process**

1. Click the "Refine Playlist" button
2. A modal opens with a text field for refinement instructions
3. User enters modification requests in natural language:
   - "Add more upbeat tracks"
   - "Remove anything slower than 120 BPM"
   - "Include more variety from the 90s"
   - "Replace ballads with more energetic songs"
   - "Make it more suitable for running"
   - "Add some deeper cuts, less mainstream"

4. Click "Refine" to execute

**What Happens During Refinement**
- The AI receives:
  - The original playlist description
  - The current generated playlist
  - The refinement instructions
- The AI generates a completely new playlist based on all three inputs
- The new playlist is automatically matched against the library
- The previous playlist is replaced entirely

**Use Cases for Refinement**
- Match rate is lower than desired
- Playlist doesn't quite capture the intended mood
- User wants to adjust energy level or tempo
- User wants more/less variety
- User wants to emphasize different aspects of the original description

**Iterative Refinement**
- Users can refine multiple times
- Each refinement builds on the previous result
- Previous playlists are not saved (refinement is destructive)

### Step 5: Creating the Final Playlist

Once the user is satisfied with the matched tracks:

**Create Playlist Button**
- Located prominently at the bottom of the interface
- Only enabled when at least one track is successfully matched
- Displays "Create Playlist in Music Assistant"

**Creation Process**
1. User clicks "Create Playlist"
2. Loading indicator shows "Creating playlist..."
3. Application sends matched tracks to Music Assistant
4. Music Assistant creates a new playlist with the specified name
5. All matched tracks are added to the playlist in order

**Success Confirmation**
- Success message displays: "Playlist '[Name]' created successfully!"
- A direct link to the playlist in Music Assistant appears
- Clicking the link opens the playlist in Music Assistant for immediate playback
- The playlist is now available in Music Assistant like any other playlist

**Important Notes**
- Only successfully matched tracks are included in the created playlist
- Track order is preserved as shown in the table
- Unmatched tracks are excluded from the final playlist
- Users are reminded of the match rate before creation

---

## Prompt History & Management

### Automatic History Tracking

Every time a user generates a playlist, the following information is automatically saved:
- Playlist description (the prompt text)
- Playlist name
- Number of tracks requested
- Timestamp of generation
- AI provider used

### Accessing History

**History Modal**
- Accessible via a "History" button in the main interface
- Opens a modal displaying all past playlist generation attempts
- Sorted by most recent first

**History Display**
Each history entry shows:
- The prompt text in full
- Playlist name used
- Track count
- Generation timestamp (human-readable, e.g., "2 hours ago", "Yesterday at 3:45 PM")
- AI provider that was used

**Using History**
- **Click any history entry**: The prompt, name, and track count are loaded into the main form
- **Modify before regenerating**: Users can edit the loaded prompt before generating
- **Quick regeneration**: Instantly recreate similar playlists from past successes
- **Learn from past prompts**: Review which descriptions worked well

### Prompt Autocomplete

As users type in the playlist description field:
- Previously used prompts appear as autocomplete suggestions
- Suggestions are filtered by what the user is currently typing
- Clicking a suggestion fills in the complete prompt text

---

## Additional User Features

### Connection Reliability

**Real-Time Status Indicators**
- Music Assistant connection status is visible in settings
- AI provider connection status is displayed for each configured provider
- Warning messages appear if connections are lost

**Error Handling**
- Clear error messages when Music Assistant is unreachable
- Informative messages when AI providers return errors
- Suggestions for resolving common issues (check URL, verify API key, etc.)

**Graceful Degradation**
- If one AI provider fails, users can switch to another without losing work
- Partial playlist matches are preserved even if matching is interrupted
- Settings are validated before allowing playlist generation

### Progress Feedback

Throughout the application, users receive clear feedback:
- **Loading spinners**: During AI generation, library searches, playlist creation
- **Progress bars**: Visual representation of match rates
- **Status badges**: Color-coded indicators for track status
- **Toast notifications**: Success and error messages that appear temporarily
- **Modal dialogs**: For important confirmations and multi-step operations

### Data Persistence

All user data is saved locally:
- AI provider configurations persist across sessions
- Music Assistant URL is remembered
- Prompt history is stored indefinitely
- Quick presets are always available
- Provider preferences are saved

Users never lose:
- Configured AI providers
- Music Assistant connection details
- Prompt history
- Custom system prompts
- Provider weight preferences

---

## Complete User Journey Example

**Scenario**: User wants to create a workout playlist

1. **First-Time Setup** (only needed once)
   - Opens Settings
   - Enters Music Assistant URL: `http://homeassistant.local:8095`
   - Tests connection ✓
   - Adds Anthropic provider:
     - Name: "Claude for Playlists"
     - Type: Anthropic
     - API Key: [their key]
     - Model: claude-3-5-sonnet-20241022
     - Temperature: 0.8
   - Tests provider ✓
   - Saves settings

2. **Creating the Playlist**
   - Returns to main page
   - Clicks "High Energy Workout" preset
   - Reviews the auto-filled description
   - Edits to add: "and include some rock music"
   - Changes track count to 30
   - Renames playlist to "Morning Gym Mix"
   - Selects "Claude for Playlists" from dropdown
   - Clicks "Generate Playlist"

3. **Review Results**
   - Sees 30 tracks generated
   - Match statistics show: "24 of 30 found (80%)"
   - Reviews the tracks table
   - Filters to "Not Found Only" to see the 6 unmatched tracks

4. **Refining Tracks**
   - For track #5 (not found): Clicks "Replace"
   - Reviews 4 AI-suggested alternatives
   - Selects one that's marked "Found"
   - For track #12 (not found): Clicks "Remove" (not essential)
   - For track #18 (not found): Clicks "Retry"
   - Still not found, so clicks "Replace" and selects a match
   - For tracks #22, #27, #30 (not found): Removes all three
   - Now has 27 tracks, all matched

5. **Final Adjustments**
   - Switches to "All Tracks" view
   - Reviews the complete playlist
   - Notices track #8 has multiple versions
   - Selects the Spotify version (higher quality)
   - Decides the playlist feels right

6. **Creating & Accessing**
   - Clicks "Create Playlist in Music Assistant"
   - Sees success message
   - Clicks the link to "Morning Gym Mix" in Music Assistant
   - Playlist opens in Music Assistant
   - Starts workout with their perfectly customized playlist

7. **Future Use**
   - Later that week, wants a similar playlist
   - Opens app, clicks "History"
   - Finds "Morning Gym Mix" entry from 3 days ago
   - Clicks it to load the prompt
   - Modifies: adds "with more electronic music"
   - Generates a fresh variation
   - Creates "Evening Gym Mix"

---

## Key User Benefits

### Intelligent Music Discovery
- Discover tracks in your library you'd forgotten about
- AI understands complex, nuanced music descriptions
- Get playlists that actually match your mood and activity
- No manual searching through thousands of tracks

### Flexibility & Control
- Start with AI suggestions, refine to perfection
- Multiple AI providers for different generation styles
- Iterative refinement until the playlist is exactly right
- Keep what works, replace what doesn't

### Library-Aware Generation
- Unlike standalone AI music generators, only suggests tracks you own
- No frustration from recommendations you can't access
- Respects your music provider preferences
- Works entirely within your existing Music Assistant ecosystem

### Time Savings
- Generate 25-100 track playlists in seconds
- No manual track-by-track selection needed
- Quick presets for common scenarios
- Reuse past prompts for similar needs

### Privacy & Control
- All processing respects your Music Assistant privacy settings
- Choose between cloud AI (Anthropic/OpenAI) or local models (Ollama)
- No music listening data sent to third parties
- Full control over AI provider selection and configuration

### Seamless Integration
- Created playlists appear natively in Music Assistant
- One-click access to playlists after creation
- Works with all Music Assistant-supported providers (Spotify, Tidal, YouTube, local files, etc.)
- No separate app or service required

---

## Summary

The Music Assistant AI Playlist Creator transforms natural language descriptions into perfectly curated playlists from the user's existing music library. Through an intuitive web interface, users describe their ideal playlist, let AI generate intelligent suggestions, refine matches as needed, and create ready-to-play playlists in Music Assistant—all without leaving their browser. The application combines the creativity and understanding of advanced AI models with the reliability and privacy of local music library management, offering a powerful yet user-friendly solution for music discovery and playlist curation.
