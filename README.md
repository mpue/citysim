# CitySim - Hercules Amber Edition

Eine Städtebausimulation im Stil des ersten SimCity für den Browser, mit authentischer Bernstein-Monochrom-Grafik, wie sie auf Hercules-Grafikkarten und Bernstein-Monitoren dargestellt wurde.

## Features

- **Retro Bernstein-Optik**: Authentische Monochrom-Darstellung in Orange/Bernstein
- **SimCity-Klassik Gameplay**: Baue Wohngebiete, Gewerbe, Industrie
- **Stromversorgung**: Kraftwerke und Stromleitungen
- **Entwicklung**: Gebäude entwickeln sich basierend auf Infrastruktur
- **Wirtschaftssystem**: Verwalte dein Budget und Steuereinnahmen
- **TypeScript**: Vollständig typisierte Codebasis

## Technologie

- TypeScript
- HTML5 Canvas
- Modulares ES2020
- Pixel-perfekte Retro-Grafik

## Installation & Start

```bash
# Abhängigkeiten installieren
npm install

# TypeScript kompilieren
npm run build

# Zum Entwickeln (Auto-Compile)
npm run watch
```

## Spielen

Öffne `index.html` in einem modernen Browser (Chrome, Firefox, Edge).

### Steuerung

- **Wähle ein Werkzeug** aus der Toolbar
- **Klicke auf die Karte** um Gebäude zu platzieren
- **Stromversorgung**: Baue Kraftwerke und verbinde Gebäude mit Stromleitungen oder Straßen
- **Entwicklung**: Gebäude entwickeln sich, wenn sie Strom haben und an Straßen angeschlossen sind

### Gebäudetypen

- **Wohngebiet** (100$): Generiert Bevölkerung und Steuereinnahmen
- **Gewerbe** (100$): Generiert Einkommen
- **Industrie** (100$): Generiert höheres Einkommen
- **Straße** (10$): Verbindet Gebäude, leitet Strom
- **Kraftwerk** (3000$): Erzeugt Strom
- **Stromleitung** (5$): Leitet Strom weiter
- **Park** (20$): Verschönert die Stadt
- **Abreißen**: Entfernt Gebäude kostenlos

## Projektstruktur

```
CitySim/
├── src/
│   ├── types.ts        # TypeScript Interfaces und Enums
│   ├── renderer.ts     # Bernstein-Grafik Renderer
│   ├── citymap.ts      # Karten- und Stromverwaltung
│   ├── simulation.ts   # Simulationslogik
│   ├── game.ts         # Haupt-Spiellogik
│   └── main.ts         # Einstiegspunkt
├── dist/               # Kompilierte JavaScript-Dateien
├── index.html          # Haupt-HTML
├── style.css           # Bernstein-Styling
├── package.json
└── tsconfig.json
```

## Entwicklung

Das Spiel läuft alle 2 Sekunden einen Simulationsschritt, bei dem:
- Gebäude sich entwickeln können
- Bevölkerung wächst
- Einkommen berechnet wird
- Das Stromnetz aktualisiert wird

## Credits

Inspiriert vom Original SimCity (1989) von Will Wright und Maxis.
