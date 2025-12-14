# Node.js Official Image verwenden
FROM node:18-alpine

# Arbeitsverzeichnis erstellen
WORKDIR /app

# Package files für Frontend und Backend kopieren
COPY package*.json ./
COPY server/package*.json ./server/

# Frontend Dependencies installieren (für Build)
RUN npm install

# Backend Dependencies installieren
WORKDIR /app/server
RUN npm install --production

# Zurück zum Root und alles kopieren
WORKDIR /app
COPY . .

# Build-Schritt für TypeScript (falls noch nicht gebaut)
RUN if [ ! -d "dist" ]; then npm run build; fi

# Port exponieren
EXPOSE 3000

# Server starten
WORKDIR /app/server
CMD ["node", "server.js"]
