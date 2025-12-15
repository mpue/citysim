# Node.js Official Image verwenden
FROM node:18-alpine

# Arbeitsverzeichnis erstellen
WORKDIR /app

# Kopiere package.json und package-lock.json Dateien
COPY package*.json ./
COPY server/package*.json ./server/

# Installiere Frontend Dependencies
RUN npm install

# Installiere Backend Dependencies
WORKDIR /app/server
RUN npm install --omit=dev

# Zurück zum Root und kopiere Quellcode
WORKDIR /app
COPY src ./src
COPY tsconfig.json ./
COPY build-minify.js ./

# Kopiere Server Code (explizit alle benötigten Dateien)
COPY server/server.js ./server/
COPY server/database-json.js ./server/
COPY server/public ./server/public
COPY server/scripts ./server/scripts

# Kopiere Assets
COPY icons ./icons
COPY fx ./fx
COPY songs ./songs
COPY index.html ./
COPY style.css ./

# Build Frontend
RUN npm run build

# Verify server dependencies
WORKDIR /app/server
RUN ls -la && ls -la node_modules || echo "node_modules check"

# Erstelle data Verzeichnis
RUN mkdir -p /app/server/data

# Port exponieren
EXPOSE 3000

# Erstelle Startup-Script
RUN echo '#!/bin/sh' > /app/server/start.sh && \
    echo 'cd /app/server' >> /app/server/start.sh && \
    echo 'if [ ! -f data/citysim.json ]; then' >> /app/server/start.sh && \
    echo '  echo "🔧 Initialisiere Datenbank..."' >> /app/server/start.sh && \
    echo '  npm run init-db' >> /app/server/start.sh && \
    echo 'fi' >> /app/server/start.sh && \
    echo 'echo "🚀 Starte Server..."' >> /app/server/start.sh && \
    echo 'node server.js' >> /app/server/start.sh && \
    chmod +x /app/server/start.sh

# Server starten mit Init-Check
CMD ["/bin/sh", "/app/server/start.sh"]
