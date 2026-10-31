param([switch]$NewKey)
$ErrorActionPreference = 'Stop'
$project = 'F:\case47-android'
$java = 'C:\Users\Apex\Java21\jdk-21.0.13+9\bin\java.exe'
$tools = 'C:\Users\Apex\AppData\Local\Android\Sdk\build-tools\35.0.0'
$inputApk = Join-Path $project 'dist\Kavian-0.5.3-unsigned.apk'
$outputApk = Join-Path $project 'dist\Kavian-0.5.3-release.apk'
try {
    if (-not (Test-Path -LiteralPath $inputApk)) { throw 'Unsigned APK is missing.' }
    $modeArgs = @()
    if ($NewKey) {
        if (-not $env:OneDrive) { throw 'OneDrive path is not configured.' }
        $keyPath = Join-Path $env:OneDrive ('KavianSigning\kavian-release-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.jks')
        $modeArgs = @('--new-key')
        Write-Host "NEW key destination: $keyPath"
    } else {
        Add-Type -AssemblyName System.Windows.Forms
        $dialog = New-Object System.Windows.Forms.OpenFileDialog
        $dialog.Title = 'Select your existing kavian-release.jks (never uploaded)'
        $dialog.Filter = 'Signing keystore (*.jks;*.keystore)|*.jks;*.keystore'
        if ($env:OneDrive) { $dialog.InitialDirectory = $env:OneDrive }
        if ($dialog.ShowDialog() -ne 'OK') { throw 'Signing cancelled.' }
        $keyPath = $dialog.FileName
    }
    Write-Host 'Enter the keystore password in the separate local password window. Input is hidden.'
    Write-Host 'No password is saved. Do not paste passwords into chat.'
    # Java's Windows launcher can corrupt non-ASCII command-line paths.
    # Pass only ASCII and decode the path inside Java; never copy the key.
    $encodedKeyPath = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($keyPath))
    & $java -cp "$tools\lib\apksigner.jar" "$PSScriptRoot\KavianSigner.java" $encodedKeyPath $inputApk $outputApk @modeArgs
    if ($LASTEXITCODE -ne 0) { throw 'Signing failed.' }
    $verification = & $java -jar "$tools\lib\apksigner.jar" verify --verbose --print-certs $outputApk 2>&1
    if ($LASTEXITCODE -ne 0) { throw 'Signature verification failed.' }
    $verification | Set-Content -LiteralPath (Join-Path $project 'dist\release-verification.txt') -Encoding UTF8
    & "$tools\zipalign.exe" -c 4 $outputApk
    if ($LASTEXITCODE -ne 0) { throw 'APK alignment verification failed.' }
    $hashAlgorithm = [Security.Cryptography.SHA256]::Create()
    $apkStream = [IO.File]::OpenRead($outputApk)
    try {
        $hash = [BitConverter]::ToString($hashAlgorithm.ComputeHash($apkStream)).Replace('-','').ToLowerInvariant()
    } finally {
        $apkStream.Dispose()
        $hashAlgorithm.Dispose()
    }
    "$hash  Kavian-0.5.3-release.apk" | Set-Content -LiteralPath (Join-Path $project 'dist\Kavian-0.5.3-release.sha256') -Encoding ASCII
    $keyPath | Set-Content -LiteralPath (Join-Path $project 'dist\release-key-location.txt') -Encoding UTF8
    Write-Host "Signed and verified: $outputApk" -ForegroundColor Green
} catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
}
Read-Host 'Press Enter to close'
