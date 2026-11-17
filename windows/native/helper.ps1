# Blinkelo - native helper
# Runs in Windows PowerShell 5.1 (built into Windows 10/11). Talks to Electron over stdin/stdout (JSON lines).
param(
    [string]$CacheDir = (Join-Path $env:LOCALAPPDATA 'Blinkelo\native-cache')
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path

function Write-Raw([string]$json) {
    # Used only before the native core is loaded.
    [Console]::Out.WriteLine($json)
    [Console]::Out.Flush()
}

function Get-SourceHash([string]$text) {
    $sha = [System.Security.Cryptography.SHA1]::Create()
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($text + $PSVersionTable.PSVersion.ToString())
    $hash = $sha.ComputeHash($bytes)
    return (($hash | ForEach-Object { $_.ToString('x2') }) -join '').Substring(0, 12)
}

# Compiles a C# module once and caches the DLL (keyed by source hash); falls back to in-memory compile.
function Import-NativeModule([string]$name, [string]$file, [string[]]$refs, [string]$probeType) {
    $src = [System.IO.File]::ReadAllText((Join-Path $here $file))
    $hash = Get-SourceHash $src
    $dll = $null
    try {
        if (-not (Test-Path $CacheDir)) { New-Item -ItemType Directory -Path $CacheDir -Force | Out-Null }
        $dll = Join-Path $CacheDir ("$name-$hash.dll")
        if (-not (Test-Path $dll)) {
            Add-Type -TypeDefinition $src -ReferencedAssemblies $refs -OutputAssembly $dll -OutputType Library -IgnoreWarnings | Out-Null
        }
        Add-Type -Path $dll | Out-Null
    } catch {
        $msg = $_.Exception.Message
        if ($dll -and (Test-Path $dll)) { try { Remove-Item $dll -Force -ErrorAction SilentlyContinue } catch {} }
        if (-not ($probeType -as [type])) {
            try {
                Add-Type -TypeDefinition $src -ReferencedAssemblies $refs -IgnoreWarnings | Out-Null
            } catch {
                throw "compile failed for ${name}: $($_.Exception.Message) / first attempt: $msg"
            }
        }
    }
    if (-not ($probeType -as [type])) { throw "type $probeType missing after loading $name" }
}

# ---------------------------------------------------------------- load native core
try {
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing
    $coreRefs = @(
        ([System.Xml.XmlDocument].Assembly.Location),
        ([System.Linq.Enumerable].Assembly.Location),
        ([System.Windows.Forms.Control].Assembly.Location),
        ([System.Drawing.Bitmap].Assembly.Location)
    )
    Import-NativeModule 'island-core' 'Core.cs' $coreRefs 'IslandNative.Out'
} catch {
    $m = ($_.Exception.Message -replace '[\r\n"\\]', ' ')
    Write-Raw ('{"type":"status","module":"core","ok":false,"detail":"' + $m + '"}')
    Start-Sleep -Seconds 2
    exit 3
}

function Emit([string]$json) { [IslandNative.Out]::Line($json) }
function Log([string]$level, [string]$msg) { [IslandNative.Out]::Log($level, $msg) }
function Status([string]$module, [bool]$ok, [string]$detail) { [IslandNative.Out]::Status($module, $ok, $detail) }
function ToJson($obj) { return (ConvertTo-Json -InputObject $obj -Compress -Depth 5) }

Status 'core' $true ("PowerShell " + $PSVersionTable.PSVersion.ToString())
[IslandNative.Host]::Start()

# ---------------------------------------------------------------- UI Automation (optional)
$script:uiaOk = $false
try {
    Add-Type -AssemblyName UIAutomationClient
    Add-Type -AssemblyName UIAutomationTypes
    Add-Type -AssemblyName WindowsBase
    $uiaRefs = @(
        ([System.Windows.Automation.AutomationElement].Assembly.Location),
        ([System.Windows.Automation.ControlType].Assembly.Location),
        ([System.Windows.Threading.Dispatcher].Assembly.Location),
        ([System.Linq.Enumerable].Assembly.Location)
    )
    Import-NativeModule 'island-uia' 'Uia.cs' $uiaRefs 'IslandUia.Uia'
    $script:uiaOk = $true
    Status 'uia' $true 'ok'
} catch {
    Status 'uia' $false $_.Exception.Message
}

# ---------------------------------------------------------------- gaming mode (optional)
$script:gameOk = $false
try {
    Add-Type -AssemblyName System.Management
    $gameRefs = @(
        ([System.Management.ManagementObject].Assembly.Location),
        ([System.Diagnostics.Process].Assembly.Location),
        ([System.Linq.Enumerable].Assembly.Location)
    )
    Import-NativeModule 'island-game' 'Game.cs' $gameRefs 'IslandGame.Game'
    $script:gameOk = $true
    Status 'game' $true 'ok'
} catch {
    Status 'game' $false $_.Exception.Message
}

# ---------------------------------------------------------------- media (WinRT System Media Transport Controls)
$script:mediaOk = $false
$script:mgr = $null
$script:asTaskOp = $null
$script:lastKey = ''
$script:lastArtKey = ''
$script:artTries = 0
$script:artOk = $false
$script:lastEmitMs = 0
$script:lastPosSec = -1
$script:sw = [System.Diagnostics.Stopwatch]::StartNew()

function Await-Op($op, [Type]$resultType, [int]$timeoutMs = 2500) {
    $task = $script:asTaskOp.MakeGenericMethod($resultType).Invoke($null, @($op))
    if (-not $task.Wait($timeoutMs)) { return $null }
    return $task.Result
}

function Init-Media {
    try {
        Add-Type -AssemblyName System.Runtime.WindowsRuntime
        $script:asTaskOp = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
            $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
        } | Select-Object -First 1
        $null = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]
        $null = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties, Windows.Media.Control, ContentType = WindowsRuntime]
        try {
            $null = [Windows.Storage.Streams.IRandomAccessStreamWithContentType, Windows.Storage.Streams, ContentType = WindowsRuntime]
            $null = [Windows.Storage.Streams.DataReader, Windows.Storage.Streams, ContentType = WindowsRuntime]
            $script:artOk = $true
        } catch {
            $script:artOk = $false
            Log 'warn' ('album art disabled: ' + $_.Exception.Message)
        }
        $script:mgr = Await-Op ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]) 5000
        if ($null -eq $script:mgr) { throw 'media session manager unavailable' }
        $script:mediaOk = $true
        Status 'media' $true 'ok'
    } catch {
        Status 'media' $false $_.Exception.Message
    }
}

