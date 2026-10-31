$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $PSScriptRoot
$python = 'C:\Users\Apex\AppData\Local\Programs\Python\Python313\python.exe'
& $python "$PSScriptRoot\build_android_windows.py" --project $project --sdk "$env:LOCALAPPDATA\Android\Sdk" --java-home 'C:\Users\Apex\Java21\jdk-21.0.13+9'
if ($LASTEXITCODE -ne 0) { throw 'Android build failed.' }
Write-Host 'Unsigned APK ready. Run tools\sign_kavian.ps1 in a local PowerShell window to sign.'
