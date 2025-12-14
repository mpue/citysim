# Node.js Official Image verwenden
FROM node:18-alpine

# Arbeitsverzeichnis erstellen
WORKDIR /app

# Package files kopieren
COPY server/package*.json ./server/

# Dependencies installieren
WORKDIR /app/server
RUN npm install --production

# Komplettes Projekt kopieren
WORKDIR /app
COPY . .

# Build-Schritt für TypeScript (falls noch nicht gebaut)
WORKDIR /app
RUN if [ ! -d "dist" ]; then \
    npm install && \
    npm run build; \
    fi

# Port exponieren
EXPOSE 3000

# Server starten
WORKDIR /app/server
CMD ["node", "server.js"]