function Get-BestSession {
    $current = $script:mgr.GetCurrentSession()
    try {
        if ($null -ne $current) {
            $st = [int]$current.GetPlaybackInfo().PlaybackStatus
            if ($st -eq 4) { return $current }
        }
        foreach ($s in $script:mgr.GetSessions()) {
            if ([int]$s.GetPlaybackInfo().PlaybackStatus -eq 4) { return $s }
        }
    } catch {}
    return $current
}

function Read-Thumbnail($thumbRef) {
    if ($null -eq $thumbRef) { return $null }
    $stream = Await-Op ($thumbRef.OpenReadAsync()) ([Windows.Storage.Streams.IRandomAccessStreamWithContentType]) 2000
    if ($null -eq $stream) { return $null }
    try {
        $size = [uint32]$stream.Size
        if ($size -le 0 -or $size -gt 8MB) { return $null }
        $bytes = $null
        try {
            $net = [System.IO.WindowsRuntimeStreamExtensions]::AsStreamForRead($stream)
            $ms = New-Object System.IO.MemoryStream
            $net.CopyTo($ms)
            $bytes = $ms.ToArray()
        } catch {
            $reader = New-Object Windows.Storage.Streams.DataReader ($stream.GetInputStreamAt(0))
            $loaded = Await-Op ($reader.LoadAsync($size)) ([uint32]) 2000
            if ($loaded -gt 0) {
                $bytes = New-Object byte[] $loaded
                $reader.ReadBytes($bytes)
            }
        }
        if ($null -eq $bytes -or $bytes.Length -eq 0) { return $null }
        $mime = 'image/jpeg'
        try { if ($stream.ContentType) { $mime = $stream.ContentType } } catch {}
        if ($bytes.Length -gt 3 -and $bytes[0] -eq 0x89 -and $bytes[1] -eq 0x50) { $mime = 'image/png' }
        return ('data:' + $mime + ';base64,' + [Convert]::ToBase64String($bytes))
    } finally {
        try { $stream.Dispose() } catch {}
    }
}

