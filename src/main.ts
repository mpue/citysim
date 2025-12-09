import { Game } from './game.js';

// Spiel initialisieren wenn Seite geladen ist
window.addEventListener('load', () => {
    const game = new Game('gameCanvas');
    console.log('CitySim - Hercules Amber Edition gestartet');
});
