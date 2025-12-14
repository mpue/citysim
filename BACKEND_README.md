# CitySim Backend - Deployment Anleitung

## 📋 Übersicht

Dieses Backend ermöglicht eine Login-Funktionalität für das CitySim-Spiel und kann einfach mit Docker deployed werden.

## 🔐 Test-Zugangsdaten

- **Username:** `admin` | **Password:** `password123`
- **Username:** `player` | **Password:** `citysim2025`

## 🚀 Schnellstart

### Option 1: Mit Docker Compose (Empfohlen)

```bash
# Docker Image bauen und Container starten
docker-compose up -d

# Logs anzeigen
docker-compose logs -f

# Container stoppen
docker-compose down
```

### Option 2: Mit Docker direkt

```bash
# Image bauen
docker build -t citysim-backend .

# Container starten
docker run -d -p 3000:3000 --name citysim-backend citysim-backend

# Logs anzeigen
docker logs -f citysim-backend

# Container stoppen
docker stop citysim-backend
docker rm citysim-backend
```

### Option 3: Lokale Entwicklung (ohne Docker)

```bash
# Backend Dependencies installieren
cd server
npm install

# Frontend bauen (im Hauptverzeichnis)
cd ..
npm install
npm run build

# Server starten
cd server
npm start
```

## 🌐 Zugriff

Nach dem Start ist die Anwendung verfügbar unter:

- **Login-Seite:** http://localhost:3000/login
- **Spiel (nach Login):** http://localhost:3000/game
- **Root:** http://localhost:3000/ (leitet automatisch weiter)

## 📁 Projektstruktur

```
CitySim/
├── server/                    # Backend-Code
│   ├── server.js             # Express Server
│   ├── package.json          # Backend Dependencies
│   └── public/
│       └── login.html        # Login-Seite
├── src/                      # Frontend TypeScript Quellcode
├── dist/                     # Kompiliertes JavaScript
├── icons/                    # Spiel-Icons
├── fx/                       # Sound-Effekte
├── songs/                    # Musik
├── index.html                # Hauptseite des Spiels
├── style.css                 # Spiel-Styling
├── Dockerfile                # Docker Image Definition
├── docker-compose.yml        # Docker Compose Konfiguration
└── .dockerignore            # Docker Ignore Datei
```

## 🔧 API Endpoints

### POST /api/login
Login mit Username und Password

**Request:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response (Erfolg):**
```json
{
  "success": true,
  "message": "Login erfolgreich",
  "redirect": "/game"
}
```

**Response (Fehler):**
```json
{
  "success": false,
  "message": "Ungültiger Benutzername oder Passwort"
}
```

### POST /api/logout
Benutzer ausloggen

**Response:**
```json
{
  "success": true,
  "message": "Erfolgreich abgemeldet"
}
```

### GET /api/session
Aktuellen Session-Status prüfen

**Response:**
```json
{
  "authenticated": true,
  "user": "admin"
}
```

## ⚙️ Konfiguration

### Umgebungsvariablen

Sie können folgende Umgebungsvariablen setzen:

- `PORT` - Server Port (Standard: 3000)
- `NODE_ENV` - Umgebung (production/development)

**Beispiel mit Docker:**
```bash
docker run -d -p 8080:8080 -e PORT=8080 citysim-backend
```

**Beispiel mit docker-compose:**
```yaml
environment:
  - PORT=8080
  - NODE_ENV=production
```

## 🔒 Sicherheitshinweise

⚠️ **Wichtig für Production:**

1. **Credentials ändern:** Die hardcoded Credentials in `server/server.js` sollten durch eine sichere Authentifizierung ersetzt werden
2. **Session Secret ändern:** Ändern Sie den Session Secret in `server.js`
3. **HTTPS verwenden:** Für Production sollte HTTPS aktiviert werden
4. **Environment Variables:** Sensible Daten sollten über Umgebungsvariablen verwaltet werden

## 📝 Entwicklung

### Frontend neu bauen

```bash
npm run build
```

### Backend im Dev-Modus starten

```bash
cd server
npm run dev  # Verwendet nodemon für Auto-Reload
```

### Docker Image neu bauen

```bash
docker-compose build
# oder
docker build -t citysim-backend .
```

## 🐛 Troubleshooting

### Port bereits in Verwendung
```bash
# Anderen Port verwenden
docker run -d -p 8080:3000 citysim-backend
```

### Container startet nicht
```bash
# Logs prüfen
docker logs citysim-backend

# Container neu bauen
docker-compose build --no-cache
docker-compose up -d
```

### Build-Fehler
```bash
# Frontend manuell bauen
npm install
npm run build

# Dann Docker neu bauen
docker-compose build
```

## 📦 Deployment auf Cloud-Plattformen

### Docker Hub

```bash
# Login
docker login

# Tag und Push
docker tag citysim-backend username/citysim-backend:latest
docker push username/citysim-backend:latest
```

### Andere Plattformen

Das Docker Image kann auf verschiedenen Plattformen deployed werden:
- AWS (ECS, Fargate)
- Google Cloud Run
- Azure Container Instances
- DigitalOcean App Platform
- Heroku Container Registry

## 📄 Lizenz

MIT License

## 👥 Support

Bei Fragen oder Problemen, erstellen Sie bitte ein Issue im Repository.
