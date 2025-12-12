// Build-Script für Code-Minifizierung und Obfuskation
const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

const distDir = path.join(__dirname, 'dist');

// Optionen für Terser - maximale Kompression und Obfuskation
const terserOptions = {
    compress: {
        dead_code: true,
        drop_console: false, // Behalte console.log für Debugging
        drop_debugger: true,
        keep_classnames: false,
        keep_fnames: false,
        passes: 3 // Mehrere Durchläufe für bessere Kompression
    },
    mangle: {
        toplevel: true, // Obfuskiere auch Top-Level Variablen
        properties: {
            regex: /^_/ // Obfuskiere private Properties (die mit _ beginnen)
        }
    },
    format: {
        comments: false, // Entferne alle Kommentare
        ascii_only: true
    }
};

async function minifyFile(filePath) {
    const code = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    console.log(`Minifiziere ${fileName}...`);
    
    try {
        const result = await minify(code, terserOptions);
        
        if (result.error) {
            console.error(`Fehler beim Minifizieren von ${fileName}:`, result.error);
            return false;
        }
        
        // Speichere minifizierten Code
        fs.writeFileSync(filePath, result.code, 'utf8');
        
        const originalSize = (code.length / 1024).toFixed(2);
        const minifiedSize = (result.code.length / 1024).toFixed(2);
        const savings = ((1 - result.code.length / code.length) * 100).toFixed(2);
        
        console.log(`  ✓ ${fileName}: ${originalSize} KB → ${minifiedSize} KB (${savings}% kleiner)`);
        return true;
    } catch (err) {
        console.error(`Fehler beim Minifizieren von ${fileName}:`, err);
        return false;
    }
}

async function minifyAllFiles() {
    console.log('\n🔨 Starte Code-Minifizierung...\n');
    
    // Alle .js Dateien im dist-Ordner finden
    const files = fs.readdirSync(distDir)
        .filter(file => file.endsWith('.js'))
        .map(file => path.join(distDir, file));
    
    let success = 0;
    let failed = 0;
    
    for (const file of files) {
        const result = await minifyFile(file);
        if (result) {
            success++;
        } else {
            failed++;
        }
    }
    
    console.log(`\n✅ Minifizierung abgeschlossen: ${success} Dateien erfolgreich, ${failed} Fehler\n`);
    
    if (failed > 0) {
        process.exit(1);
    }
}

// Führe Minifizierung aus
minifyAllFiles().catch(err => {
    console.error('Kritischer Fehler:', err);
    process.exit(1);
});
