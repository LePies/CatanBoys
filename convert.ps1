# Convert markdown files to HTML using pandoc

$rootDir = Join-Path $PSScriptRoot "root"

# Ensure root directory exists
if (!(Test-Path $rootDir)) {
    New-Item -ItemType Directory -Path $rootDir | Out-Null
}

# Convert main.md to index.html
pandoc "$PSScriptRoot\main.md" -o "$rootDir\..\index.html"
Write-Host "Converted main.md -> index.html"

# Convert caravan.md
pandoc "$PSScriptRoot\caravan.md" -o "$rootDir\caravan.html"
Write-Host "Converted caravan.md -> root/caravan.html"

# Convert standard.md
pandoc "$PSScriptRoot\standard.md" -o "$rootDir\standard.html"
Write-Host "Converted standard.md -> root/standard.html"

Write-Host "`nAll files converted successfully!"
