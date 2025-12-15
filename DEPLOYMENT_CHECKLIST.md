# CitySim - Quick Deployment Checklist

## 📋 Vor dem Deployment

- [ ] Node.js 18+ installiert
- [ ] npm installiert
- [ ] Git installiert (optional, für Updates)
- [ ] Server/VPS mit ausreichend Ressourcen (min. 512MB RAM)

## 🚀 Deployment-Schritte

### 1. Projekt auf Server hochladen
```bash
# Via Git
git clone <repository-url>
cd CitySim

# Oder: Dateien via SCP/FTP hochladen
```

### 2. Deployment-Script ausführen

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

**Windows:**
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\deploy.ps1
```

### 3. Umgebungsvariablen setzen

**Linux/Mac:**
```bash
export SESSION_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
export PORT=3000
export NODE_ENV=production
```

**Windows PowerShell:**
```powershell
$secret = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
$env:SESSION_SECRET=$secret
$env:PORT=3000
$env:NODE_ENV="production"

# Permanent speichern (als Admin):
[System.Environment]::SetEnvironmentVariable('SESSION_SECRET', $secret, 'Machine')
```

### 4. Server starten

**Einfach (für Tests):**
```bash
cd server
node server.js
```

**Mit PM2 (empfohlen):**
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Folge den Anweisungen
```

**Docker:**
```bash
docker-compose up -d
```

### 5. Firewall konfigurieren

**Linux (ufw):**
```bash
sudo ufw allow 3000/tcp
# Oder für nginx:
sudo ufw allow 'Nginx Full'
```

**Windows:**
```powershell
New-NetFirewallRule -DisplayName "CitySim Backend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

### 6. Nginx Reverse Proxy (optional, empfohlen)

```bash
# nginx installieren
sudo apt-get install nginx

# Konfiguration kopieren
sudo cp nginx-citysim.conf /etc/nginx/sites-available/citysim
sudo ln -s /etc/nginx/sites-available/citysim /etc/nginx/sites-enabled/

# Domain in Config anpassen
sudo nano /etc/nginx/sites-available/citysim
# Ändere: server_name citysim.deinedomain.de

# nginx testen und neu laden
sudo nginx -t
sudo systemctl reload nginx
```

### 7. SSL/HTTPS einrichten (optional, empfohlen)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d citysim.deinedomain.de
```

## ✅ Nach dem Deployment prüfen

- [ ] Server läuft: `http://localhost:3000` oder `http://deinedomain.de`
- [ ] Login-Seite erscheint
- [ ] Mit Admin-Account anmelden (admin / admin123)
- [ ] Passwort ändern!
- [ ] Neuen Benutzer anlegen (Test)
- [ ] Spiel starten und speichern (Test)
- [ ] Browser-Konsole auf Fehler prüfen (F12)

## 🔐 Sicherheits-Checkliste

- [ ] SESSION_SECRET gesetzt (nicht Standard-Wert!)
- [ ] Admin-Passwort geändert
- [ ] HTTPS aktiviert (für Produktion)
- [ ] Firewall konfiguriert
- [ ] Backup-Strategie für `server/data/citysim.json`
- [ ] Server-Updates eingeplant
- [ ] Log-Monitoring eingerichtet

## 📊 Monitoring

**PM2:**
```bash
pm2 status              # Status
pm2 logs citysim-backend  # Logs anzeigen
pm2 restart citysim-backend  # Neu starten
pm2 monit              # Live-Monitoring
```

**systemd:**
```bash
sudo systemctl status citysim
sudo journalctl -u citysim -f
```

**Docker:**
```bash
docker-compose ps
docker-compose logs -f
```

## 🔄 Updates deployen

```bash
# 1. Backup erstellen
cp server/data/citysim.json server/data/citysim.json.backup

# 2. Code aktualisieren
git pull origin main
# Oder: Neue Dateien hochladen

# 3. Dependencies & Build
npm install
cd server && npm install && cd ..
npm run build

# 4. Server neu starten
pm2 restart citysim-backend
# oder:
sudo systemctl restart citysim
# oder:
docker-compose restart
```

## ❓ Troubleshooting

**Port bereits belegt:**
```bash
# Linux
sudo lsof -i :3000
sudo kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Permissions (Linux):**
```bash
sudo chown -R www-data:www-data /var/www/citysim
chmod -R 755 /var/www/citysim
chmod -R 775 /var/www/citysim/server/data
```

**Datenbank korrupt:**
```bash
# Backup wiederherstellen
cp server/data/citysim.json.backup server/data/citysim.json

# Oder neu initialisieren
cd server
npm run init-db
```

## 📞 Support

Bei Problemen:
1. Logs prüfen (siehe Monitoring)
2. Browser-Konsole prüfen (F12)
3. DEPLOYMENT.md lesen
4. GitHub Issues erstellen

---

**Viel Erfolg! 🎉**
