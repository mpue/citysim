#!/usr/bin/env node
/**
 * CitySim - Datenbank Initialisierung
 * Erstellt die initiale citysim.json Datenbank mit Admin-Benutzer
 */

const DatabaseManager = require('./database-json');
const path = require('path');
const fs = require('fs');

console.log('═══════════════════════════════════════════════════');
console.log('  CitySim - Datenbank Initialisierung');
console.log('═══════════════════════════════════════════════════');
console.log('');

const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'citysim.json');

// Prüfe ob Datenbank bereits existiert
if (fs.existsSync(dbPath)) {
    console.log('⚠  Datenbank existiert bereits!');
    console.log('   Pfad:', dbPath);
    console.log('');
    console.log('   Zum Neuerstellen, lösche die Datei zuerst:');
    console.log('   rm', dbPath);
    console.log('');
    process.exit(0);
}

// Erstelle data Verzeichnis falls nicht vorhanden
if (!fs.existsSync(dataDir)) {
    console.log('📁 Erstelle data Verzeichnis...');
    fs.mkdirSync(dataDir, { recursive: true });
}

console.log('🔨 Erstelle neue Datenbank...');

try {
    // Initialisiere Datenbank
    const db = new DatabaseManager();
    
    // Erstelle Admin-Benutzer
    console.log('👤 Erstelle Admin-Benutzer...');
    const adminId = db.createUser(
        'admin',
        'admin@citysim.local',
        'admin123',
        'Administrator',
        'admin'
    );
    
    console.log('');
    console.log('✅ Datenbank erfolgreich initialisiert!');
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('  📝 Standard-Admin-Zugang:');
    console.log('═══════════════════════════════════════════════════');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   Role:     Administrator');
    console.log('');
    console.log('   ⚠  WICHTIG: Passwort nach erstem Login ändern!');
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('   Datenbank gespeichert unter:');
    console.log('   ' + dbPath);
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    
    process.exit(0);
} catch (error) {
    console.error('');
    console.error('❌ Fehler bei der Initialisierung:');
    console.error('   ' + error.message);
    console.error('');
    process.exit(1);
}
