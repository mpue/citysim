# CitySim Deployment Script für Windows PowerShell

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║           🏙️  CitySim Deployment Script                       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Pfade
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ServerDir = Join-Path $ProjectDir "server"
$DataDir = Join-Path $ServerDir "data"

Write-Host "📁 Projekt-Verzeichnis: $ProjectDir" -ForegroundColor White
Write-Host ""

# Node.js Version prüfen
Write-Host "🔍 Prüfe Node.js Installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node -v
    Write-Host "✓ Node.js gefunden: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js ist nicht installiert!" -ForegroundColor Red
    Write-Host "   Bitte installiere Node.js 18 oder höher:" -ForegroundColor Red
    Write-Host "   https://nodejs.org/" -ForegroundColor White
    exit 1
}

# npm Version prüfen
try {
    $npmVersion = npm -v
    Write-Host "✓ npm gefunden: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm ist nicht installiert!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Dependencies installieren
Write-Host "📦 Installiere Dependencies..." -ForegroundColor Yellow
Write-Host "   → Frontend Dependencies" -ForegroundColor White
Set-Location $ProjectDir
try {
    npm install
    Write-Host "   ✓ Frontend Dependencies installiert" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Frontend Dependencies Installation fehlgeschlagen" -ForegroundColor Red
    exit 1
}

Write-Host "   → Backend Dependencies" -ForegroundColor White
Set-Location $ServerDir
try {
    npm install
    Write-Host "   ✓ Backend Dependencies installiert" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Backend Dependencies Installation fehlgeschlagen" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Frontend Build
Write-Host "🔨 Baue Frontend..." -ForegroundColor Yellow
Set-Location $ProjectDir
try {
    npm run build
    Write-Host "✓ Frontend gebaut" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend Build fehlgeschlagen" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Datenbank-Verzeichnis erstellen
Write-Host "💾 Richte Datenbank ein..." -ForegroundColor Yellow
if (-not (Test-Path $DataDir)) {
    New-Item -ItemType Directory -Path $DataDir -Force | Out-Null
}

# Datenbank initialisieren (nur wenn nicht vorhanden)
$DbPath = Join-Path $DataDir "citysim.json"
if (-not (Test-Path $DbPath)) {
    Write-Host "   → Erstelle neue Datenbank" -ForegroundColor White
    Set-Location $ServerDir
    try {
        npm run init-db
        Write-Host "✓ Datenbank initialisiert" -ForegroundColor Green
        Write-Host ""
        Write-Host "📝 Standard-Admin-Zugang:" -ForegroundColor Yellow
        Write-Host "   Username: admin" -ForegroundColor White
        Write-Host "   Password: admin123" -ForegroundColor White
        Write-Host "   WICHTIG: Passwort nach erstem Login ändern!" -ForegroundColor Red
    } catch {
        Write-Host "⚠ Datenbank-Initialisierung übersprungen" -ForegroundColor Yellow
    }
} else {
    Write-Host "✓ Datenbank existiert bereits" -ForegroundColor Green
}
Write-Host ""

# Umgebungsvariablen prüfen
Write-Host "🔍 Prüfe Umgebungsvariablen..." -ForegroundColor Yellow
if (-not $env:SESSION_SECRET) {
    Write-Host "⚠ SESSION_SECRET nicht gesetzt!" -ForegroundColor Yellow
    Write-Host "   Generiere zufälliges Secret..." -ForegroundColor White
    $newSecret = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    Write-Host ""
    Write-Host "   Setze die Umgebungsvariable:" -ForegroundColor White
    Write-Host "   `$env:SESSION_SECRET=`"$newSecret`"" -ForegroundColor Green
    Write-Host ""
    Write-Host "   Oder für permanent (als Administrator):" -ForegroundColor White
    Write-Host "   [System.Environment]::SetEnvironmentVariable('SESSION_SECRET','$newSecret','Machine')" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "✓ SESSION_SECRET ist gesetzt" -ForegroundColor Green
}

if (-not $env:PORT) {
    Write-Host "⚠ PORT nicht gesetzt, verwende Standard: 3000" -ForegroundColor Yellow
} else {
    Write-Host "✓ PORT ist gesetzt: $env:PORT" -ForegroundColor Green
}

if (-not $env:NODE_ENV) {
    Write-Host "⚠ NODE_ENV nicht gesetzt, verwende Standard: production" -ForegroundColor Yellow
} else {
    Write-Host "✓ NODE_ENV ist gesetzt: $env:NODE_ENV" -ForegroundColor Green
}
Write-Host ""

# Firewall-Regel prüfen
Write-Host "🔥 Prüfe Firewall..." -ForegroundColor Yellow
try {
    $firewallRule = Get-NetFirewallRule -DisplayName "CitySim Backend" -ErrorAction SilentlyContinue
    if ($firewallRule) {
        Write-Host "✓ Firewall-Regel existiert bereits" -ForegroundColor Green
    } else {
        Write-Host "⚠ Firewall-Regel nicht gefunden" -ForegroundColor Yellow
        Write-Host "   Erstelle Firewall-Regel (benötigt Administrator-Rechte)..." -ForegroundColor White
        Write-Host ""
        Write-Host "   Als Administrator ausführen:" -ForegroundColor White
        Write-Host "   New-NetFirewallRule -DisplayName 'CitySim Backend' -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow" -ForegroundColor Green
        Write-Host ""
    }
} catch {
    Write-Host "⚠ Firewall-Status konnte nicht geprüft werden" -ForegroundColor Yellow
}
Write-Host ""

# Deployment erfolgreich
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              Deployment erfolgreich abgeschlossen! ✓           ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Server starten:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Option 1: Direkt starten" -ForegroundColor White
Write-Host "   PS> cd server" -ForegroundColor Yellow
Write-Host "   PS> node server.js" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Option 2: Mit PM2 (empfohlen)" -ForegroundColor White
Write-Host "   PS> npm install -g pm2" -ForegroundColor Yellow
Write-Host "   PS> pm2 start ecosystem.config.js" -ForegroundColor Yellow
Write-Host "   PS> pm2 save" -ForegroundColor Yellow
Write-Host "   PS> pm2 startup" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Option 3: Als Windows Service (benötigt node-windows)" -ForegroundColor White
Write-Host "   PS> npm install -g node-windows" -ForegroundColor Yellow
Write-Host "   PS> cd server" -ForegroundColor Yellow
Write-Host "   PS> node install-service.js" -ForegroundColor Yellow
Write-Host ""
Write-Host "📝 Weitere Informationen: DEPLOYMENT.md" -ForegroundColor White
Write-Host ""

# Zurück zum Projekt-Verzeichnis
Set-Location $ProjectDir
