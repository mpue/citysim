# Test-Anleitung für Stromleitungs-Overlay

## Browser-Cache leeren:

### Chrome/Edge:
1. Drücke `Ctrl + Shift + Delete`
2. Wähle "Cached images and files"
3. Klicke auf "Clear data"

ODER einfacher:
1. Drücke `Ctrl + Shift + R` (Hard Reload)

### Firefox:
1. Drücke `Ctrl + Shift + Delete`
2. Wähle "Cache"
3. Klicke auf "Clear Now"

ODER:
1. Drücke `Ctrl + F5` (Hard Reload)

## Test-Schritte:

1. Browser-Cache leeren (siehe oben)
2. index.html neu laden
3. Kraftwerk bauen
4. Stromleitung-Werkzeug wählen
5. Über die Karte ziehen

## Erwartetes Verhalten:

- Stromleitungen erscheinen in **GRÜN** (nicht mehr bernstein)
- Stromleitungen können über andere Gebäude gelegt werden
- Verbindungen nur zu benachbarten Stromleitungen
- Leuchtende grüne Punkte an Knotenpunkten

## Wenn es nicht funktioniert:

1. F12 drücken (Developer Tools)
2. Console-Tab öffnen
3. Nach Fehlern suchen
4. Screenshot senden
