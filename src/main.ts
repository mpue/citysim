import { Game } from './game.js';

// Spiel-Instanz
let game: Game | null = null;

// Startscreen verwalten
window.addEventListener('load', () => {
    setupStartScreen();
});

function setupStartScreen(): void {
    const newGameBtn = document.getElementById('new-game-btn');
    const savedGamesList = document.getElementById('saved-games-list');
    
    // Neue Stadt Button
    if (newGameBtn) {
        newGameBtn.addEventListener('click', () => {
            startNewGame();
        });
    }
    
    // Gespeicherte Spiele laden und anzeigen
    loadSavedGames();
}

async function loadSavedGames(): Promise<void> {
    const savedGamesList = document.getElementById('saved-games-list');
    if (!savedGamesList) return;
    
    let saves: any[] = [];
    let useServer = false;
    
    // Try to load from server first
    try {
        const authCheck = await fetch('/api/auth/check');
        const authResult = await authCheck.json();
        
        if (authResult.authenticated) {
            const response = await fetch('/api/saves');
            const result = await response.json();
            
            if (result.success && result.saves.length > 0) {
                useServer = true;
                saves = result.saves.map((s: any) => ({
                    id: s.id,
                    name: s.save_name,
                    data: {
                        stats: {
                            year: s.game_year,
                            population: s.population,
                            money: s.money
                        }
                    },
                    updatedAt: s.updated_at
                }));
            }
        }
    } catch (error) {
        console.log('Not authenticated, using localStorage');
    }
    
    // Fallback to localStorage
    if (!useServer) {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('citysim_save_')) {
                try {
                    const saveData = JSON.parse(localStorage.getItem(key) || '{}');
                    saves.push({
                        key: key,
                        name: key.replace('citysim_save_', ''),
                        data: saveData
                    });
                } catch (e) {
                    console.error('Fehler beim Laden von Save:', key, e);
                }
            }
        }
    }
    
    // Anzeigen
    if (saves.length === 0) {
        savedGamesList.innerHTML = '<p class="no-saves-message">Keine gespeicherten Städte gefunden</p>';
    } else {
        savedGamesList.innerHTML = '';
        saves.forEach(save => {
            const item = document.createElement('div');
            item.className = 'saved-game-item';
            
            const info = document.createElement('div');
            info.className = 'saved-game-info';
            
            const nameEl = document.createElement('div');
            nameEl.className = 'saved-game-name';
            nameEl.textContent = save.name;
            
            const stats = document.createElement('div');
            stats.className = 'saved-game-stats';
            const year = save.data.stats?.year || '???';
            const population = save.data.stats?.population || 0;
            const money = save.data.stats?.money || 0;
            stats.textContent = `Jahr ${year} • ${population} Einwohner • $${money}`;
            
            info.appendChild(nameEl);
            info.appendChild(stats);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'saved-game-delete';
            deleteBtn.textContent = 'Löschen';
            deleteBtn.onclick = async (e) => {
                e.stopPropagation();
                if (confirm(`Stadt "${save.name}" wirklich löschen?`)) {
                    if (useServer && save.id) {
                        await fetch(`/api/saves/${save.id}`, { method: 'DELETE' });
                    } else if (save.key) {
                        localStorage.removeItem(save.key);
                    }
                    loadSavedGames();
                }
            };
            
            item.appendChild(info);
            item.appendChild(deleteBtn);
            
            item.onclick = () => {
                if (useServer && save.id) {
                    loadGameFromServer(save.id);
                } else if (save.key) {
                    loadGame(save.key);
                }
            };
            
            savedGamesList.appendChild(item);
        });
    }
}

function startNewGame(): void {
    hideStartScreen();
    game = new Game('gameCanvas');
    console.log('CitySim - Neue Stadt gestartet');
}

function loadGame(saveKey: string): void {
    hideStartScreen();
    game = new Game('gameCanvas');
    
    // Save laden
    setTimeout(() => {
        if (game) {
            (game as any).loadGameFromKey(saveKey);
        }
    }, 100);
    
    console.log('CitySim - Stadt geladen:', saveKey);
}

async function loadGameFromServer(saveId: number): Promise<void> {
    hideStartScreen();
    game = new Game('gameCanvas');
    
    // Save vom Server laden
    setTimeout(() => {
        if (game) {
            (game as any).loadGameFromServer(saveId);
        }
    }, 100);
    
    console.log('CitySim - Stadt vom Server geladen:', saveId);
}

function hideStartScreen(): void {
    const startScreen = document.getElementById('start-screen');
    const container = document.getElementById('container');
    
    if (startScreen) {
        startScreen.style.display = 'none';
    }
    if (container) {
        container.style.display = 'grid';
    }
}
