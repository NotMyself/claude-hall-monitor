#Requires -Version 7.0
<#
.SYNOPSIS
    Sets up Docker Desktop MCP gateway with required servers and configuration.

.DESCRIPTION
    This script configures Docker Desktop's MCP (Model Context Protocol) gateway
    with the following servers:
    - azure: Azure MCP Server for cloud operations
    - context7: Up-to-date code documentation
    - docker: Docker CLI access
    - filesystem: Local filesystem access with configurable paths
    - playwright: Browser automation
    - sequentialthinking: Problem-solving through structured thinking

    It also configures the filesystem server with allowed paths and enables
    required feature flags.

.PARAMETER FilesystemPaths
    Array of paths to allow for the filesystem MCP server.
    Defaults to current user's src and Desktop folders.

.PARAMETER SkipFeatureFlags
    Skip enabling feature flags.

.EXAMPLE
    .\Setup-DockerMcp.ps1

.EXAMPLE
    .\Setup-DockerMcp.ps1 -FilesystemPaths @("C:\Projects", "D:\Data")

.NOTES
    Requires Docker Desktop to be installed and running.
    Requires PowerShell 7.0 or later.
#>

[CmdletBinding()]
param(
    [string[]]$FilesystemPaths = @(
        "$env:USERPROFILE\src",
        "$env:USERPROFILE\OneDrive\Desktop"
    ),
    [switch]$SkipFeatureFlags
)

$ErrorActionPreference = 'Stop'

# ANSI color codes for output
$script:Colors = @{
    Red     = "`e[31m"
    Green   = "`e[32m"
    Yellow  = "`e[33m"
    Blue    = "`e[34m"
    Cyan    = "`e[36m"
    Reset   = "`e[0m"
}

function Write-Status {
    param(
        [string]$Message,
        [ValidateSet('Info', 'Success', 'Warning', 'Error')]
        [string]$Type = 'Info'
    )

    $prefix = switch ($Type) {
        'Info'    { "$($Colors.Blue)[*]$($Colors.Reset)" }
        'Success' { "$($Colors.Green)[+]$($Colors.Reset)" }
        'Warning' { "$($Colors.Yellow)[!]$($Colors.Reset)" }
        'Error'   { "$($Colors.Red)[x]$($Colors.Reset)" }
    }

    Write-Host "$prefix $Message"
}

function Test-DockerDesktop {
    Write-Status "Checking for Docker Desktop..." -Type Info

    # Check if docker command exists
    $dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
    if (-not $dockerCmd) {
        Write-Status "Docker CLI not found in PATH" -Type Error
        Write-Status "Please install Docker Desktop from https://www.docker.com/products/docker-desktop/" -Type Info
        return $false
    }

    # Check Docker version
    try {
        $version = docker --version 2>&1
        Write-Status "Found: $version" -Type Success
    }
    catch {
        Write-Status "Failed to get Docker version: $_" -Type Error
        return $false
    }

    # Check if Docker daemon is running
    try {
        $info = docker info 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Status "Docker daemon is not running" -Type Error
            Write-Status "Please start Docker Desktop and try again" -Type Info
            return $false
        }
        Write-Status "Docker daemon is running" -Type Success
    }
    catch {
        Write-Status "Failed to connect to Docker daemon: $_" -Type Error
        return $false
    }

    # Check if MCP plugin is available
    try {
        $mcpHelp = docker mcp --help 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Status "Docker MCP plugin not available" -Type Error
            Write-Status "Please update Docker Desktop to the latest version" -Type Info
            return $false
        }
        Write-Status "Docker MCP plugin is available" -Type Success
    }
    catch {
        Write-Status "Docker MCP plugin not found: $_" -Type Error
        return $false
    }

    return $true
}

function Get-CurrentMcpServers {
    Write-Status "Getting current MCP server configuration..." -Type Info

    try {
        $servers = docker mcp server list 2>&1
        if ($LASTEXITCODE -eq 0) {
            return $servers
        }
    }
    catch {
        Write-Status "Failed to get server list: $_" -Type Warning
    }

    return $null
}

function Enable-McpServer {
    param(
        [Parameter(Mandatory)]
        [string]$ServerName
    )

    Write-Status "Enabling MCP server: $($Colors.Cyan)$ServerName$($Colors.Reset)" -Type Info

    try {
        $result = docker mcp server enable $ServerName 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Status "Enabled: $ServerName" -Type Success
            return $true
        }
        else {
            # Check if already enabled
            if ($result -match "already enabled") {
                Write-Status "Already enabled: $ServerName" -Type Success
                return $true
            }
            Write-Status "Failed to enable $ServerName`: $result" -Type Warning
            return $false
        }
    }
    catch {
        Write-Status "Error enabling $ServerName`: $_" -Type Error
        return $false
    }
}

