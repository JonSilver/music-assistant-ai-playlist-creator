<#
.SYNOPSIS
    Test script for AI Playlist Creator

.DESCRIPTION
    Generates a test playlist using the New-AIPlaylist.ps1 script to verify the API is working

.PARAMETER ServerUrl
    The base URL of the AI Playlist Creator server (default: http://localhost:9876)

.PARAMETER NoCreate
    Generate tracks but don't create the playlist in Music Assistant

.EXAMPLE
    .\Test-AIPlaylist.ps1

.EXAMPLE
    .\Test-AIPlaylist.ps1 -ServerUrl "http://192.168.1.100:9876" -NoCreate
#>

[CmdletBinding()]
param(
    [Parameter()]
    [string]$ServerUrl = "http://localhost:3333",

    [Parameter()]
    [switch]$NoCreate
)

$ErrorActionPreference = "Stop"

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "AI Playlist Creator - Test Script" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Test prompt
$testPrompt = "Classic rock anthems from the 70s and 80s"
$testTrackCount = 10
$testPlaylistName = "Test Playlist - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"

Write-Host "Test Parameters:" -ForegroundColor Yellow
Write-Host "  Server: $ServerUrl" -ForegroundColor Gray
Write-Host "  Prompt: $testPrompt" -ForegroundColor Gray
Write-Host "  Tracks: $testTrackCount" -ForegroundColor Gray
Write-Host "  Create: $(!$NoCreate)" -ForegroundColor Gray
Write-Host ""

# Check if New-AIPlaylist.ps1 exists
$scriptPath = Join-Path $PSScriptRoot "New-AIPlaylist.ps1"
if (!(Test-Path $scriptPath)) {
    Write-Host "Error: New-AIPlaylist.ps1 not found at: $scriptPath" -ForegroundColor Red
    exit 1
}

# Test server connectivity
Write-Host "Testing server connectivity..." -ForegroundColor Cyan
try {
    $health = Invoke-WebRequest -Uri "$ServerUrl/api/settings" -Method Get -UseBasicParsing
    Write-Host "  ✓ Server is reachable" -ForegroundColor Green
}
catch {
    Write-Host "  ✗ Server is not reachable: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Run the playlist generation
$params = @{
    ServerUrl = $ServerUrl
    Prompt = $testPrompt
    TrackCount = $testTrackCount
    PlaylistName = $testPlaylistName
}

if ($NoCreate) {
    $params.NoCreate = $true
}

try {
    $result = & $scriptPath @params

    Write-Host ""
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "Test Result: SUCCESS" -ForegroundColor Green
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host ""

    # Display result details
    Write-Host "Result Details:" -ForegroundColor Yellow
    $result | Format-List

    exit 0

}
catch {
    Write-Host ""
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "Test Result: FAILED" -ForegroundColor Red
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Error: $_" -ForegroundColor Red

    exit 1
}
