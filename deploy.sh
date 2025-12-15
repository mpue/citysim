#!/bin/bash
# CitySim Deployment Script für Linux

set -e  # Bei Fehler abbrechen

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║           🏙️  CitySim Deployment Script                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Pfade
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$PROJECT_DIR/server"
DATA_DIR="$SERVER_DIR/data"

echo "📁 Projekt-Verzeichnis: $PROJECT_DIR"
echo ""

# Node.js Version prüfen
echo "🔍 Prüfe Node.js Installation..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js ist nicht installiert!${NC}"
    echo "   Bitte installiere Node.js 18 oder höher:"
    echo "   https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✓${NC} Node.js gefunden: $NODE_VERSION"

# npm Version prüfen
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm ist nicht installiert!${NC}"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo -e "${GREEN}✓${NC} npm gefunden: v$NPM_VERSION"
echo ""

# Dependencies installieren
echo "📦 Installiere Dependencies..."
echo "   → Frontend Dependencies"
cd "$PROJECT_DIR"
npm install || { echo -e "${RED}❌ Frontend Dependencies Installation fehlgeschlagen${NC}"; exit 1; }

echo "   → Backend Dependencies"
cd "$SERVER_DIR"
npm install || { echo -e "${RED}❌ Backend Dependencies Installation fehlgeschlagen${NC}"; exit 1; }

echo -e "${GREEN}✓${NC} Dependencies installiert"
echo ""

# Frontend Build
echo "🔨 Baue Frontend..."
cd "$PROJECT_DIR"
npm run build || { echo -e "${RED}❌ Frontend Build fehlgeschlagen${NC}"; exit 1; }
echo -e "${GREEN}✓${NC} Frontend gebaut"
echo ""

# Datenbank-Verzeichnis erstellen
echo "💾 Richte Datenbank ein..."
mkdir -p "$DATA_DIR"

# Datenbank initialisieren (nur wenn nicht vorhanden)
if [ ! -f "$DATA_DIR/citysim.json" ]; then
    echo "   → Erstelle neue Datenbank"
    cd "$SERVER_DIR"
    npm run init-db || { echo -e "${YELLOW}⚠ Datenbank-Initialisierung übersprungen${NC}"; }
    echo -e "${GREEN}✓${NC} Datenbank initialisiert"
    echo ""
    echo -e "${YELLOW}📝 Standard-Admin-Zugang:${NC}"
    echo "   Username: admin"
    echo "   Password: admin123"
    echo "   ${RED}WICHTIG: Passwort nach erstem Login ändern!${NC}"
else
    echo -e "${GREEN}✓${NC} Datenbank existiert bereits"
fi
echo ""

# Berechtigungen setzen
echo "🔐 Setze Berechtigungen..."
chmod -R 755 "$PROJECT_DIR"
chmod -R 775 "$DATA_DIR"
echo -e "${GREEN}✓${NC} Berechtigungen gesetzt"
echo ""

# Umgebungsvariablen prüfen
echo "🔍 Prüfe Umgebungsvariablen..."
if [ -z "$SESSION_SECRET" ]; then
    echo -e "${YELLOW}⚠ SESSION_SECRET nicht gesetzt!${NC}"
    echo "   Generiere zufälliges Secret..."
    NEW_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    echo ""
    echo "   Füge folgende Zeile zu ~/.bashrc oder /etc/environment hinzu:"
    echo -e "   ${GREEN}export SESSION_SECRET=\"$NEW_SECRET\"${NC}"
    echo ""
    echo "   Oder setze temporär:"
    echo -e "   ${GREEN}export SESSION_SECRET=\"$NEW_SECRET\"${NC}"
    echo ""
else
    echo -e "${GREEN}✓${NC} SESSION_SECRET ist gesetzt"
fi

if [ -z "$PORT" ]; then
    echo -e "${YELLOW}⚠ PORT nicht gesetzt, verwende Standard: 3000${NC}"
else
    echo -e "${GREEN}✓${NC} PORT ist gesetzt: $PORT"
fi

if [ -z "$NODE_ENV" ]; then
    echo -e "${YELLOW}⚠ NODE_ENV nicht gesetzt, verwende Standard: production${NC}"
else
    echo -e "${GREEN}✓${NC} NODE_ENV ist gesetzt: $NODE_ENV"
fi
echo ""

# Deployment-Optionen
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║              Deployment erfolgreich abgeschlossen! ✓           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "🚀 Server starten:"
echo ""
echo "   Option 1: Direkt starten"
echo "   $ cd server && node server.js"
echo ""
echo "   Option 2: Mit PM2 (empfohlen)"
echo "   $ npm install -g pm2"
echo "   $ pm2 start ecosystem.config.js"
echo "   $ pm2 save"
echo "   $ pm2 startup"
echo ""
echo "   Option 3: Als systemd Service"
echo "   $ sudo cp citysim.service /etc/systemd/system/"
echo "   $ sudo systemctl enable citysim"
echo "   $ sudo systemctl start citysim"
echo ""
echo "📝 Weitere Informationen: DEPLOYMENT.md"
echo ""
