#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Updates the version in package.json, updates package-lock.json, and creates a git commit.

.DESCRIPTION
    This script allows you to increment major, minor, or patch version numbers by 1,
    or set a specific version. It then updates the package-lock.json file and creates
    a git commit with the version change.

.PARAMETER Action
    The action to perform: 'major', 'minor', 'patch', or 'set'

.PARAMETER Version
    When Action is 'set', this parameter specifies the exact version to set (e.g., "1.2.3")

.PARAMETER CommitMessage
    Custom commit message. If not provided, defaults to "chore: bump version to X.Y.Z"

.PARAMETER DryRun
    If specified, shows what would be done without making any changes

.EXAMPLE
    .\Update-Version.ps1 -Action patch
    Increments the patch version by 1

.EXAMPLE
    .\Update-Version.ps1 -Action minor
    Increments the minor version by 1 and resets patch to 0

.EXAMPLE
    .\Update-Version.ps1 -Action major
    Increments the major version by 1 and resets minor and patch to 0

.EXAMPLE
    .\Update-Version.ps1 -Action set -Version "2.1.0"
    Sets the version to exactly "2.1.0"

.EXAMPLE
    .\Update-Version.ps1 -Action patch -CommitMessage "fix: critical bug patch"
    Increments patch version with custom commit message

.EXAMPLE
    .\Update-Version.ps1 -Action minor -DryRun
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
    [switch]$DryRun
)

# Ensure we're in the correct directory
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptRoot
Set-Location $ProjectRoot

# Function to validate semantic version format
function Test-SemanticVersion {
    param([string]$VersionString)
    
    return $VersionString -match '^\d+\.\d+\.\d+$'
}

# Function to parse version string into components
function Get-VersionComponents {
    param([string]$VersionString)
    
    $parts = $VersionString.Split('.')
    return @{
        Major = [int]$parts[0]
        Minor = [int]$parts[1]
        Patch = [int]$parts[2]
    }
}

# Function to create version string from components
function New-VersionString {
    param($Major, $Minor, $Patch)
    return "$Major.$Minor.$Patch"
}

# Function to compare two semantic versions
# Returns: -1 if version1 < version2, 0 if equal, 1 if version1 > version2
function Compare-SemanticVersion {
    param(
        [string]$Version1,
        [string]$Version2
    )
    
    $v1 = Get-VersionComponents $Version1
    $v2 = Get-VersionComponents $Version2
    
    # Compare major version
    if ($v1.Major -lt $v2.Major) { return -1 }
    if ($v1.Major -gt $v2.Major) { return 1 }
    
    # Major versions are equal, compare minor
    if ($v1.Minor -lt $v2.Minor) { return -1 }
    if ($v1.Minor -gt $v2.Minor) { return 1 }
    
    # Major and minor are equal, compare patch
    if ($v1.Patch -lt $v2.Patch) { return -1 }
    if ($v1.Patch -gt $v2.Patch) { return 1 }
    
    # All components are equal
    return 0
}

try {
    # Check if package.json exists
    $PackageJsonPath = Join-Path $ProjectRoot "package.json"
    if (-not (Test-Path $PackageJsonPath)) {
        throw "package.json not found in project root: $ProjectRoot"
    }

    # Read and parse package.json
    Write-Host "Reading package.json..." -ForegroundColor Cyan
    $PackageContent = Get-Content $PackageJsonPath -Raw | ConvertFrom-Json
    $CurrentVersion = $PackageContent.version
    
    Write-Host "Current version: $CurrentVersion" -ForegroundColor Yellow

    # Validate current version format
    if (-not (Test-SemanticVersion $CurrentVersion)) {
        throw "Current version '$CurrentVersion' is not in valid semantic version format (x.y.z)"
    }

    # Calculate new version
    $VersionComponents = Get-VersionComponents $CurrentVersion
    $NewVersion = ""

    switch ($Action) {
        "major" {
            $NewVersion = New-VersionString ($VersionComponents.Major + 1) 0 0
        }
        "minor" {
            $NewVersion = New-VersionString $VersionComponents.Major ($VersionComponents.Minor + 1) 0
        }
        "patch" {
            $NewVersion = New-VersionString $VersionComponents.Major $VersionComponents.Minor ($VersionComponents.Patch + 1)
        }
        "set" {
            if (-not $Version) {
                throw "Version parameter is required when Action is 'set'"
            }
            if (-not (Test-SemanticVersion $Version)) {
                throw "Provided version '$Version' is not in valid semantic version format (x.y.z)"
            }
            
            # Check if the new version is lower than current version
            $VersionComparison = Compare-SemanticVersion $Version $CurrentVersion
            if ($VersionComparison -lt 0) {
                throw "Cannot set version to '$Version' as it is lower than the current version '$CurrentVersion'. Use a higher version number."
            }
            if ($VersionComparison -eq 0) {
                throw "Version '$Version' is the same as the current version '$CurrentVersion'. No change needed."
            }
            
            $NewVersion = $Version
        }
    }

    Write-Host "New version will be: $NewVersion" -ForegroundColor Green

    if ($DryRun) {
        Write-Host "`n--- DRY RUN MODE ---" -ForegroundColor Magenta
        Write-Host "Would update package.json version from $CurrentVersion to $NewVersion"
        Write-Host "Would run: npm install --package-lock-only"
        Write-Host "Would create git commit with message: $(if ($CommitMessage) { $CommitMessage } else { "chore: bump version to $NewVersion" })"
        Write-Host "--- END DRY RUN ---`n" -ForegroundColor Magenta
        return
    }

    # Check for uncommitted changes
    Write-Host "Checking git status..." -ForegroundColor Cyan
    $GitStatus = git status --porcelain
    if ($GitStatus) {
        Write-Warning "There are uncommitted changes in the repository:"
        Write-Host $GitStatus -ForegroundColor Yellow
        $Confirm = Read-Host "Continue anyway? (y/N)"
        if ($Confirm -ne 'y' -and $Confirm -ne 'Y') {
            Write-Host "Aborted by user." -ForegroundColor Red
            return
        }
    }

    # Update package.json
    Write-Host "Updating package.json..." -ForegroundColor Cyan
    $PackageContent.version = $NewVersion
    $UpdatedJson = $PackageContent | ConvertTo-Json -Depth 10
    Set-Content $PackageJsonPath -Value $UpdatedJson -Encoding UTF8

    # Update package-lock.json
    Write-Host "Running npm install --package-lock-only..." -ForegroundColor Cyan
    $NpmResult = npm install --package-lock-only 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "npm install failed:"
        Write-Host $NpmResult -ForegroundColor Red
        throw "npm install --package-lock-only failed with exit code $LASTEXITCODE"
    }

    # Create git commit
    $FinalCommitMessage = if ($CommitMessage) { $CommitMessage } else { "chore: bump version to $NewVersion" }
    Write-Host "Creating git commit..." -ForegroundColor Cyan
    
    git add package.json package-lock.json
    $CommitResult = git commit -m $FinalCommitMessage 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Git commit failed:"
        Write-Host $CommitResult -ForegroundColor Red
        throw "git commit failed with exit code $LASTEXITCODE"
    }

    Write-Host "`n✅ Success!" -ForegroundColor Green
    Write-Host "Version updated from $CurrentVersion to $NewVersion" -ForegroundColor Green
    Write-Host "Package-lock.json updated" -ForegroundColor Green
    Write-Host "Git commit created: '$FinalCommitMessage'" -ForegroundColor Green

}
catch {
    Write-Error "❌ Error: $($_.Exception.Message)"
    exit 1
}