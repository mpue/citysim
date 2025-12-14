# Node.js Official Image verwenden
FROM node:18-alpine

# Arbeitsverzeichnis erstellen
WORKDIR /app

# Zuerst Backend Package files kopieren und installieren
COPY server/package*.json /app/server/
WORKDIR /app/server
RUN npm install --production

# Zurück zum Root für Frontend
WORKDIR /app
COPY package*.json ./
RUN npm install

# Jetzt alles andere kopieren
COPY . .

# TypeScript Build (falls noch nicht vorhanden)
RUN if [ ! -d "dist" ]; then npm run build; fi

# Port exponieren
EXPOSE 3000

# Server starten aus /app/server
WORKDIR /app/server
CMD ["node", "server.js"]
