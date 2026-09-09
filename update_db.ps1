$ErrorActionPreference = "Stop"

# Set default password from source code
$env:PGPASSWORD = "admin"

Write-Host "1. Preparing seed data..."
$seedFile = "database\seed_data.sql"
$mergedFile = "database\seed_data_merged.sql"

# Always start with a fresh copy of the base seed data
Copy-Item $seedFile $mergedFile -Force

if (Test-Path "database\seed_data_legacy.sql") {
    Get-Content "database\seed_data_legacy.sql" | Out-File -Append $mergedFile -Encoding UTF8
    Write-Host "   Legacy data merged into temporary file."
} else {
    Write-Warning "   Legacy data file not found."
}

Write-Host "2. Locating psql.exe..."
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
if (-not $psqlPath) {
    $postgresRoot = "C:\Program Files\PostgreSQL"
    if (Test-Path $postgresRoot) {
        $versions = Get-ChildItem $postgresRoot | Sort-Object Name -Descending
        foreach ($ver in $versions) {
            $testPath = Join-Path $ver.FullName "bin\psql.exe"
            if (Test-Path $testPath) {
                $psqlPath = $testPath
                break
            }
        }
    }
}

if (-not $psqlPath) {
    Write-Error "psql.exe not found! Please ensure PostgreSQL is installed and in PATH."
    exit 1
}
Write-Host "   Found psql at: $psqlPath"

# Use DB name from source code
$dbName = "ecucontabledb"
$user = "postgres"

Write-Host "3. Running Migration..."
& $psqlPath -h localhost -p 5435 -U $user -d $dbName -f "database\migrations\01_rbac_refactor.sql"
if ($LASTEXITCODE -eq 0) { Write-Host "   Migration Success." -ForegroundColor Green }
else { Write-Error "   Migration Failed." }

Write-Host "4. Running Seed Data..."
& $psqlPath -h localhost -p 5435 -U $user -d $dbName -f $mergedFile
if ($LASTEXITCODE -eq 0) { Write-Host "   Seed Success." -ForegroundColor Green }
else { Write-Error "   Seed Failed." }

# Cleanup
if (Test-Path $mergedFile) {
    Remove-Item $mergedFile
}