function Poll-Media([bool]$force = $false) {
    $s = Get-BestSession
    $now = $script:sw.ElapsedMilliseconds
    if ($null -eq $s) {
        if ($script:lastKey -ne 'none' -or $force) {
            $script:lastKey = 'none'
            $script:lastArtKey = ''
            Emit '{"type":"media","present":false}'
        }
        return
    }
    $props = Await-Op ($s.TryGetMediaPropertiesAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties]) 1500
    $info = $s.GetPlaybackInfo()
    $tl = $s.GetTimelineProperties()
    $title = ''; $artist = ''; $album = ''; $kind = ''
    if ($null -ne $props) {
        $title = [string]$props.Title; $artist = [string]$props.Artist; $album = [string]$props.AlbumTitle
        if (-not $artist) { $artist = [string]$props.AlbumArtist }
        # Music / Video / Image (subtitles are offered for videos)
        try { if ($null -ne $props.PlaybackType) { $kind = ([string]$props.PlaybackType).ToLowerInvariant() } } catch {}
    }
    $status = [int]$info.PlaybackStatus
    $statusName = switch ($status) { 4 { 'playing' } 5 { 'paused' } 3 { 'stopped' } 2 { 'changing' } 1 { 'opened' } default { 'closed' } }
    $c = $info.Controls
    $source = [string]$s.SourceAppUserModelId

    $durSec = 0.0; $posSec = 0.0
    try {
        $durSec = ($tl.EndTime - $tl.StartTime).TotalSeconds
        $posSec = ($tl.Position - $tl.StartTime).TotalSeconds
        if ($status -eq 4 -and $tl.LastUpdatedTime.Year -gt 2000) {
            $elapsed = ([DateTimeOffset]::Now - $tl.LastUpdatedTime).TotalSeconds
            if ($elapsed -gt 0 -and $elapsed -lt 36000) { $posSec += $elapsed }
        }
        if ($durSec -gt 0 -and $posSec -gt $durSec) { $posSec = $durSec }
        if ($posSec -lt 0) { $posSec = 0 }
    } catch {}

    $key = "$title|$artist|$album|$status|$source|$($c.IsNextEnabled)|$($c.IsPreviousEnabled)|$([math]::Round($durSec))"
    $artKey = "$title|$artist|$album|$source"
    $needArt = ($artKey -ne $script:lastArtKey) -or ($script:artTries -gt 0 -and $script:artTries -lt 6)
    # position jumps (seek) or heartbeat every 5s keep the renderer's interpolation honest
    $expected = $script:lastPosSec
    if ($status -eq 4 -and $script:lastPosSec -ge 0) { $expected = $script:lastPosSec + (($now - $script:lastEmitMs) / 1000.0) }
    $jump = [math]::Abs($posSec - $expected) -gt 2.5
    if (-not $force -and -not $needArt -and $key -eq $script:lastKey -and -not $jump -and ($now - $script:lastEmitMs) -lt 5000) { return }

    $obj = [ordered]@{
        type      = 'media'
        present   = $true
        title     = $title
        artist    = $artist
        album     = $album
        status    = $statusName
        source    = $source
        position  = [math]::Round($posSec, 2)
        duration  = [math]::Round($durSec, 2)
        canPlay   = [bool]$c.IsPlayEnabled
        canPause  = [bool]$c.IsPauseEnabled
        canNext   = [bool]$c.IsNextEnabled
        canPrev   = [bool]$c.IsPreviousEnabled
        canSeek   = [bool]$c.IsPlaybackPositionEnabled
        artKey    = $artKey
        kind      = $kind
    }
    if ($needArt -and $null -ne $props -and $script:artOk) {
        $art = $null
        try { $art = Read-Thumbnail $props.Thumbnail } catch { Log 'warn' ("thumbnail: " + $_.Exception.Message) }
        if ($artKey -ne $script:lastArtKey) { $script:artTries = 0 }
        $script:lastArtKey = $artKey
        if ($null -ne $art) { $obj.art = $art; $script:artTries = 0 }
        else {
            if ($script:artTries -eq 0) { $obj.art = $null }
            $script:artTries++
        }
        if ($script:artTries -ge 6) { $script:artTries = 0 }
    }
    $script:lastKey = $key
    $script:lastEmitMs = $now
    $script:lastPosSec = $posSec
    Emit (ToJson $obj)
}

