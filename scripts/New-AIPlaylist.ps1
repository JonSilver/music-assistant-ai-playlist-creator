<#
.SYNOPSIS
    Generate and create an AI playlist in Music Assistant

.DESCRIPTION
    Calls the Music Assistant AI Playlist Creator API to generate a playlist based on a prompt,
    then optionally creates it in Music Assistant. Supports polling or webhook-based completion.

.PARAMETER ServerUrl
    The base URL of the AI Playlist Creator server (default: http://localhost:9876)

.PARAMETER Prompt
    The natural language description of the playlist to generate

.PARAMETER TrackCount
    Number of tracks to generate (default: 20)

.PARAMETER PlaylistName
    Name for the created playlist (defaults to prompt text)

.PARAMETER ProviderPreference
    AI provider ID to use (optional, uses default if not specified)

.PARAMETER WebhookUrl
    Webhook URL for async completion notification (optional)

.PARAMETER NoCreate
    Generate tracks but don't create the playlist in Music Assistant

.PARAMETER PollInterval
    Seconds between status polls when waiting for completion (default: 2)

.PARAMETER Timeout
    Maximum seconds to wait for completion (default: 300)

.EXAMPLE
    .\New-AIPlaylist.ps1 -Prompt "Upbeat 80s rock for a road trip" -TrackCount 25

.EXAMPLE
    .\New-AIPlaylist.ps1 -Prompt "Relaxing jazz for dinner" -PlaylistName "Evening Jazz" -NoCreate

.EXAMPLE
    .\New-AIPlaylist.ps1 -ServerUrl "http://192.168.1.100:9876" -Prompt "Workout mix" -ProviderPreference "claude-sonnet"
#>

[CmdletBinding()]
param(
    [Parameter()]
    [string]$ServerUrl = "http://localhost:9876",

    [Parameter(Mandatory = $true)]
    [string]$Prompt,

    [Parameter()]
    [int]$TrackCount = 20,

    [Parameter()]
    [string]$PlaylistName = "",

    [Parameter()]
    [string]$ProviderPreference = "",

    [Parameter()]
    [string]$WebhookUrl = "",

    [Parameter()]
    [switch]$NoCreate,

    [Parameter()]
    [int]$PollInterval = 2,

    [Parameter()]
    [int]$Timeout = 300
)

$ErrorActionPreference = "Stop"

# Use prompt as playlist name if not specified
if ([string]::IsNullOrEmpty($PlaylistName)) {
    $PlaylistName = if ($Prompt.Length -gt 50) {
        $Prompt.Substring(0, 47) + "..."
    } else {
        $Prompt
    }
}

function Write-Status {
    param([string]$Message, [string]$Color = "Cyan")
    Write-Host "[$([DateTime]::Now.ToString('HH:mm:ss'))] " -NoNewline -ForegroundColor Gray
    Write-Host $Message -ForegroundColor $Color
}

function Write-ProgressBar {
    param([int]$Current, [int]$Total, [string]$Status)
    $percent = [Math]::Round(($Current / $Total) * 100)
    Write-Progress -Activity "Generating Playlist" -Status $Status -PercentComplete $percent
}

# Build generation request
$generateRequest = @{
    prompt = $Prompt
    trackCount = $TrackCount
}

if (![string]::IsNullOrEmpty($ProviderPreference)) {
    $generateRequest.providerPreference = $ProviderPreference
}

if (![string]::IsNullOrEmpty($WebhookUrl)) {
    $generateRequest.webhookUrl = $WebhookUrl
}

Write-Status "Starting playlist generation..." "Green"
Write-Status "Prompt: $Prompt"
Write-Status "Tracks: $TrackCount"

# Start generation
try {
    $generateResponse = Invoke-RestMethod `
        -Uri "$ServerUrl/api/playlists/generate" `
        -Method Post `
        -ContentType "application/json" `
        -Body ($generateRequest | ConvertTo-Json -Depth 10)

    $jobId = $generateResponse.jobId
    Write-Status "Job started: $jobId" "Yellow"
} catch {
    Write-Status "Failed to start generation: $_" "Red"
    exit 1
}

# Poll for completion
$startTime = Get-Date
$lastStatus = ""
$tracks = @()

while ($true) {
    $elapsed = ((Get-Date) - $startTime).TotalSeconds

    if ($elapsed -gt $Timeout) {
        Write-Status "Timeout after $Timeout seconds" "Red"
        exit 1
    }

    try {
        $status = Invoke-RestMethod -Uri "$ServerUrl/api/playlists/jobs/$jobId"

        if ($status.status -ne $lastStatus) {
            $statusText = switch ($status.status) {
                "generating_ai" { "Generating track suggestions with AI..." }
                "matching_tracks" { "Matching tracks in Music Assistant..." }
                "creating_playlist" { "Creating playlist..." }
                "completed" { "Completed!" }
                "failed" { "Failed!" }
                default { $status.status }
            }
            Write-Status $statusText "Cyan"
            $lastStatus = $status.status
        }

        # Show progress if available
        if ($status.PSObject.Properties.Name -contains "totalTracks" -and $status.totalTracks -gt 0) {
            $matched = if ($status.PSObject.Properties.Name -contains "matchedTracks") { $status.matchedTracks } else { 0 }
            Write-ProgressBar -Current $matched -Total $status.totalTracks -Status "Matched $matched/$($status.totalTracks) tracks"
        }

        if ($status.status -eq "completed") {
            Write-Progress -Activity "Generating Playlist" -Completed

            # If webhook was used, playlist is already created
            if (![string]::IsNullOrEmpty($WebhookUrl) -and ![string]::IsNullOrEmpty($status.playlistUrl)) {
                Write-Status "Playlist created: $($status.playlistUrl)" "Green"

                # Output result object
                [PSCustomObject]@{
                    JobId = $jobId
                    PlaylistUrl = $status.playlistUrl
                    Status = "Created"
                }
                exit 0
            }

            # Get tracks for manual creation
            Write-Status "Fetching matched tracks..."
            try {
                $jobStatus = Invoke-RestMethod -Uri "$ServerUrl/api/playlists/jobs/$jobId"
                if ($jobStatus.PSObject.Properties.Name -contains "tracks") {
                    $tracks = $jobStatus.tracks
                }
            } catch {
                Write-Status "Warning: Could not fetch tracks: $_" "Yellow"
            }

            break
        }

        if ($status.status -eq "failed") {
            Write-Progress -Activity "Generating Playlist" -Completed
            $errorMsg = if (![string]::IsNullOrEmpty($status.error)) { $status.error } else { "Unknown error" }
            Write-Status "Generation failed: $errorMsg" "Red"
            exit 1
        }

    } catch {
        Write-Status "Error polling status: $_" "Red"
        exit 1
    }

    Start-Sleep -Seconds $PollInterval
}

# Count matched tracks
$matchedTracks = @($tracks | Where-Object { $_.matched -eq $true })
$totalTracks = $tracks.Count

Write-Status "Matched $($matchedTracks.Count)/$totalTracks tracks" $(if ($matchedTracks.Count -eq $totalTracks) { "Green" } else { "Yellow" })

# Show track list
if ($tracks.Count -gt 0) {
    Write-Host ""
    Write-Host "Track List:" -ForegroundColor Cyan
    foreach ($track in $tracks) {
        $icon = if ($track.matched) { "[✓]" } else { "[✗]" }
        $color = if ($track.matched) { "Green" } else { "Red" }
        Write-Host "  $icon " -NoNewline -ForegroundColor $color
        Write-Host "$($track.suggestion.title) - $($track.suggestion.artist)"
    }
    Write-Host ""
}

if ($NoCreate) {
    Write-Status "Generation complete (not creating playlist)" "Green"

    # Output result object
    [PSCustomObject]@{
        JobId = $jobId
        Tracks = $tracks
        MatchedCount = $matchedTracks.Count
        TotalCount = $totalTracks
        Status = "Generated"
    }
    exit 0
}

# Create playlist in Music Assistant
Write-Status "Creating playlist: $PlaylistName" "Green"

$createRequest = @{
    playlistName = $PlaylistName
    prompt = $Prompt
    tracks = $tracks
}

try {
    $createResponse = Invoke-RestMethod `
        -Uri "$ServerUrl/api/playlists/create" `
        -Method Post `
        -ContentType "application/json" `
        -Body ($createRequest | ConvertTo-Json -Depth 10)

    Write-Status "Playlist created successfully!" "Green"
    Write-Status "Added $($createResponse.tracksAdded) tracks" "Cyan"
    Write-Status "URL: $($createResponse.playlistUrl)" "Cyan"

    # Output result object
    [PSCustomObject]@{
        JobId = $jobId
        PlaylistName = $PlaylistName
        PlaylistId = $createResponse.playlistId
        PlaylistUrl = $createResponse.playlistUrl
        TracksAdded = $createResponse.tracksAdded
        Status = "Created"
    }

} catch {
    Write-Status "Failed to create playlist: $_" "Red"
    exit 1
}