function Set-FilesystemConfig {
    param(
        [Parameter(Mandatory)]
        [string[]]$Paths
    )

    Write-Status "Configuring filesystem server paths..." -Type Info

    # Validate paths exist
    $validPaths = @()
    foreach ($path in $Paths) {
        $expandedPath = [Environment]::ExpandEnvironmentVariables($path)
        if (Test-Path $expandedPath -PathType Container) {
            $validPaths += $expandedPath
            Write-Status "  Path exists: $expandedPath" -Type Success
        }
        else {
            Write-Status "  Path not found (skipping): $expandedPath" -Type Warning
        }
    }

    if ($validPaths.Count -eq 0) {
        Write-Status "No valid paths to configure" -Type Warning
        return $false
    }

    # Build YAML config
    $pathsYaml = ($validPaths | ForEach-Object { "    - $_" }) -join "`n"
    $config = @"
filesystem:
  paths:
$pathsYaml
"@

    Write-Status "Writing filesystem configuration..." -Type Info

    try {
        # Use a temp file to avoid quoting issues
        $tempFile = [System.IO.Path]::GetTempFileName()
        $config | Out-File -FilePath $tempFile -Encoding utf8 -NoNewline

        # Read and pipe to docker mcp config write
        $configContent = Get-Content -Path $tempFile -Raw
        $result = $configContent | docker mcp config write 2>&1

        Remove-Item -Path $tempFile -Force -ErrorAction SilentlyContinue

        if ($LASTEXITCODE -eq 0) {
            Write-Status "Filesystem configuration updated" -Type Success
            return $true
        }
        else {
            Write-Status "Failed to write config: $result" -Type Warning
            return $false
        }
    }
    catch {
        Write-Status "Error configuring filesystem: $_" -Type Error
        return $false
    }
}

function Enable-McpFeature {
    param(
        [Parameter(Mandatory)]
        [string]$FeatureName
    )

    Write-Status "Enabling feature: $($Colors.Cyan)$FeatureName$($Colors.Reset)" -Type Info

    try {
        $result = docker mcp feature enable $FeatureName 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Status "Enabled feature: $FeatureName" -Type Success
            return $true
        }
        else {
            if ($result -match "already enabled") {
                Write-Status "Feature already enabled: $FeatureName" -Type Success
                return $true
            }
            Write-Status "Failed to enable feature $FeatureName`: $result" -Type Warning
            return $false
        }
    }
    catch {
        Write-Status "Error enabling feature $FeatureName`: $_" -Type Error
        return $false
    }
}

function Show-FinalStatus {
    Write-Host ""
    Write-Status "Final MCP Configuration:" -Type Info
    Write-Host ""

    # Show enabled servers
    Write-Host "$($Colors.Cyan)Enabled Servers:$($Colors.Reset)"
    docker mcp server list

    Write-Host ""
    Write-Host "$($Colors.Cyan)Configuration:$($Colors.Reset)"
    docker mcp config read

    Write-Host ""
    Write-Host "$($Colors.Cyan)Feature Flags:$($Colors.Reset)"
    docker mcp feature list
}

# Main execution
function Main {
    Write-Host ""
    Write-Host "$($Colors.Cyan)========================================$($Colors.Reset)"
    Write-Host "$($Colors.Cyan)  Docker MCP Gateway Setup Script$($Colors.Reset)"
    Write-Host "$($Colors.Cyan)========================================$($Colors.Reset)"
    Write-Host ""

    # Check Docker Desktop
    if (-not (Test-DockerDesktop)) {
        Write-Host ""
        Write-Status "Setup cannot continue without Docker Desktop" -Type Error
        exit 1
    }

    Write-Host ""

    # Define servers to enable
    $servers = @(
        'azure',
        'context7',
        'docker',
        'filesystem',
        'playwright',
        'sequentialthinking'
    )

    # Enable each server
    Write-Host "$($Colors.Cyan)--- Enabling MCP Servers ---$($Colors.Reset)"
    $enabledCount = 0
    foreach ($server in $servers) {
        if (Enable-McpServer -ServerName $server) {
            $enabledCount++
        }
    }
    Write-Status "Enabled $enabledCount/$($servers.Count) servers" -Type Info

    Write-Host ""

    # Configure filesystem paths
    Write-Host "$($Colors.Cyan)--- Configuring Filesystem Server ---$($Colors.Reset)"
    Set-FilesystemConfig -Paths $FilesystemPaths

    Write-Host ""

    # Enable feature flags
    if (-not $SkipFeatureFlags) {
        Write-Host "$($Colors.Cyan)--- Enabling Feature Flags ---$($Colors.Reset)"
        Enable-McpFeature -FeatureName 'mcp-oauth-dcr'
    }

    Write-Host ""

    # Show final status
    Show-FinalStatus

    Write-Host ""
    Write-Host "$($Colors.Green)========================================$($Colors.Reset)"
    Write-Host "$($Colors.Green)  Setup Complete!$($Colors.Reset)"
    Write-Host "$($Colors.Green)========================================$($Colors.Reset)"
    Write-Host ""
    Write-Status "To use the MCP gateway, add this to your Claude config:" -Type Info
    Write-Host ""
    Write-Host @"
{
  "mcpServers": {
    "MCP_DOCKER": {
      "command": "docker",
      "args": ["mcp", "gateway", "run"],
      "type": "stdio"
    }
  }
}
"@
    Write-Host ""
}

# Run main
Main
