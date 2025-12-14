# 🏙️ CitySim - Exzellente Benutzerverwaltung

## 🎯 Übersicht

Das CitySim-Backend verfügt nun über eine **professionelle Benutzerverwaltung** mit folgenden Features:

### ✨ Hauptfeatures

#### 🔐 Authentifizierung & Sicherheit
- **Passwort-Hashing** mit bcrypt
- **Session-Management** mit Express-Session
- **Rate Limiting** gegen Brute-Force-Angriffe
- **Input-Validierung** mit express-validator
- **Security Headers** mit Helmet
- **CSRF-Protection** ready

#### 👥 Benutzerverwaltung
- Benutzer-Registrierung mit Validierung
- Login/Logout-Funktionalität
- Profilverwaltung (E-Mail, Anzeigename)
- Passwort-Änderung
- Rollen-System (Admin/Player)
- Account-Deaktivierung (Soft-Delete)

#### 💾 Spielstand-Verwaltung
- Unbegrenzte Spielstände pro Benutzer
- Auto-Save Funktionalität
- Spielstand-Metadaten (Bevölkerung, Geld, Jahr)
- Load/Save/Delete Operationen
- Vollständige Spielzustand-Serialisierung

#### 📊 Statistiken & Analytics
- Spieler-Statistiken (Städte, Bevölkerung, Rekorde)
- Aktivitäts-Logging
- Dashboard mit Übersichten
- Admin-Analytics

#### 🛡️ Admin-Panel
- Benutzer-Übersicht
- Benutzer-Verwaltung
- System-Statistiken
- Aktivitäts-Logs

## 📁 Dateistruktur

```
server/
├── database.js              # Datenbank-Manager (SQLite)
├── server.js                # Haupt-Server mit allen APIs
├── package.json             # Dependencies
├── data/
│   └── citysim.db          # SQLite Datenbank (auto-erstellt)
└── public/
    ├── login.html          # Login-Seite
    ├── register.html       # Registrierungs-Seite
    ├── dashboard.html      # Benutzer-Dashboard
    ├── profile.html        # Profilverwaltung
    ├── dashboard-styles.css # Shared Styles
    └── dashboard.js        # Dashboard Logic
```

## 🗄️ Datenbank-Schema

### Users Table
```sql
- id (PRIMARY KEY)
- username (UNIQUE)
- email (UNIQUE)
- password_hash
- display_name
- role (admin/player)
- is_active
- created_at
- last_login
- total_playtime
```

### Game Saves Table
```sql
- id (PRIMARY KEY)
- user_id (FOREIGN KEY)
- save_name
- city_name
- population
- money
- game_year
- game_data (JSON)
- created_at
- updated_at
- is_autosave
```

### User Stats Table
```sql
- id (PRIMARY KEY)
- user_id (FOREIGN KEY)
- cities_created
- total_population
- highest_population
- achievements (JSON)
```

### Activity Log Table
```sql
- id (PRIMARY KEY)
- user_id (FOREIGN KEY)
- action
- details
- ip_address
- created_at
```

## 🔌 API-Endpoints

### Authentifizierung
- `POST /api/login` - Benutzer einloggen
- `POST /api/register` - Neuen Benutzer registrieren
- `POST /api/logout` - Benutzer ausloggen

### Benutzerverwaltung
- `GET /api/user/me` - Aktuellen Benutzer abrufen
- `PUT /api/user/profile` - Profil aktualisieren
- `POST /api/user/change-password` - Passwort ändern

### Spielstände
- `GET /api/saves` - Alle Spielstände des Benutzers
- `GET /api/saves/:id` - Spezifischen Spielstand laden
- `POST /api/saves` - Neuen Spielstand erstellen
- `PUT /api/saves/:id` - Spielstand aktualisieren
- `DELETE /api/saves/:id` - Spielstand löschen

### Admin (nur für Admins)
- `GET /api/admin/users` - Alle Benutzer auflisten
- `GET /api/admin/stats` - System-Statistiken
- `PUT /api/admin/users/:id` - Benutzer bearbeiten
- `DELETE /api/admin/users/:id` - Benutzer deaktivieren

## 🚀 Installation & Start

### 1. Dependencies installieren
```bash
cd server
npm install
```

### 2. Server starten
```bash
# Production
npm start

# Development (mit Auto-Reload)
npm run dev
```

### 3. Mit Docker
```bash
# Docker Compose (empfohlen)
docker-compose up -d

# Oder manuell
docker build -t citysim-backend .
docker run -d -p 3000:3000 citysim-backend
```

## 🎮 Verwendung

### Für Endbenutzer

1. **Registrierung**: Besuche `http://localhost:3000/register`
   - Wähle Benutzernamen (3-20 Zeichen, nur Buchstaben/Zahlen/Unterstriche)
   - Gib E-Mail-Adresse ein
   - Wähle sicheres Passwort (min. 6 Zeichen)
   - Optional: Anzeigename festlegen

