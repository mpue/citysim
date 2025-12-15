#!/bin/bash
# Auto-Deploy Script für CitySim
# Führt regelmäßig Git Pull aus und rebuildet bei Änderungen

cd /pfad/zu/citysim

while true; do
    echo "🔍 Prüfe auf Updates..."
    
    # Git Status prüfen
    git fetch
    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse @{u})
    
    if [ "$LOCAL" != "$REMOTE" ]; then
        echo "📥 Neue Commits gefunden, starte Update..."
        
        # Pull
        git pull
        
        # Frontend Build
        npm run build
        
        # Backend Dependencies
        cd server
        npm install --silent
        cd ..
        
        # Server neu starten
        if command -v pm2 &> /dev/null; then
            pm2 restart citysim
            echo "✅ Server neu gestartet"
        elif command -v docker-compose &> /dev/null; then
            docker-compose restart
            echo "✅ Docker Container neu gestartet"
        fi
        
        echo "✅ Auto-Deploy abgeschlossen!"
    else
        echo "✓ Keine Updates verfügbar"
    fi
    
    # Warte 5 Minuten
    sleep 300
done