function Invoke-MediaCommand([string]$name, [string[]]$p) {
    if (-not $script:mediaOk) { return }
    $s = Get-BestSession
    if ($null -eq $s) { return }
    switch ($name) {
        'media.toggle' { $null = Await-Op ($s.TryTogglePlayPauseAsync()) ([bool]) }
        'media.play'   { $null = Await-Op ($s.TryPlayAsync()) ([bool]) }
        'media.pause'  { $null = Await-Op ($s.TryPauseAsync()) ([bool]) }
        'media.next'   { $null = Await-Op ($s.TrySkipNextAsync()) ([bool]) }
        'media.prev'   { $null = Await-Op ($s.TrySkipPreviousAsync()) ([bool]) }
        'media.seek'   {
            $sec = 0.0
            [double]::TryParse($p[1], [System.Globalization.NumberStyles]::Float, [System.Globalization.CultureInfo]::InvariantCulture, [ref]$sec) | Out-Null
            $ticks = [long]($sec * 10000000)
            $null = Await-Op ($s.TryChangePlaybackPositionAsync($ticks)) ([bool])
        }
    }
    Start-Sleep -Milliseconds 120
    Poll-Media $true
}

function Handle-Command([string[]]$p) {
    $name = $p[0]
    try {
        if ($name.StartsWith('media.')) {
            if ($name -eq 'media.refresh') { if ($script:mediaOk) { $script:lastArtKey = ''; Poll-Media $true } }
            else { Invoke-MediaCommand $name $p }
        } elseif ($name.StartsWith('uia.')) {
            $id = ''; if ($p.Length -gt 1) { $id = $p[1] }
            if (-not $script:uiaOk) {
                Emit ('{"type":"uia","id":' + (ToJson $id) + ',"ok":false,"detail":"UI Automation unavailable"}')
                return
            }
            $a2 = ''; $a3 = ''
            if ($p.Length -gt 2) { $a2 = $p[2] }
            if ($p.Length -gt 3) { $a3 = $p[3] }
            if ($name -eq 'uia.invoke') { [IslandUia.Uia]::InvokeAsync($id, $a2, $a3) }
            elseif ($name -eq 'uia.reply') { [IslandUia.Uia]::ReplyAsync($id, $a2, $a3) }
        } elseif ($name.StartsWith('game.')) {
            if ($script:gameOk) { [IslandGame.Game]::Command([string[]]$p) }
            else { Emit '{"type":"game.unavailable"}' }
        } elseif ($name -eq 'exit') {
            exit 0
        }
    } catch {
        Log 'error' ("command $name failed: " + $_.Exception.Message)
    }
}

Init-Media
Emit '{"type":"ready"}'

# ---------------------------------------------------------------- main loop
$nextMedia = 0
while ($true) {
    $cmd = [IslandNative.Cmd]::NextPs()
    while ($null -ne $cmd) {
        Handle-Command $cmd
        $cmd = [IslandNative.Cmd]::NextPs()
    }
    $now = $script:sw.ElapsedMilliseconds
    if ($script:mediaOk -and $now -ge $nextMedia) {
        $nextMedia = $now + 650
        try { Poll-Media } catch {
            Log 'warn' ("media poll: " + $_.Exception.Message)
            $nextMedia = $now + 3000
        }
    }
    Start-Sleep -Milliseconds 35
}
