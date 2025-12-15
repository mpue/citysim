const Service = require('node-windows').Service;
const path = require('path');

// Service-Objekt erstellen (gleiche Konfiguration wie install-service.js)
const svc = new Service({
  name: 'CitySim Backend',
  script: path.join(__dirname, 'server.js')
});

// Event-Listener
svc.on('uninstall', function() {
  console.log('✓ Service deinstalliert');
  console.log('  CitySim Backend Service wurde entfernt');
});

svc.on('alreadyuninstalled', function() {
  console.log('⚠ Service ist nicht installiert');
});

svc.on('error', function(err) {
  console.error('❌ Fehler:', err);
});

// Deinstallation starten
console.log('═══════════════════════════════════════════════════');
console.log('  CitySim Backend - Windows Service Deinstallation');
console.log('═══════════════════════════════════════════════════');
console.log('');
console.log('🗑️  Deinstalliere Service...');
console.log('');

svc.uninstall();
