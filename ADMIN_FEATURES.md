# Admin-Funktionen - Benutzerverwaltung

## Übersicht
Die Admin-Seite bietet jetzt umfassende Funktionen zur Verwaltung von Benutzern.

## Funktionen

### 1. Benutzer anzeigen
- Vollständige Liste aller Benutzer
- Filter nach Rolle (Admin/Spieler)
- Filter nach Status (Aktiv/Inaktiv)
- Suchfunktion nach Benutzername, E-Mail oder Anzeigename
- Anzeige von: ID, Benutzername, E-Mail, Anzeigename, Rolle, Status, Erstellungsdatum, Letzter Login

### 2. Neuen Benutzer anlegen ➕
**Button:** "➕ Neuer Benutzer"

**Felder:**
- **Benutzername** * (3-20 Zeichen, nur Buchstaben, Zahlen, Unterstriche)
- **E-Mail** * (Gültige E-Mail-Adresse)
- **Anzeigename** (Optional, max. 50 Zeichen)
- **Passwort** * (Mindestens 6 Zeichen)
- **Rolle** * (Spieler oder Administrator)
- **Status** (Aktiv/Inaktiv Checkbox)

**Validierung:**
- Benutzername muss eindeutig sein
- E-Mail muss eindeutig sein
- Alle Felder werden validiert (Client + Server)

### 3. Benutzer bearbeiten ✏️
**Button:** In der Aktions-Spalte jeder Zeile

**Editierbare Felder:**
- E-Mail
- Anzeigename
- Passwort (optional - leer lassen für keine Änderung)
- Rolle (Spieler ↔ Admin)
- Status (Aktiv/Inaktiv)

**Hinweise:**
- Benutzername kann nicht geändert werden
- Passwort nur ändern, wenn ein neues eingegeben wird

### 4. Benutzer aktivieren/deaktivieren
**Buttons:** "Aktivieren" / "Deaktivieren" in der Aktions-Spalte

**Funktion:**
- **Deaktivieren:** Benutzer kann sich nicht mehr anmelden
- **Aktivieren:** Benutzer kann sich wieder anmelden
- Soft-Delete - Daten bleiben erhalten

### 5. Benutzer löschen 🗑️
**Button:** In der Aktions-Spalte jeder Zeile

**Funktion:**
- **PERMANENT:** Komplettes Löschen des Benutzers
- Löscht auch:
  - Alle Spielstände des Benutzers
  - Alle Activity-Logs des Benutzers
- **Sicherheit:** Bestätigungsdialog erforderlich
- **Einschränkung:** Admin kann sich nicht selbst löschen

## API-Endpunkte

### GET /api/admin/users
Alle Benutzer abrufen (nur Admin)

### POST /api/admin/users
Neuen Benutzer anlegen (nur Admin)

**Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "displayName": "string",
  "role": "player|admin"
}
```

### PUT /api/admin/users/:id
Benutzer aktualisieren (nur Admin)

**Body:**
```json
{
  "email": "string",
  "displayName": "string",
  "password": "string",
  "role": "player|admin",
  "isActive": boolean
}
```

### DELETE /api/admin/users/:id
Benutzer permanent löschen (nur Admin)

## Sicherheit

### Berechtigungen
- Alle Admin-Funktionen erfordern `isAuthenticated` + `isAdmin` Middleware
- Nur Benutzer mit Rolle "admin" haben Zugriff

### Validierung
- **Client-seitig:** HTML5-Validierung + JavaScript-Prüfungen
- **Server-seitig:** express-validator für alle Eingaben
- Schutz vor XSS durch Escaping
- Schutz vor Duplikaten (Username, E-Mail)

### Logging
Alle Admin-Aktionen werden in der Activity-Log-Tabelle protokolliert:
- `admin_user_create` - Benutzer erstellt
- `admin_user_update` - Benutzer aktualisiert
- `admin_user_delete` - Benutzer gelöscht

## Benutzeroberfläche

### Design
- Modal-Dialog für Erstellen/Bearbeiten
- Responsive Design
- Animationen für bessere UX
- Farbcodierte Badges (Rolle, Status)
- Klare Fehlermeldungen

### Bedienung
1. Admin-Seite öffnen: `/admin`
2. Filter/Suche verwenden (optional)
3. Aktion wählen:
   - "➕ Neuer Benutzer" → Formular ausfüllen → Speichern
   - "✏️" → Felder ändern → Speichern
   - "Aktivieren/Deaktivieren" → Bestätigen
   - "🗑️" → Bestätigen

### Feedback
- Erfolgs-/Fehlermeldungen oben auf der Seite
- Automatische Aktualisierung der Liste nach Änderungen
- Automatische Aktualisierung der Statistiken

## Statistiken

Die Admin-Seite zeigt:
- 👥 **Benutzer:** Anzahl registrierter Benutzer
- 💾 **Spielstände:** Anzahl gespeicherter Spiele
- 🔥 **Aktiv heute:** Anzahl aktiver Spieler heute

Statistiken werden automatisch nach jeder Änderung aktualisiert.

## Hinweise

### Datensicherheit
- Passwörter werden mit bcrypt gehasht
- Keine Klartextpasswörter in der Datenbank
- Session-basierte Authentifizierung

### Empfehlungen
- Regelmäßige Backups der `citysim.json` Datenbank
- Vorsicht beim Löschen von Benutzern (unwiderruflich!)
- Admin-Rechte nur an vertrauenswürdige Benutzer vergeben
