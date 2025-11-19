#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Creates a release by updating version, creating a tag, and opening the GitHub release page.

.DESCRIPTION
    This script orchestrates the release process:
    1. Checks git status is clean
    2. Calls Update-Version.ps1 to bump version and commit
    3. Creates and pushes a git tag
    4. Opens GitHub create release page in browser

.PARAMETER Action
    The action to perform: 'major', 'minor', 'patch', or 'set'

.PARAMETER Version
    When Action is 'set', this parameter specifies the exact version to set (e.g., "1.2.3")

.PARAMETER CommitMessage
    Custom commit message. If not provided, defaults to "chore: bump version to X.Y.Z"

.PARAMETER DryRun
    If specified, shows what would be done without making any changes

.PARAMETER Auto
    If specified, creates release automatically using gh CLI with generated notes.
    Otherwise, opens the GitHub release page in browser for manual completion.

.EXAMPLE
    .\Release.ps1 -Action patch
    Increments the patch version by 1, tags, and opens browser

.EXAMPLE
    .\Release.ps1 -Action patch -Auto
    Increments the patch version by 1, tags, and creates release automatically

.EXAMPLE
    .\Release.ps1 -Action set -Version "2.1.0"
    Sets version to exactly "2.1.0", tags, and opens browser

.EXAMPLE
    .\Release.ps1 -Action minor -DryRun
    Shows what would happen without making changes
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("major", "minor", "patch", "set")]
    [string]$Action,

    [Parameter(Mandatory = $false)]
    [string]$Version,

    [Parameter(Mandatory = $false)]
    [string]$CommitMessage,

    [Parameter(Mandatory = $false)]
    [switch]$DryRun,

    [Parameter(Mandatory = $false)]
    [switch]$Auto
)

# Ensure we're in the correct directory
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptRoot
Set-Location $ProjectRoot

try {
    # Check for uncommitted changes
    Write-Host "Checking git status..." -ForegroundColor Cyan
    $GitStatus = git status --porcelain
    if ($GitStatus) {
        Write-Error "❌ Working directory is not clean. Commit or stash changes first:"
        Write-Host $GitStatus -ForegroundColor Yellow
        exit 1
    }

    # Get current branch
    $CurrentBranch = git branch --show-current
    Write-Host "Current branch: $CurrentBranch" -ForegroundColor Cyan

    # Build Update-Version.ps1 parameters
    $UpdateVersionParams = @{
        Action = $Action
    }
    if ($Version) {
        $UpdateVersionParams.Version = $Version
    }
    if ($CommitMessage) {
        $UpdateVersionParams.CommitMessage = $CommitMessage
    }
    if ($DryRun) {
        $UpdateVersionParams.DryRun = $true
    }

    # Call Update-Version.ps1
    Write-Host "`nUpdating version..." -ForegroundColor Cyan
    $UpdateVersionScript = Join-Path $ScriptRoot "Update-Version.ps1"
    & $UpdateVersionScript @UpdateVersionParams

    if ($LASTEXITCODE -ne 0) {
        throw "Update-Version.ps1 failed with exit code $LASTEXITCODE"
    }

    if ($DryRun) {
        # Get what the new version would be for dry run display
        $PackageJsonPath = Join-Path $ProjectRoot "package.json"
        $PackageContent = Get-Content $PackageJsonPath -Raw | ConvertFrom-Json
        $CurrentVersion = $PackageContent.version

        $VersionComponents = $CurrentVersion.Split('.')
        $NewVersion = switch ($Action) {
            "major" { "$([int]$VersionComponents[0] + 1).0.0" }
            "minor" { "$($VersionComponents[0]).$([int]$VersionComponents[1] + 1).0" }
            "patch" { "$($VersionComponents[0]).$($VersionComponents[1]).$([int]$VersionComponents[2] + 1)" }
            "set" { $Version }
        }

        Write-Host "`nWould create and push tag: $NewVersion" -ForegroundColor Magenta
        Write-Host "Would push to remote: origin" -ForegroundColor Magenta
        if ($Auto) {
            Write-Host "Would run: gh release create $NewVersion --title `"v$NewVersion`" --generate-notes" -ForegroundColor Magenta
        } else {
            Write-Host "Would open: https://github.com/JonSilver/music-assistant-ai-playlist-creator/releases/new?tag=$NewVersion" -ForegroundColor Magenta
        }
        return
    }

    # Read new version from package.json
    Write-Host "`nReading new version..." -ForegroundColor Cyan
    $PackageJsonPath = Join-Path $ProjectRoot "package.json"
    $PackageContent = Get-Content $PackageJsonPath -Raw | ConvertFrom-Json
    $NewVersion = $PackageContent.version
    $TagName = $NewVersion

    Write-Host "Creating tag: $TagName" -ForegroundColor Cyan
    $TagResult = git tag $TagName 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Git tag failed:"
        Write-Host $TagResult -ForegroundColor Red
        throw "git tag failed with exit code $LASTEXITCODE"
    }

    # Push commit and tag
    Write-Host "Pushing commit and tag to origin..." -ForegroundColor Cyan
    $PushResult = git push origin $CurrentBranch 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Git push failed:"
        Write-Host $PushResult -ForegroundColor Red
        throw "git push failed with exit code $LASTEXITCODE"
    }

    $PushTagResult = git push origin $TagName 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Git push tag failed:"
        Write-Host $PushTagResult -ForegroundColor Red
        throw "git push tag failed with exit code $LASTEXITCODE"
    }

    # Create release
    if ($Auto) {
        Write-Host "`nCreating GitHub release automatically..." -ForegroundColor Cyan
        $ReleaseResult = gh release create $TagName --title "v$NewVersion" --generate-notes 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Error "gh release create failed:"
            Write-Host $ReleaseResult -ForegroundColor Red
            throw "gh release create failed with exit code $LASTEXITCODE"
        }

        Write-Host "`n✅ Release created successfully!" -ForegroundColor Green
        Write-Host "Version: $NewVersion" -ForegroundColor Green
        Write-Host "Tag: $TagName" -ForegroundColor Green
        Write-Host "Pushed to: origin/$CurrentBranch" -ForegroundColor Green
        Write-Host "Release: https://github.com/JonSilver/music-assistant-ai-playlist-creator/releases/tag/$TagName" -ForegroundColor Green
    } else {
        # Open GitHub create release page in browser
        $RepoUrl = "https://github.com/JonSilver/music-assistant-ai-playlist-creator"
        $ReleaseUrl = "$RepoUrl/releases/new?tag=$TagName"

        Write-Host "`nOpening GitHub release page..." -ForegroundColor Cyan
        Write-Host $ReleaseUrl -ForegroundColor Yellow
        Start-Process $ReleaseUrl

        Write-Host "`n✅ Release process complete!" -ForegroundColor Green
        Write-Host "Version: $NewVersion" -ForegroundColor Green
        Write-Host "Tag: $TagName" -ForegroundColor Green
        Write-Host "Pushed to: origin/$CurrentBranch" -ForegroundColor Green
        Write-Host "GitHub release page opened in browser" -ForegroundColor Green
    }

}
catch {
    Write-Error "❌ Error: $($_.Exception.Message)"
    exit 1
}
