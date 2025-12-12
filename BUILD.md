# Slimcity - Build-Anleitung

## Code-Minifizierung

Das Projekt verwendet **Terser** für Code-Minifizierung und Obfuskation.

### Build-Befehle

#### Production Build (minifiziert & obfuskiert)
```bash
npm run build
```
- Kompiliert TypeScript zu JavaScript
- Minifiziert und obfuskiert den Code
- Entfernt Kommentare und Source Maps
- Reduziert Dateigröße um ~50%
- Macht Code schwer lesbar

#### Development Build (lesbar)
```bash
npm run build:dev
```
- Nur TypeScript-Kompilierung
- Keine Minifizierung
- Code bleibt lesbar für Entwicklung

#### Watch-Modus (für Entwicklung)
```bash
npm run dev
```
- Automatische Neukompilierung bei Änderungen
- Keine Minifizierung

## Was macht die Minifizierung?

### Vorher (lesbar):
```javascript
class Game {
    private cityMap: CityMap;
    
    constructor(canvasId: string) {
        this.cityMap = new CityMap(64, 64);
    }
}
```

### Nachher (obfuskiert):
```javascript
class a{constructor(b){this.c=new d(64,64)}}
```

## Features der Obfuskation

✅ **Variablennamen verkürzt** - alle Namen werden zu kurzen Buchstaben
✅ **Top-Level Obfuskation** - auch globale Variablen werden umbenannt
✅ **Kommentare entfernt** - alle Code-Kommentare werden gelöscht
✅ **Whitespace entfernt** - unnötige Leerzeichen und Zeilenumbrüche weg
✅ **Dead Code entfernt** - nicht genutzter Code wird entfernt
✅ **Mehrere Optimierungs-Durchläufe** - 3 Passes für maximale Kompression

## Dateigrößen-Vergleich

| Datei | Original | Minifiziert | Ersparnis |
|-------|----------|-------------|-----------|
| game.js | 61.85 KB | 30.52 KB | **50.66%** |
| renderer.js | 23.30 KB | 12.13 KB | **47.94%** |
| citymap.js | 5.46 KB | 2.30 KB | **57.84%** |
| simulation.js | 3.01 KB | 1.43 KB | **52.69%** |

## Konfiguration

Die Minifizierungs-Einstellungen findest du in `build-minify.js`.

### Optionen anpassen:

```javascript
const terserOptions = {
    compress: {
        drop_console: true,  // Console.logs entfernen
        passes: 5            // Mehr Durchläufe für stärkere Kompression
    },
    mangle: {
        toplevel: true       // Alle Namen obfuskieren
    }
};
```

## Hinweise

⚠️ **Wichtig**: Nach dem Production Build ist der Code nicht mehr debugbar!
💡 **Tipp**: Nutze `npm run build:dev` während der Entwicklung
📦 **Deployment**: Nutze `npm run build` für die finale Version
