// Load user data and stats
async function loadUserData() {
    try {
        const response = await fetch('/api/user/me');
        const data = await response.json();

        if (data.success) {
            const user = data.user;
            document.getElementById('displayName').textContent = user.displayName || user.username;

            // Update stats
            if (user.stats) {
                document.getElementById('citiesCreated').textContent = user.stats.cities_created || 0;
                document.getElementById('totalPopulation').textContent = (user.stats.total_population || 0).toLocaleString();
                document.getElementById('highestPopulation').textContent = (user.stats.highest_population || 0).toLocaleString();
                
                // Calculate playtime
                const hours = Math.floor((user.stats.total_playtime || 0) / 3600);
                document.getElementById('playtime').textContent = hours + 'h';
            }

            // Show admin link if user is admin
            if (user.role === 'admin') {
                document.getElementById('adminLink').style.display = 'block';
                document.getElementById('adminLink').href = '/admin';
            }
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Load game saves
async function loadSaves() {
    try {
        const response = await fetch('/api/saves');
        const data = await response.json();

        if (data.success) {
            const saves = data.saves;
            document.getElementById('saveCount').textContent = `${saves.length} Spielstände`;

            // Show recent saves (last 3)
            const recentSaves = saves.slice(0, 3);
            const savesList = document.getElementById('savesList');
            
            if (recentSaves.length === 0) {
                savesList.innerHTML = '<p class="empty-state">Keine Spielstände vorhanden</p>';
            } else {
                savesList.innerHTML = recentSaves.map(save => createSaveItem(save)).join('');
            }

            // Show all saves in modal
            const allSavesList = document.getElementById('allSavesList');
            if (saves.length === 0) {
                allSavesList.innerHTML = '<p class="empty-state">Keine Spielstände vorhanden</p>';
            } else {
                allSavesList.innerHTML = saves.map(save => createSaveItem(save)).join('');
            }
        }
    } catch (error) {
        console.error('Error loading saves:', error);
    }
}

function createSaveItem(save) {
    const date = new Date(save.updated_at).toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return `
        <div class="save-item">
            <div class="save-info">
                <h3>${escapeHtml(save.city_name || save.save_name)}</h3>
                <p>
                    👥 ${save.population.toLocaleString()} Einwohner | 
                    💰 ${save.money.toLocaleString()}$ | 
                    📅 Jahr ${save.game_year} | 
                    🕐 ${date}
                </p>
            </div>
            <div class="save-actions">
                <button class="btn btn-primary" onclick="loadSave(${save.id})">Laden</button>
                <button class="btn btn-danger" onclick="deleteSave(${save.id})">Löschen</button>
            </div>
        </div>
    `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function loadSave(saveId) {
    try {
        const response = await fetch(`/api/saves/${saveId}`);
        const data = await response.json();

        if (data.success) {
            // Store save data in sessionStorage
            sessionStorage.setItem('loadSaveData', JSON.stringify(data.save));
            // Redirect to game
            window.location.href = '/game';
        }
    } catch (error) {
        console.error('Error loading save:', error);
        alert('Fehler beim Laden des Spielstands');
    }
}

async function deleteSave(saveId) {
    if (!confirm('Möchten Sie diesen Spielstand wirklich löschen?')) {
        return;
    }

    try {
        const response = await fetch(`/api/saves/${saveId}`, {
            method: 'DELETE'
        });
        const data = await response.json();

        if (data.success) {
            loadSaves(); // Reload saves list
        } else {
            alert('Fehler beim Löschen: ' + data.message);
        }
    } catch (error) {
        console.error('Error deleting save:', error);
        alert('Fehler beim Löschen des Spielstands');
    }
}

// Logout
document.getElementById('logoutLink').addEventListener('click', async (e) => {
    e.preventDefault();
    
    if (confirm('Möchten Sie sich wirklich abmelden?')) {
        try {
            const response = await fetch('/api/logout', {
                method: 'POST'
            });
            const data = await response.json();

            if (data.success) {
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
});

// Initialize
loadUserData();
loadSaves();