2. **Login**: Besuche `http://localhost:3000/login`
   - Melde dich mit Benutzernamen und Passwort an

3. **Dashboard**: Nach Login kommst du automatisch zum Dashboard
   - Übersicht über deine Statistiken
   - Zugriff auf Spielstände
   - Schnellstart zum Spiel

4. **Profil**: Verwalte deinen Account unter `/profile`
   - E-Mail und Anzeigename ändern
   - Passwort ändern
   - Account-Details ansehen

5. **Spiel**: Starte das Spiel über `/game`
   - Vollständiger Zugriff auf City Builder
   - Automatische Spielstand-Speicherung möglich

### Für Administratoren

1. **Admin-Login**: Standard-Zugangsdaten
   - Username: `admin`
   - Password: `admin123`
   - **⚠️ Bitte in Production ändern!**

2. **Admin-Panel**: Zugriff über `/admin`
   - Alle Benutzer verwalten
   - System-Statistiken einsehen
   - Benutzer aktivieren/deaktivieren
   - Aktivitäts-Logs überwachen

## 🔒 Sicherheits-Features

### Implementiert
- ✅ Passwort-Hashing (bcrypt, 10 Runden)
- ✅ Session-Management mit HTTP-Only Cookies
- ✅ Rate Limiting (5 Versuche / 15 Min für Login)
- ✅ Input-Validierung auf Server-Seite
- ✅ SQL-Injection Protection (Prepared Statements)
- ✅ XSS-Protection (HTML-Escaping)
- ✅ Security Headers (Helmet)
- ✅ Soft-Delete für Benutzer (keine Datenlöschung)

### Für Production empfohlen
- 🔧 HTTPS aktivieren
- 🔧 SESSION_SECRET über Umgebungsvariable setzen
- 🔧 Admin-Passwort ändern
- 🔧 Passwort-Reset per E-Mail
- 🔧 2-Faktor-Authentifizierung
- 🔧 Email-Verifikation
- 🔧 CSRF-Tokens für Forms

## 🎨 Frontend-Features

### Responsive Design
- Mobile-First Ansatz
- Funktioniert auf allen Bildschirmgrößen
- Touch-optimiert

### UX-Features
- Animierte Übergänge
- Echtzeit-Feedback
- Passwort-Stärke-Anzeige
- Fehlerbehandlung mit benutzerfreundlichen Meldungen
- Loading-States
- Bestätigungsdialoge

## 📝 Beispiel-Requests

### Registrierung
```javascript
POST /api/register
Content-Type: application/json

{
  "username": "spieler123",
  "email": "spieler@example.com",
  "password": "sicheres_passwort",
  "displayName": "Max Mustermann"
}
```

### Spielstand speichern
```javascript
POST /api/saves
Content-Type: application/json
Authorization: Session Cookie

{
  "saveName": "Meine erste Stadt",
  "cityName": "Metropolis",
  "population": 15000,
  "money": 50000,
  "gameYear": 5,
  "gameData": { /* Vollständiger Spielzustand */ },
  "isAutosave": false
}
```

## 🐛 Troubleshooting

### Datenbank-Fehler
```bash
# Datenbank neu initialisieren
rm server/data/citysim.db
npm start
# Admin-Benutzer wird automatisch erstellt
```

### Port bereits belegt
```bash
# Anderen Port verwenden
PORT=8080 npm start
```

### Dependencies fehlen
```bash
cd server
rm -rf node_modules
npm install
```

## 📊 Performance

- **SQLite** mit WAL-Mode für bessere Concurrency
- **Indexed** Datenbankabfragen
- **Session-Store** in Memory (für Production: Redis empfohlen)
- **Prepared Statements** für wiederkehrende Queries
- **Connection Pooling** ready

## 🔄 Backup & Wartung

### Datenbank-Backup
```bash
# Backup erstellen
cp server/data/citysim.db server/data/citysim.backup.db

# Oder mit SQLite-Tools
sqlite3 server/data/citysim.db ".backup server/data/backup.db"
```

### Logs
Alle Aktivitäten werden in der `activity_log` Tabelle gespeichert.

## 📈 Erweiterungsmöglichkeiten

### Zukünftige Features
- [ ] E-Mail-Benachrichtigungen
- [ ] Passwort-Reset Funktion
- [ ] OAuth2 Integration (Google, GitHub)
- [ ] Multiplayer-Features
- [ ] Achievements System
- [ ] Leaderboards
- [ ] Cloud-Saves
- [ ] Export/Import von Spielständen

## 📄 Lizenz

MIT License

## 👨‍💻 Support

Bei Fragen oder Problemen:
1. Prüfe die Logs in der Konsole
2. Prüfe Browser-Console auf Fehler
3. Erstelle ein Issue im Repository

---

**Viel Spaß beim Städtebauen! 🏙️**
