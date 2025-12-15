#!/bin/bash
# CitySim - Docker Fix Script für "ContainerConfig" Fehler

echo "🔧 CitySim Docker Cleanup & Rebuild"
echo "===================================="
echo ""

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Prüfe ob Docker läuft
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker läuft nicht oder keine Berechtigung${NC}"
    echo "   Versuche: sudo docker info"
    exit 1
fi

echo -e "${YELLOW}⚠ Dies wird alle CitySim Container und Images entfernen!${NC}"
echo ""
read -p "Fortfahren? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Abgebrochen."
    exit 0
fi

echo ""
echo "📦 Schritt 1: Container stoppen..."
sudo docker-compose down 2>/dev/null || docker compose down 2>/dev/null || echo "Keine laufenden Container"

echo ""
echo "🗑️  Schritt 2: Container entfernen..."
CONTAINERS=$(sudo docker ps -a | grep citysim | awk '{print $1}')
if [ -n "$CONTAINERS" ]; then
    echo "$CONTAINERS" | xargs sudo docker rm -f
    echo -e "${GREEN}✓${NC} Container entfernt"
else
    echo "Keine CitySim Container gefunden"
fi

echo ""
echo "🖼️  Schritt 3: Images entfernen..."
IMAGES=$(sudo docker images | grep citysim | awk '{print $3}')
if [ -n "$IMAGES" ]; then
    echo "$IMAGES" | xargs sudo docker rmi -f
    echo -e "${GREEN}✓${NC} Images entfernt"
else
    echo "Keine CitySim Images gefunden"
fi

echo ""
echo "🧹 Schritt 4: Build-Cache leeren..."
sudo docker builder prune -f
echo -e "${GREEN}✓${NC} Cache geleert"

echo ""
echo "🔨 Schritt 5: Neu bauen..."
if command -v docker-compose &> /dev/null; then
    # Alte Version
    sudo docker-compose build --no-cache
    BUILD_EXIT=$?
elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
    # Neue Version (V2)
    docker compose build --no-cache
    BUILD_EXIT=$?
else
    echo -e "${RED}❌ Weder docker-compose noch docker compose gefunden${NC}"
    exit 1
fi

if [ $BUILD_EXIT -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Build erfolgreich"
else
    echo -e "${RED}❌ Build fehlgeschlagen${NC}"
    exit 1
fi

echo ""
echo "🚀 Schritt 6: Container starten..."
if command -v docker-compose &> /dev/null; then
    sudo docker-compose up -d
    START_EXIT=$?
else
    docker compose up -d
    START_EXIT=$?
fi

if [ $START_EXIT -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Container gestartet"
else
    echo -e "${RED}❌ Start fehlgeschlagen${NC}"
    exit 1
fi

echo ""
echo "📊 Status:"
if command -v docker-compose &> /dev/null; then
    sudo docker-compose ps
else
    docker compose ps
fi

echo ""
echo -e "${GREEN}✅ Fertig!${NC}"
echo ""
echo "Logs anzeigen:"
if command -v docker-compose &> /dev/null; then
    echo "  sudo docker-compose logs -f"
else
    echo "  docker compose logs -f"
fi
echo ""
