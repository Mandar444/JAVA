param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$taskUrl = 'http://127.0.0.1:48260'
$taskIsRunning = $false
try {
    $taskHealth = Invoke-RestMethod -Uri "$taskUrl/__health" -TimeoutSec 2
    if ($taskHealth.app -eq 'DSA-Now') { $taskIsRunning = $true }
    else { throw 'Port 48260 is used by another application.' }
} catch {
    if ($_.Exception.Message -like '*used by another*') { throw }
}
if (-not $taskIsRunning) {
    $taskNode = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
    if (-not (Test-Path -LiteralPath $taskNode)) {
        $taskCommand = Get-Command node -ErrorAction SilentlyContinue
        if (-not $taskCommand) { throw 'Node.js was not found. Install Node.js or open this folder in Codex to launch it.' }
        $taskNode = $taskCommand.Source
    }
    $taskServer = Join-Path $PSScriptRoot 'server.mjs'
    $taskProcess = Start-Process -FilePath $taskNode -ArgumentList @("`"$taskServer`"", '48260') -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -PassThru
    $taskReady = $false
    for ($taskTry = 0; $taskTry -lt 20; $taskTry++) {
        Start-Sleep -Milliseconds 250
        try {
            $taskHealth = Invoke-RestMethod -Uri "$taskUrl/__health" -TimeoutSec 1
            if ($taskHealth.app -eq 'DSA-Now') { $taskReady = $true; break }
        } catch {}
        if ($taskProcess.HasExited) { break }
    }
    if (-not $taskReady) { throw 'The app could not start. Port 48260 may be in use. See README.txt for the manual launch command.' }
}
Write-Host "DSA Now is ready: $taskUrl"
if (-not $NoBrowser) { Start-Process $taskUrl }
