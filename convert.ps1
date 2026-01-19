# Convert markdown files to HTML using pandoc

$srcDir = Join-Path $PSScriptRoot "src"
$siteDir = Join-Path $PSScriptRoot "site"

# Ensure site directory exists
if (!(Test-Path $siteDir)) {
    New-Item -ItemType Directory -Path $siteDir | Out-Null
}

# Convert main.md to index.html (in root)
pandoc "$srcDir\main.md" -o "$PSScriptRoot\index.html"
Write-Host "Converted src/main.md -> index.html"

# Convert caravan.md
pandoc "$srcDir\caravan.md" -o "$siteDir\caravan.html"
Write-Host "Converted src/caravan.md -> site/caravan.html"

# Convert standard.md
pandoc "$srcDir\standard.md" -o "$siteDir\standard.html"
Write-Host "Converted src/standard.md -> site/standard.html"

Write-Host "`nAll files converted successfully!"
Write-Host "Open site/index.html to view the leaderboard."
