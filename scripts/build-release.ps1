# One-click release APK build + update.json generation.
# Usage (from project root):  .\scripts\build-release.ps1
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$Android = Join-Path $Root "android"

# ---- edit these on each release ----
$versionName = "1.0"
$versionCode = 1
# GitHub user/repo for APK releases
$githubUser = "lemonteen0520"
$githubRepo = "bubei-riyu"
# Public download URL for the APK (GitHub Releases direct link)
$apkBaseUrl = "https://github.com/$githubUser/$githubRepo/releases/download/v$versionName"
# ----------------------------------

$env:ANDROID_HOME = "C:\Users\86137\AppData\Local\Android\Sdk"
$env:ANDROID_SDK_ROOT = "C:\Users\86137\AppData\Local\Android\Sdk"

Write-Host "Building release APK ..."
Push-Location $Android
& .\gradlew.bat assembleRelease --no-daemon
if ($LASTEXITCODE -ne 0) { throw "Gradle build failed" }
Pop-Location

$apk = Get-ChildItem "$Android\app\build\outputs\apk\release\*.apk" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $apk) { throw "release APK not found" }

$sha = (Get-FileHash -Algorithm SHA256 $apk.FullName).Hash.ToLower()
$apkName = "bubei-riyu-v${versionName}.apk"

$update = [ordered]@{
    version      = $versionName
    versionCode  = $versionCode
    apkUrl       = "$apkBaseUrl/$apkName"
    sha256       = $sha
    notes        = "Version $versionName"
}

$updatePath = Join-Path $Root "release-update.json"
$update | ConvertTo-Json | Set-Content -Path $updatePath -Encoding UTF8

Write-Host ""
Write-Host "APK     : $($apk.FullName)" -ForegroundColor Green
Write-Host "Size    : $([math]::Round($apk.Length/1MB, 2)) MB"
Write-Host "SHA256  : $sha"
Write-Host "Manifest: $updatePath"
Write-Host ""
Write-Host "To publish: rename APK to $apkName, upload it and release-update.json to $apkBaseUrl" -ForegroundColor Yellow
