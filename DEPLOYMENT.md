# CitySim - Deployment Anleitung

## Voraussetzungen

Auf dem Server müssen installiert sein:
- **Node.js** (Version 18 oder höher)
- **npm** (wird mit Node.js installiert)
- Optional: **Docker & Docker Compose** (für Container-Deployment)

---

## Option 1: Manuelles Deployment (ohne Docker)

### Schritt 1: Projekt auf Server kopieren

```bash
# Projekt-Ordner auf Server hochladen (z.B. via SCP, FTP, Git)
# Zielverzeichnis: z.B. /var/www/citysim oder C:\inetpub\citysim
```

### Schritt 2: Dependencies installieren

```bash
# Im Hauptverzeichnis
cd /pfad/zu/citysim
npm install

# Im Server-Verzeichnis
cd server
npm install
cd ..
```

### Schritt 3: Frontend Build

```bash
# TypeScript kompilieren und minifizieren
npm run build
```

### Schritt 4: Datenbank initialisieren

```bash
# Erstellt citysim.json mit Admin-User
cd server
npm run init-db
cd ..
```

Die Datenbank wird in `server/data/citysim.json` erstellt.

**Standard-Admin:**
- Username: `admin`
- Password: `admin123`

⚠️ **WICHTIG:** Passwort nach erstem Login ändern!

### Schritt 5: Umgebungsvariablen setzen (Optional)

```bash
# Linux/Mac
export SESSION_SECRET="dein-sicheres-geheimnis-hier-mindestens-32-zeichen"
export PORT=3000
export NODE_ENV=production

# Windows (PowerShell)
$env:SESSION_SECRET="dein-sicheres-geheimnis-hier-mindestens-32-zeichen"
$env:PORT=3000
$env:NODE_ENV="production"
```

### Schritt 6: Server starten

```bash
cd server
node server.js
```

Der Server läuft nun auf `http://localhost:3000`

### Schritt 7: Als Dienst einrichten (Optional)

#### Linux (systemd)

Erstelle: `/etc/systemd/system/citysim.service`

```ini
[Unit]
Description=CitySim Backend Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/citysim/server
Environment="NODE_ENV=production"
Environment="SESSION_SECRET=dein-sicheres-geheimnis"
Environment="PORT=3000"
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Service aktivieren und starten
sudo systemctl daemon-reload
sudo systemctl enable citysim
sudo systemctl start citysim
sudo systemctl status citysim
```

#### Windows (als Service mit node-windows)

```bash
# node-windows installieren
npm install -g node-windows

# Service-Script erstellen (install-service.js)
```

Erstelle `server/install-service.js`:

```javascript
const Service = require('node-windows').Service;

const svc = new Service({
  name: 'CitySim Backend',
  description: 'CitySim Backend Server',
  script: require('path').join(__dirname, 'server.js'),
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ],
  env: {
    name: "NODE_ENV",
    value: "production"
  }
});

svc.on('install', function(){
  svc.start();
});

svc.install();
```

```bash
# Als Administrator ausführen
node install-service.js
```

---

## Option 2: Docker Deployment

### Schritt 1: Docker Image bauen

```bash
cd /pfad/zu/citysim
docker-compose build
```

### Schritt 2: Container starten

```bash
docker-compose up -d
```

### Schritt 3: Datenbank initialisieren

```bash
# In den Container einloggen
docker exec -it citysim-backend sh

# Datenbank initialisieren
cd /app/server
npm run init-db
exit
```

### Schritt 4: Container neu starten

```bash
docker-compose restart
```

### Docker Management

```bash
# Logs anzeigen
docker-compose logs -f

# Container stoppen
docker-compose stop

# Container entfernen
docker-compose down

# Container neu starten
docker-compose restart

# Status prüfen
docker-compose ps
```

---

## Option 3: PM2 (Process Manager)

PM2 ist ein Production Process Manager für Node.js mit Load Balancing.

### Installation

```bash
npm install -g pm2
```

### Konfiguration

Erstelle `ecosystem.config.js` im Hauptverzeichnis:

```javascript
module.exports = {
  apps: [{
    name: 'citysim-backend',
    cwd: './server',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      SESSION_SECRET: 'dein-sicheres-geheimnis-hier'
    }
  }]
};
```

### PM2 Befehle

```bash
# App starten
pm2 start ecosystem.config.js

# Status anzeigen
pm2 status

# Logs anzeigen
pm2 logs citysim-backend

# App neu starten
pm2 restart citysim-backend

# App stoppen
pm2 stop citysim-backend

# App löschen
pm2 delete citysim-backend

# Beim Systemstart automatisch starten
pm2 startup
pm2 save
```

---

## Reverse Proxy Setup (nginx)

Für Produktions-Deployment empfohlen!

### nginx Konfiguration

