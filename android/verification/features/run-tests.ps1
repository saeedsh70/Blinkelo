$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$javaBin = 'C:\Program Files\Android\Android Studio\jbr\bin'
if ($env:JAVA_HOME -and (Test-Path (Join-Path $env:JAVA_HOME 'bin\javac.exe'))) { $javaBin = Join-Path $env:JAVA_HOME 'bin' }
$output = Join-Path $PSScriptRoot 'build\classes'
New-Item -ItemType Directory -Force -Path $output | Out-Null
$sources = @(Get-ChildItem -LiteralPath (Join-Path $PSScriptRoot 'stubs') -Filter '*.java' -Recurse | ForEach-Object FullName)
$sources += Join-Path $PSScriptRoot 'FeatureRegressionTest.java'
foreach ($relative in @('core\Json.java','core\Packet.java','Tasks.java','Timers.java','UiBus.java')) {
    $sources += Join-Path $projectRoot ('app\src\main\java\com\saeedsh\islandlink\' + $relative)
}
& (Join-Path $javaBin 'javac.exe') -encoding UTF-8 -d $output @sources
if ($LASTEXITCODE -ne 0) { throw 'Feature regression compilation failed' }
& (Join-Path $javaBin 'java.exe') -cp $output com.saeedsh.islandlink.FeatureRegressionTest
if ($LASTEXITCODE -ne 0) { throw 'Feature regression tests failed' }
