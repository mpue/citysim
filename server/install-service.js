const Service = require('node-windows').Service;
const path = require('path');

// Service-Objekt erstellen
const svc = new Service({
  name: 'CitySim Backend',
  description: 'CitySim Backend Server - Städtebausimulation',
  script: path.join(__dirname, 'server.js'),
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ],
  env: [{
    name: "NODE_ENV",
    value: "production"
  }, {
    name: "PORT",
    value: "3000"
  }, {
    name: "SESSION_SECRET",
    value: process.env.SESSION_SECRET || "BITTE-AENDERN-UND-SESSION-SECRET-SETZEN"
  }]
});

// Event-Listener
svc.on('install', function() {
  console.log('✓ Service installiert');
  console.log('  Starte Service...');
  svc.start();
});

svc.on('alreadyinstalled', function() {
  console.log('⚠ Service ist bereits installiert');
});

svc.on('invalidinstallation', function() {
  console.log('❌ Installation ungültig');
});

svc.on('start', function() {
  console.log('✓ Service gestartet');
  console.log('  CitySim Backend läuft nun als Windows Service');
  console.log('  Port: 3000');
  console.log('  URL: http://localhost:3000');
});

svc.on('stop', function() {
  console.log('✓ Service gestoppt');
});

svc.on('error', function(err) {
  console.error('❌ Service-Fehler:', err);
});

// Installation starten
console.log('═══════════════════════════════════════════════════');
console.log('  CitySim Backend - Windows Service Installation');
console.log('═══════════════════════════════════════════════════');
console.log('');
console.log('📦 Installiere Service...');
console.log('   Name: CitySim Backend');
console.log('   Script:', svc.script);
console.log('');

if (!process.env.SESSION_SECRET) {
  console.log('⚠  WARNUNG: SESSION_SECRET Umgebungsvariable nicht gesetzt!');
  console.log('   Bitte setze SESSION_SECRET bevor der Service gestartet wird:');
  console.log('');
  console.log('   [System.Environment]::SetEnvironmentVariable(');
  console.log('       "SESSION_SECRET",');
  console.log('       "' + require('crypto').randomBytes(32).toString('hex') + '",');
  console.log('       "Machine"');
  console.log('   )');
  console.log('');
}

svc.install();
