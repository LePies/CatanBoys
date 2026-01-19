# Convert markdown files to HTML using pandoc

$srcDir = Join-Path $PSScriptRoot "src"
$siteDir = Join-Path $PSScriptRoot "site"
$cssDir = Join-Path $PSScriptRoot "css"

# Ensure site directory exists
if (!(Test-Path $siteDir)) {
    New-Item -ItemType Directory -Path $siteDir | Out-Null
}

# Common pandoc options for mobile-friendly standalone HTML (using custom template)
$templatePath = Join-Path $PSScriptRoot "template.html"
$commonArgs = @(
    "--standalone",
    "--template=$templatePath",
    "--metadata=pagetitle:Catan Leaderboard"
)

# Convert main.md to index.html (in root) - uses styles.css
pandoc "$srcDir\main.md" @commonArgs --css="css/styles.css" -o "$PSScriptRoot\index.html"
Write-Host "Converted src/main.md -> index.html"

# Convert caravan.md - uses caravan-styles.css
pandoc "$srcDir\caravan.md" @commonArgs --metadata=pagetitle:Caravan --css="../css/caravan-styles.css" -o "$siteDir\caravan.html"
Write-Host "Converted src/caravan.md -> site/caravan.html"

# Convert standard.md - uses styles.css
pandoc "$srcDir\standard.md" @commonArgs --metadata=pagetitle:Standard --css="../css/styles.css" -o "$siteDir\standard.html"
Write-Host "Converted src/standard.md -> site/standard.html"

Write-Host "`nAll files converted successfully!"
Write-Host "Open index.html to view the leaderboard."