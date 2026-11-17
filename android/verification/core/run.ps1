param([switch]$DiscoveryOnly)
$ErrorActionPreference = 'Stop'
$project = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$jdkBin = 'C:\Program Files\Android\Android Studio\jbr\bin'
if ($env:JAVA_HOME) { $jdkBin = Join-Path $env:JAVA_HOME 'bin' }
$classes = Join-Path $PSScriptRoot 'classes'
New-Item -ItemType Directory -Force -Path $classes | Out-Null
$sources = @((Get-ChildItem (Join-Path $project 'app\src\main\java\com\saeedsh\islandlink\core\*.java')).FullName)
$sources += Join-Path $PSScriptRoot 'CoreRegression.java'
$sources += Join-Path $PSScriptRoot 'SecurityRegression.java'
& (Join-Path $jdkBin 'javac.exe') -d $classes @sources
if ($LASTEXITCODE -ne 0) { throw 'Protocol test compilation failed' }
$testArguments = @($PSScriptRoot)
if ($DiscoveryOnly) { $testArguments += 'discovery' }
& (Join-Path $jdkBin 'java.exe') -cp $classes com.saeedsh.islandlink.core.CoreRegression @testArguments
if ($LASTEXITCODE -ne 0) { throw 'Protocol tests failed' }
if (-not $DiscoveryOnly) {
    $policyRuntime = Join-Path $PSScriptRoot ('runtime\policy-' + [guid]::NewGuid().ToString())
    & (Join-Path $jdkBin 'java.exe') -cp $classes com.saeedsh.islandlink.core.SecurityRegression $policyRuntime
    if ($LASTEXITCODE -ne 0) { throw 'Security/policy tests failed' }
}