Erstelle: `/etc/nginx/sites-available/citysim`

```nginx
server {
    listen 80;
    server_name citysim.deinedomain.de;

    # Optional: HTTP zu HTTPS umleiten
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts für lange Requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static Files Caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### SSL mit Let's Encrypt (HTTPS)

```bash
# Certbot installieren
sudo apt-get install certbot python3-certbot-nginx

# Zertifikat erstellen
sudo certbot --nginx -d citysim.deinedomain.de

# Automatische Erneuerung testen
sudo certbot renew --dry-run
```

```bash
# nginx aktivieren
sudo ln -s /etc/nginx/sites-available/citysim /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Firewall-Einstellungen

### Linux (ufw)

```bash
# Port 3000 öffnen (nur wenn direkt erreichbar)
sudo ufw allow 3000/tcp

# Oder nur nginx (80/443)
sudo ufw allow 'Nginx Full'
```

### Windows Firewall

```powershell
# Port 3000 öffnen
New-NetFirewallRule -DisplayName "CitySim Backend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

---

## Sicherheits-Checkliste

### ✅ Vor dem Deployment prüfen:

- [ ] `SESSION_SECRET` als Umgebungsvariable gesetzt (nicht im Code!)
- [ ] Admin-Passwort nach erstem Login geändert
- [ ] `NODE_ENV=production` gesetzt
- [ ] Frontend mit `npm run build` kompiliert
- [ ] Firewall konfiguriert
- [ ] HTTPS/SSL eingerichtet (für Produktion)
- [ ] Backup-Strategie für `server/data/citysim.json`
- [ ] Rate Limiting aktiv (bereits implementiert)
- [ ] Logs-Monitoring eingerichtet

### ⚠️ Sicherheitshinweise:

1. **Session Secret:** Mindestens 32 zufällige Zeichen
   ```bash
   # Zufälliges Secret generieren
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Cookie Secure:** In `server.js` bei HTTPS auf `true` setzen:
   ```javascript
   cookie: {
       secure: true,  // Nur bei HTTPS
       httpOnly: true,
       maxAge: 7 * 24 * 60 * 60 * 1000,
       sameSite: 'lax'
   }
   ```

3. **HTTPS:** In Produktion immer HTTPS verwenden!

4. **Backups:** Regelmäßige Backups von `server/data/citysim.json`

5. **Updates:** Node.js und Dependencies regelmäßig aktualisieren

---

## Monitoring & Logs

### Logs prüfen

```bash
# Mit systemd
sudo journalctl -u citysim -f

# Mit PM2
pm2 logs citysim-backend

# Mit Docker
docker-compose logs -f
```

### Status prüfen

```bash
# Mit systemd
sudo systemctl status citysim

# Mit PM2
pm2 status

# Mit Docker
docker-compose ps
```

---

## Troubleshooting

### Port bereits belegt

```bash
# Linux: Port-Nutzung prüfen
sudo lsof -i :3000
sudo netstat -tulpn | grep :3000

# Windows: Port-Nutzung prüfen
netstat -ano | findstr :3000
```

### Berechtigungen (Linux)

```bash
# Server-Benutzer Rechte geben
sudo chown -R www-data:www-data /var/www/citysim
sudo chmod -R 755 /var/www/citysim

# Datenbank-Verzeichnis beschreibbar machen
sudo chmod -R 775 /var/www/citysim/server/data
```

### Node.js Memory Limit erhöhen

```bash
# Mit PM2
pm2 start server.js --max-memory-restart 500M

# Direkt
node --max-old-space-size=4096 server.js
```

---

## Update-Prozess

### 1. Backup erstellen

```bash
# Datenbank sichern
cp server/data/citysim.json server/data/citysim.json.backup
```

### 2. Code aktualisieren

```bash
# Via Git
git pull origin main

# Oder neue Dateien hochladen
```

### 3. Dependencies aktualisieren

```bash
npm install
cd server && npm install && cd ..
```

### 4. Frontend neu bauen

```bash
npm run build
```

### 5. Server neu starten

```bash
# Mit systemd
sudo systemctl restart citysim

# Mit PM2
pm2 restart citysim-backend

# Mit Docker
docker-compose restart
```

---

## Performance-Optimierung

### 1. Gzip Compression (nginx)

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### 2. Static File Caching

Bereits in nginx-Konfiguration oben enthalten.

### 3. Node.js Cluster Mode (PM2)

```javascript
// In ecosystem.config.js
instances: 'max',  // Nutzt alle CPU-Kerne
exec_mode: 'cluster'
```

---

## Support & Kontakt

Bei Problemen:
1. Logs prüfen
2. Browser-Konsole prüfen (F12)
3. Firewall-Einstellungen prüfen
4. Port-Verfügbarkeit prüfen

Viel Erfolg beim Deployment! 🚀
