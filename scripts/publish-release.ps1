# One-command publish: build release APK, create GitHub Release, upload APK, push update.json.
# Usage (from project root):  .\scripts\publish-release.ps1 -versionName "1.0" -versionCode 1 -notes "Release notes"
param(
  [string]$versionName = "1.0",
  [int]$versionCode = 1,
  [string]$notes = "Version 1.0"
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$githubUser = "lemonteen0520"
$githubRepo = "bubei-riyu"
$tag = "v$versionName"

$env:ANDROID_HOME = "C:\Users\86137\AppData\Local\Android\Sdk"
$env:ANDROID_SDK_ROOT = "C:\Users\86137\AppData\Local\Android\Sdk"

Write-Host "1/4 Building release APK ..."
Push-Location (Join-Path $Root "android")
& .\gradlew.bat assembleRelease --no-daemon
if ($LASTEXITCODE -ne 0) { throw "Gradle build failed" }
Pop-Location

$apk = Get-ChildItem "$Root\android\app\build\outputs\apk\release\*.apk" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $apk) { throw "release APK not found" }

$apkName = "bubei-riyu-v${versionName}.apk"
$apkDest = Join-Path $Root $apkName
Copy-Item $apk.FullName $apkDest -Force

$sha = (Get-FileHash -Algorithm SHA256 $apk.FullName).Hash.ToLower()
$apkUrl = "https://github.com/$githubUser/$githubRepo/releases/download/$tag/$apkName"

$update = [ordered]@{
  version      = $versionName
  versionCode  = $versionCode
  apkUrl       = $apkUrl
  sha256       = $sha
  notes        = $notes
}
$update | ConvertTo-Json | Set-Content -Path (Join-Path $Root "release-update.json") -Encoding UTF8

Write-Host "2/4 Creating GitHub Release $tag ..."
gh release create $tag $apkDest --title $tag --notes $notes --repo "$githubUser/$githubRepo"
if ($LASTEXITCODE -ne 0) { throw "gh release create failed (run 'gh auth login' first)" }

Write-Host "3/4 Committing and pushing release-update.json ..."
Push-Location $Root
git add release-update.json
git -c user.email="lemonteen0520@users.noreply.github.com" -c user.name="lemonteen0520" commit -m "release $versionName" --allow-empty
git push origin main
Pop-Location

Write-Host "4/4 Done."
Write-Host "APK     : $apkDest"
Write-Host "SHA256  : $sha"
Write-Host "Update  : https://raw.githubusercontent.com/$githubUser/$githubRepo/main/release-update.json"
