import { CityMap } from './citymap.js';
import { AmberRenderer } from './renderer.js';
import { SimulationEngine } from './simulation.js';
import { TileType, ToolType, TILE_COSTS, Position, GameStats, Vehicle } from './types.js';

export class Game {
    private canvas: HTMLCanvasElement;
    private renderer: AmberRenderer;
    private cityMap: CityMap;
    private simulation: SimulationEngine;
    private currentTool: ToolType;
    private selectedTile: Position | null;
    private selectedGridPos: Position | null;  // Tatsächlich ausgewähltes Tile
    private stats: GameStats;
    private simulationInterval: number | null;
    private isDragging: boolean;
    private dragStartPos: Position | null;
    private dragEndPos: Position | null;
    private simulationSpeed: number;
    private isPanning: boolean;
    private panStartPos: Position | null;
    private zoom: number;
    private offsetX: number;
    private offsetY: number;
    private vehicles: Vehicle[];
    private lastFrameTime: number;
    private deltaTime: number;
    private backgroundMusic: HTMLAudioElement[];
    private currentTrack: number;
    private clickSound: HTMLAudioElement;

    private readonly MAP_WIDTH = 45;
    private readonly MAP_HEIGHT = 30;
    private readonly DEFAULT_SIMULATION_SPEED = 2000; // ms
    private readonly MIN_ZOOM = 0.5;
    private readonly MAX_ZOOM = 3.0;

    constructor(canvasId: string) {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!canvas) {
            throw new Error(`Canvas mit ID '${canvasId}' nicht gefunden`);
        }

        this.canvas = canvas;
        
        // Canvas auf Fenstergröße setzen
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.renderer = new AmberRenderer(canvas);
        this.cityMap = new CityMap(this.MAP_WIDTH, this.MAP_HEIGHT);
        this.simulation = new SimulationEngine(this.cityMap);
        this.currentTool = 'residential';
        this.selectedTile = null;
        this.selectedGridPos = null;
        this.simulationInterval = null;
        this.isDragging = false;
        this.dragStartPos = null;
        this.dragEndPos = null;
        this.simulationSpeed = this.DEFAULT_SIMULATION_SPEED;
        this.isPanning = false;
        this.panStartPos = null;
        this.zoom = 1.5;  // Näher herangezoomt
        this.offsetX = 0;
        this.offsetY = 0;
        this.vehicles = [];
        this.lastFrameTime = performance.now();
        this.deltaTime = 0;
        this.backgroundMusic = [];
        this.currentTrack = 0;
        this.clickSound = new Audio('fx/click.wav');
        this.clickSound.volume = 0.5;  // 50% Lautstärke

        this.stats = {
            money: 20000,
            population: 0,
            year: 1900,
            month: 0,
            happiness: 100
        };

        this.setupEventListeners();
        this.setupSaveLoadButtons();
        this.setupBackgroundMusic();
        this.startGameLoop();
        this.startSimulation();
    }

    private setupBackgroundMusic(): void {
        // Lade beide Tracks
        const track1 = new Audio('songs/The_quietness_part1.mp3');
        const track2 = new Audio('songs/The_quietness_part2.mp3');
        
        track1.volume = 0.3;  // 30% Lautstärke
        track2.volume = 0.3;
        
        this.backgroundMusic = [track1, track2];
        
        // Event Listener für automatischen Wechsel
        track1.addEventListener('ended', () => {
            this.currentTrack = 1;
            this.backgroundMusic[1].play().catch(e => console.log('Audio playback failed:', e));
        });
        
        track2.addEventListener('ended', () => {
            this.currentTrack = 0;
            this.backgroundMusic[0].play().catch(e => console.log('Audio playback failed:', e));
        });
        
        // Starte ersten Track (nur nach User-Interaktion möglich)
        // Versuche beim ersten Click zu starten
        const startMusic = () => {
            this.backgroundMusic[0].play().catch(e => console.log('Audio playback failed:', e));
            document.removeEventListener('click', startMusic);
        };
        document.addEventListener('click', startMusic, { once: true });
    }

    private resizeCanvas(): void {
        const container = document.getElementById('game-area');
        if (container) {
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
        };
    }

    private setupSaveLoadButtons(): void {
        const saveBtn = document.getElementById('save-btn');
        const loadBtn = document.getElementById('load-btn');
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveGame());
        }
        if (loadBtn) {
            loadBtn.addEventListener('click', () => this.loadGame());
        }
    }

    private saveGame(): void {
        try {
            const saveName = prompt('Name f\u00fcr diese Stadt:', `Stadt_${this.stats.year}`);
            if (!saveName) return;
            
            const saveData = {
                map: this.cityMap.getAllTiles(),
                stats: this.stats,
                timestamp: Date.now()
            };
            
            const saveKey = `citysim_save_${saveName}`;
            localStorage.setItem(saveKey, JSON.stringify(saveData));
            this.showInfo('Spiel erfolgreich gespeichert als "' + saveName + '"!');
        } catch (e) {
            this.showInfo('Fehler beim Speichern: ' + (e as Error).message);
        }
    }

    private loadGame(): void {
        try {
            const saveDataStr = localStorage.getItem('citysim_save');
            if (!saveDataStr) {
                this.showInfo('Kein gespeichertes Spiel gefunden!');
                return;
            }
            
            const saveData = JSON.parse(saveDataStr);
            
            // Karte wiederherstellen
            const map = this.cityMap.getAllTiles();
            for (let y = 0; y < this.MAP_HEIGHT; y++) {
                for (let x = 0; x < this.MAP_WIDTH; x++) {
                    if (saveData.map[y] && saveData.map[y][x]) {
                        Object.assign(map[y][x], saveData.map[y][x]);
                    }
                }
            }
            
            // Stats wiederherstellen
            this.stats = saveData.stats;
            
            // Power Grid neu berechnen
            this.cityMap.updatePowerGrid();
            
            this.updateUI();
            this.showInfo('Spiel erfolgreich geladen!');
        } catch (e) {
            this.showInfo('Fehler beim Laden: ' + (e as Error).message);
        }
    }

    public loadGameFromKey(saveKey: string): void {
        try {
            const saveDataStr = localStorage.getItem(saveKey);
            if (!saveDataStr) {
                this.showInfo('Speicherstand nicht gefunden!');
                return;
            }
            
            const saveData = JSON.parse(saveDataStr);
            
            // Karte wiederherstellen
            const map = this.cityMap.getAllTiles();
            for (let y = 0; y < this.MAP_HEIGHT; y++) {
                for (let x = 0; x < this.MAP_WIDTH; x++) {
                    if (saveData.map[y] && saveData.map[y][x]) {
                        Object.assign(map[y][x], saveData.map[y][x]);
                    }
                }
            }
            
            // Stats wiederherstellen
            this.stats = saveData.stats;
            
            // Power Grid neu berechnen
            this.cityMap.updatePowerGrid();
            
            this.updateUI();
            this.showInfo('Stadt erfolgreich geladen!');
        } catch (e) {
            this.showInfo('Fehler beim Laden: ' + (e as Error).message);
        }
    }

    private setupEventListeners(): void {
        // Globaler Click-Sound für alle Mausklicks
        document.addEventListener('mousedown', () => {
            this.clickSound.currentTime = 0;  // Reset für schnelle Klicks
            this.clickSound.play().catch(e => console.log('Click sound failed:', e));
        });
        
        // Werkzeug-Auswahl
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                (e.target as HTMLElement).classList.add('active');
                this.currentTool = (e.target as HTMLElement).dataset.tool as ToolType;
            });
        });

        // Maus-Events
        this.canvas.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const pos = this.getCanvasPosition(e);
            
            // Mittlere Maustaste = Panning
            if (e.button === 1) {
                this.isPanning = true;
                this.panStartPos = { x: e.clientX - this.offsetX, y: e.clientY - this.offsetY };
                this.canvas.style.cursor = 'grab';
                return;
            }
            
            // Linke Maustaste = Bauen oder Auswählen
            if (e.button === 0 && !this.isPanning) {
                // Select-Modus: Tile auswählen
                if (this.currentTool === 'select') {
                    this.selectTileAt(pos.x, pos.y);
                    return;
                }
                
                this.isDragging = true;
                this.dragStartPos = pos;
                this.dragEndPos = pos;
                
                // Für Einzelklick
                if (this.currentTool === 'bulldozer') {
                    this.handleTileClick(pos.x, pos.y);
                }
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            e.preventDefault();
            
            // Panning
            if (this.isPanning && this.panStartPos) {
                this.offsetX = e.clientX - this.panStartPos.x;
                this.offsetY = e.clientY - this.panStartPos.y;
                this.canvas.style.cursor = 'grabbing';
                return;
            }
            
            const pos = this.getCanvasPosition(e);
            this.selectedTile = pos;
            
            // Cursor-Vorschau für 3x3 Kraftwerk
            if (this.currentTool === 'power') {
                this.selectedTile = { ...pos, width: 3, height: 3 };
            }

            // Während des Ziehens
            if (this.isDragging && this.dragStartPos) {
                let targetPos = pos;
                
                // Shift-Taste: Nur horizontale oder vertikale Verbindungen für Straßen/Stromleitungen
                if (e.shiftKey && (this.currentTool === 'road' || this.currentTool === 'powerline')) {
                    const dx = Math.abs(pos.x - this.dragStartPos.x);
                    const dy = Math.abs(pos.y - this.dragStartPos.y);
                    
                    // Entscheiden ob horizontal oder vertikal basierend auf größerer Distanz
                    if (dx > dy) {
                        // Horizontal - Y festhalten
                        targetPos = { x: pos.x, y: this.dragStartPos.y };
                    } else {
                        // Vertikal - X festhalten
                        targetPos = { x: this.dragStartPos.x, y: pos.y };
                    }
                    this.selectedTile = targetPos;
                }
                
                this.dragEndPos = targetPos;
                
                // Nur für Straßen und Stromleitungen: kontinuierlich platzieren
                if (this.currentTool === 'road' || this.currentTool === 'powerline') {
                    if (targetPos.x !== this.dragStartPos.x || targetPos.y !== this.dragStartPos.y) {
                        this.handleTileClick(targetPos.x, targetPos.y);
                        this.dragStartPos = targetPos;
                    }
                }
            }
        });

        this.canvas.addEventListener('mouseup', (e) => {
            if (this.isPanning) {
                this.isPanning = false;
                this.panStartPos = null;
                this.canvas.style.cursor = 'crosshair';
                return;
            }
            
            if (this.isDragging && this.dragStartPos && this.dragEndPos) {
                // Rechteck aufspannen für Gebäude
                if (this.currentTool === 'residential' || 
                    this.currentTool === 'commercial' || 
                    this.currentTool === 'industrial' ||
                    this.currentTool === 'park') {
                    this.handleAreaPlacement(this.dragStartPos, this.dragEndPos);
                } else if (this.currentTool !== 'road' && this.currentTool !== 'powerline') {
                    // Einzelplatzierung für andere Werkzeuge
                    this.handleTileClick(this.dragStartPos.x, this.dragStartPos.y);
                }
            }
            
            this.isDragging = false;
            this.dragStartPos = null;
            this.dragEndPos = null;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.selectedTile = null;
            this.isDragging = false;
            this.dragStartPos = null;
            this.dragEndPos = null;
            this.isPanning = false;
            this.panStartPos = null;
            this.canvas.style.cursor = 'crosshair';
        });

        // Zoom mit Mausrad
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = -Math.sign(e.deltaY);
            const zoomFactor = 0.1;
            const newZoom = this.zoom + delta * zoomFactor;
            
            if (newZoom >= this.MIN_ZOOM && newZoom <= this.MAX_ZOOM) {
                // Zoom zum Mauszeiger
                const rect = this.canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                const worldX = (mouseX - this.offsetX) / this.zoom;
                const worldY = (mouseY - this.offsetY) / this.zoom;
                
                this.zoom = newZoom;
                
                this.offsetX = mouseX - worldX * this.zoom;
                this.offsetY = mouseY - worldY * this.zoom;
            }
        }, { passive: false });

        // Geschwindigkeitsregler
        const speedSlider = document.getElementById('speed-slider') as HTMLInputElement;
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                const value = parseInt((e.target as HTMLInputElement).value);
                this.setSimulationSpeed(value);
                this.updateSpeedDisplay(value);
            });
        }
    }

    private getCanvasPosition(e: MouseEvent): Position {
        const rect = this.canvas.getBoundingClientRect();
        const tileSize = this.renderer.getTileSize();
        
        // Berücksichtige Zoom und Pan
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        
        const worldX = (canvasX - this.offsetX) / this.zoom;
        const worldY = (canvasY - this.offsetY) / this.zoom;
        
        return {
            x: Math.floor(worldX / tileSize),
            y: Math.floor(worldY / tileSize)
        };
    }

    private handleAreaPlacement(start: Position, end: Position): void {
        const minX = Math.min(start.x, end.x);
        const maxX = Math.max(start.x, end.x);
        const minY = Math.min(start.y, end.y);
        const maxY = Math.max(start.y, end.y);
        
        const tileType = this.toolToTileType(this.currentTool);
        if (tileType === null) return;
        
        const cost = TILE_COSTS[tileType];
        let tilesPlaced = 0;
        let totalCost = 0;
        
        // Zähle freie Kacheln
        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                const tile = this.cityMap.getTile(x, y);
                if (tile && tile.type === TileType.EMPTY) {
                    tilesPlaced++;
                    totalCost += cost;
                }
            }
        }
        
        if (totalCost > this.stats.money) {
            this.showInfo(`Nicht genug Geld! Benötigt: $${totalCost}, Verfügbar: $${this.stats.money}`);
            return;
        }
        
        // Platziere Gebäude
        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                const tile = this.cityMap.getTile(x, y);
                if (tile && tile.type === TileType.EMPTY) {
                    this.cityMap.setTileType(x, y, tileType);
                }
            }
        }
        
        this.stats.money -= totalCost;
        this.updateUI();
        this.showInfo(`${tilesPlaced} ${this.getToolName(this.currentTool)} gebaut für $${totalCost}`);
    }

    private handleTileClick(x: number, y: number): void {
        const tile = this.cityMap.getTile(x, y);
        if (!tile) return;

        if (this.currentTool === 'bulldozer') {
            // Prüfen ob es ein Kraftwerk (3x3) ist
            const targetTile = this.cityMap.getTile(x, y);
            if (targetTile && targetTile.type === TileType.POWER_PLANT) {
                // Finde die obere linke Ecke des 3x3 Kraftwerks
                let startX = x;
                let startY = y;
                
                // Nach links suchen (max 2 Schritte)
                for (let i = 1; i <= 2; i++) {
                    if (x - i >= 0 && this.cityMap.getTile(x - i, y)?.type === TileType.POWER_PLANT) {
                        startX = x - i;
                    } else {
                        break;
                    }
                }
                
                // Nach oben suchen (max 2 Schritte)
                for (let i = 1; i <= 2; i++) {
                    if (y - i >= 0 && this.cityMap.getTile(startX, y - i)?.type === TileType.POWER_PLANT) {
                        startY = y - i;
                    } else {
                        break;
                    }
                }
                
                // Alle 9 Tiles des Kraftwerks abreißen
                for (let dy = 0; dy < 3; dy++) {
                    for (let dx = 0; dx < 3; dx++) {
                        if (this.cityMap.isValidPosition(startX + dx, startY + dy)) {
                            this.cityMap.setTileType(startX + dx, startY + dy, TileType.EMPTY);
                            this.cityMap.setPowerLine(startX + dx, startY + dy, false);
                        }
                    }
                }
                this.showInfo('Kraftwerk abgerissen');
            } else {
                // Normales Gebäude abreißen
                this.cityMap.setTileType(x, y, TileType.EMPTY);
                this.cityMap.setPowerLine(x, y, false);
                this.showInfo('Gebäude abgerissen');
            }
            this.cityMap.updatePowerGrid();
            return;
        }

        // Stromleitungen als Overlay behandeln
        if (this.currentTool === 'powerline') {
            const cost = TILE_COSTS[TileType.POWER_LINE];
            
            if (this.stats.money < cost) {
                this.showInfo(`Nicht genug Geld! Benötigt: $${cost}, Verfügbar: $${this.stats.money}`);
                return;
            }
            
            // Stromleitung auf dieser Kachel setzen
            if (!tile.powerLine) {
                this.cityMap.setPowerLine(x, y, true);
                this.stats.money -= cost;
                this.updateUI();
                this.cityMap.updatePowerGrid();
                this.showInfo(`Stromleitung verlegt für $${cost}`);
            }
            return;
        }

        const tileType = this.toolToTileType(this.currentTool);
        if (tileType === null) return;

        const cost = TILE_COSTS[tileType];
        
        // Kraftwerk benötigt 3x3 Kacheln
        if (tileType === TileType.POWER_PLANT) {
            if (x >= this.MAP_WIDTH - 2 || y >= this.MAP_HEIGHT - 2) {
                this.showInfo('Kraftwerk benötigt 3x3 Kacheln - zu nah am Rand!');
                return;
            }
            
            // Prüfe alle 9 Kacheln
            for (let dy = 0; dy < 3; dy++) {
                for (let dx = 0; dx < 3; dx++) {
                    const checkTile = this.cityMap.getTile(x + dx, y + dy);
                    if (!checkTile || checkTile.type !== TileType.EMPTY) {
                        this.showInfo('Kraftwerk benötigt 3x3 freie Kacheln!');
                        return;
                    }
                }
            }
            
            if (this.stats.money < cost) {
                this.showInfo(`Nicht genug Geld! Benötigt: $${cost}, Verfügbar: $${this.stats.money}`);
                return;
            }
            
            // Baue Kraftwerk auf allen 9 Kacheln
            this.stats.money -= cost;
            for (let dy = 0; dy < 3; dy++) {
                for (let dx = 0; dx < 3; dx++) {
                    this.cityMap.setTileType(x + dx, y + dy, TileType.POWER_PLANT);
                }
            }
            this.updateUI();
            this.showInfo(`Kraftwerk gebaut für $${cost}`);
            this.cityMap.updatePowerGrid();
            return;
        }
        
        if (tile.type !== TileType.EMPTY) {
            // Beim Ziehen von Straßen/Stromleitungen über bebaute Felder nicht nochmal meckern
            if (!this.isDragging) {
                this.showInfo('Kachel ist bereits bebaut!');
            }
            return;
        }
        
        if (this.stats.money < cost) {
            this.showInfo(`Nicht genug Geld! Benötigt: $${cost}, Verfügbar: $${this.stats.money}`);
            return;
        }
        
        this.stats.money -= cost;
        this.cityMap.setTileType(x, y, tileType);
        this.updateUI();
        this.showInfo(`${this.getToolName(this.currentTool)} gebaut für $${cost}`);
    }

    private toolToTileType(tool: ToolType): TileType | null {
        const mapping: Record<string, TileType> = {
            'residential': TileType.RESIDENTIAL,
            'commercial': TileType.COMMERCIAL,
            'industrial': TileType.INDUSTRIAL,
            'road': TileType.ROAD,
            'power': TileType.POWER_PLANT,
            'powerline': TileType.POWER_LINE,
            'park': TileType.PARK,
            'hospital': TileType.HOSPITAL,
            'police': TileType.POLICE
        };
        return mapping[tool] ?? null;
    }

    private getToolName(tool: ToolType): string {
        const names: Record<string, string> = {
            'residential': 'Wohngebiet',
            'commercial': 'Gewerbe',
            'industrial': 'Industrie',
            'road': 'Straße',
            'power': 'Kraftwerk',
            'powerline': 'Stromleitung',
            'park': 'Park',
            'hospital': 'Krankenhaus',
            'police': 'Polizeistation',
            'bulldozer': 'Abriss',
            'select': 'Auswählen'
        };
        return names[tool] ?? tool;
    }

    private getTileTypeName(type: TileType): string {
        const names: Record<TileType, string> = {
            [TileType.EMPTY]: 'Leer',
            [TileType.RESIDENTIAL]: 'Wohngebiet',
            [TileType.COMMERCIAL]: 'Gewerbe',
            [TileType.INDUSTRIAL]: 'Industrie',
            [TileType.ROAD]: 'Straße',
            [TileType.POWER_PLANT]: 'Kraftwerk',
            [TileType.POWER_LINE]: 'Stromleitung',
            [TileType.PARK]: 'Park',
            [TileType.HOSPITAL]: 'Krankenhaus',
            [TileType.POLICE]: 'Polizeistation'
        };
        return names[type] ?? 'Unbekannt';
    }

    private showInfo(message: string): void {
        const infoElement = document.getElementById('tile-info');
        if (infoElement) {
            infoElement.textContent = message;
        }
    }

    private selectTileAt(x: number, y: number): void {
        if (!this.cityMap.isValidPosition(x, y)) return;
        
        this.selectedGridPos = { x, y };
        this.updatePropertyPanel();
    }

    private updatePropertyPanel(): void {
        const panel = document.getElementById('property-content');
        if (!panel) return;

        if (!this.selectedGridPos) {
            panel.innerHTML = '<p class="property-hint">Klicke auf ein Gebäude um Details zu sehen</p>';
            return;
        }

        const tile = this.cityMap.getTile(this.selectedGridPos.x, this.selectedGridPos.y);
        if (!tile) {
            panel.innerHTML = '<p class="property-hint">Ungültige Position</p>';
            return;
        }

        if (tile.type === TileType.EMPTY) {
            panel.innerHTML = '<p class="property-hint">Leere Fläche</p>';
            return;
        }

        // Gebäude-Eigenschaften anzeigen
        let html = `<div class="property-title">${this.getTileTypeName(tile.type)}</div>`;
        
        html += `<div class="property-item">
            <span class="property-label">Position</span>
            <span class="property-value">X: ${this.selectedGridPos.x}, Y: ${this.selectedGridPos.y}</span>
        </div>`;

        html += `<div class="property-item">
            <span class="property-label">Stromversorgung</span>
            <span class="property-value">${tile.powered ? '✓ Ja' : '✗ Nein'}</span>
        </div>`;

        if (tile.type === TileType.RESIDENTIAL || 
            tile.type === TileType.COMMERCIAL || 
            tile.type === TileType.INDUSTRIAL) {
            html += `<div class="property-item">
                <span class="property-label">Entwicklung</span>
                <span class="property-value">Level ${tile.development}/3</span>
            </div>`;
        }

        if (tile.type === TileType.RESIDENTIAL) {
            html += `<div class="property-item">
                <span class="property-label">Bevölkerung</span>
                <span class="property-value">${tile.population}</span>
            </div>`;
        }

        if (tile.type === TileType.ROAD) {
            html += `<div class="property-item">
                <span class="property-label">Verkehr</span>
                <span class="property-value">${tile.traffic}%</span>
            </div>`;

            if (tile.trafficLight) {
                html += `<div class="property-item">
                    <span class="property-label">Ampel</span>
                    <span class="property-value">Kreuzung</span>
                </div>`;
            }
        }

        if (tile.powerLine) {
            html += `<div class="property-item">
                <span class="property-label">Stromleitung</span>
                <span class="property-value">✓ Ja</span>
            </div>`;
        }

        panel.innerHTML = html;
    }

    private startSimulation(): void {
        this.simulationInterval = window.setInterval(() => {
            this.runSimulationStep();
        }, this.simulationSpeed);
    }

    public setSimulationSpeed(speed: number): void {
        this.simulationSpeed = speed;
        // Simulation neu starten mit neuer Geschwindigkeit
        if (this.simulationInterval !== null) {
            clearInterval(this.simulationInterval);
            this.startSimulation();
        }
    }

    private runSimulationStep(): void {
        this.stats.month++;
        if (this.stats.month >= 12) {
            this.stats.month = 0;
            this.stats.year++;
        }

        const income = this.simulation.simulate();
        this.stats.money += income;
        this.stats.population = this.cityMap.calculatePopulation();
        
        // Verkehr auf Straßen berechnen
        this.updateTraffic();
        
        // Ampeln aktualisieren und schalten
        this.cityMap.updateTrafficLights();
        this.cycleTrafficLights();
        
        // Zufriedenheit berechnen
        this.updateHappiness();

        this.updateUI();
    }

    private updateHappiness(): void {
        const map = this.cityMap.getAllTiles();
        let hospitals = 0;
        let policeStations = 0;
        
        // Zähle Services
        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                const tile = map[y][x];
                if (tile.type === TileType.HOSPITAL) hospitals++;
                if (tile.type === TileType.POLICE) policeStations++;
            }
        }
        
        // Berechne Zufriedenheit basierend auf Bevölkerung und Services
        // Basis: 100%
        let happiness = 100;
        
        // Pro 5000 Einwohner brauchen wir mindestens 1 Krankenhaus
        const neededHospitals = Math.ceil(this.stats.population / 5000);
        const hospitalDeficit = Math.max(0, neededHospitals - hospitals);
        happiness -= hospitalDeficit * 10; // -10% pro fehlendem Krankenhaus
        
        // Pro 5000 Einwohner brauchen wir mindestens 1 Polizeistation
        const neededPolice = Math.ceil(this.stats.population / 5000);
        const policeDeficit = Math.max(0, neededPolice - policeStations);
        happiness -= policeDeficit * 10; // -10% pro fehlender Polizeistation
        
        // Begrenzen auf 0-100
        this.stats.happiness = Math.max(0, Math.min(100, happiness));
        
        // UI aktualisieren
        this.updateHappinessUI(hospitals, policeStations);
    }

    private updateHappinessUI(hospitals: number, policeStations: number): void {
        const happinessBar = document.getElementById('happiness-bar');
        const happinessValue = document.getElementById('happiness-value');
        const hospitalCount = document.getElementById('hospital-count');
        const policeCount = document.getElementById('police-count');
        
        if (happinessBar) {
            happinessBar.style.width = `${this.stats.happiness}%`;
            
            // Farbe je nach Zufriedenheit
            if (this.stats.happiness >= 70) {
                happinessBar.style.background = 'linear-gradient(90deg, #27ae60 0%, #2ecc71 100%)';
            } else if (this.stats.happiness >= 40) {
                happinessBar.style.background = 'linear-gradient(90deg, #f39c12 0%, #f1c40f 100%)';
            } else {
                happinessBar.style.background = 'linear-gradient(90deg, #e74c3c 0%, #c0392b 100%)';
            }
        }
        
        if (happinessValue) {
            happinessValue.textContent = `${Math.round(this.stats.happiness)}%`;
            
            // Farbe des Texts anpassen
            if (this.stats.happiness >= 70) {
                happinessValue.style.color = '#2ecc71';
            } else if (this.stats.happiness >= 40) {
                happinessValue.style.color = '#f1c40f';
            } else {
                happinessValue.style.color = '#e74c3c';
            }
        }
        
        if (hospitalCount) hospitalCount.textContent = hospitals.toString();
        if (policeCount) policeCount.textContent = policeStations.toString();
    }

    // Ampeln zwischen RED_NS und RED_EW wechseln
    private cycleTrafficLights(): void {
        const map = this.cityMap.getAllTiles();
        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                const tile = map[y][x];
                if (tile.trafficLight) {
                    // Zwischen 1 (RED_NS) und 2 (RED_EW) wechseln
                    tile.trafficLight = tile.trafficLight === 1 ? 2 : 1;
                }
            }
        }
    }

    private updateUI(): void {
        const popElement = document.getElementById('population');
        const moneyElement = document.getElementById('money');
        const yearElement = document.getElementById('year');

        if (popElement) popElement.textContent = this.stats.population.toString();
        if (moneyElement) moneyElement.textContent = this.stats.money.toString();
        if (yearElement) yearElement.textContent = this.stats.year.toString();
    }

    private updateSpeedDisplay(speed: number): void {
        const speedDisplay = document.getElementById('speed-display');
        if (speedDisplay) {
            const speedLabels: Record<number, string> = {
                500: 'Sehr Schnell',
                1000: 'Schnell',
                2000: 'Normal',
                4000: 'Langsam',
                8000: 'Sehr Langsam'
            };
            speedDisplay.textContent = speedLabels[speed] || 'Normal';
        }
    }

    private render(): void {
        const tileSize = this.renderer.getTileSize();
        const ctx = this.canvas.getContext('2d')!;
        
        // Bildschirm löschen
        this.renderer.clearScreen(this.canvas.width, this.canvas.height);

        // Transformationen für Zoom und Pan
        ctx.save();
        ctx.translate(this.offsetX, this.offsetY);
        ctx.scale(this.zoom, this.zoom);

        // Alle Kacheln zeichnen
        const map = this.cityMap.getAllTiles();
        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                const tile = map[y][x];
                const px = x * tileSize;
                const py = y * tileSize;

                this.renderTile(px, py, tile, x, y);
            }
        }
        
        // Ausgewählte Kachel(n) markieren
        if (this.selectedTile) {
            if (this.selectedTile.width && this.selectedTile.height) {
                // Multi-Tile Highlight (z.B. 2x2 Kraftwerk)
                this.renderer.drawMultiTileHighlight(
                    this.selectedTile.x, 
                    this.selectedTile.y, 
                    this.selectedTile.width, 
                    this.selectedTile.height
                );
            } else {
                // Einzelne Kachel
                this.renderer.highlightTile(this.selectedTile.x, this.selectedTile.y);
            }
        }

        // Gitter zeichnen
        this.renderer.drawGrid(this.MAP_WIDTH, this.MAP_HEIGHT);
        
        // Drag-Rechteck zeichnen
        if (this.isDragging && this.dragStartPos && this.dragEndPos && 
            (this.currentTool === 'residential' || this.currentTool === 'commercial' || 
             this.currentTool === 'industrial' || this.currentTool === 'park')) {
            this.renderer.drawDragRect(this.dragStartPos, this.dragEndPos);
        }
        
        ctx.restore();
    }

    private renderTile(x: number, y: number, tile: any, gridX: number, gridY: number): void {
        switch (tile.type) {
            case TileType.RESIDENTIAL:
                this.renderer.drawResidential(x, y, tile.development, tile.powered, tile.variant || 0);
                break;
            case TileType.COMMERCIAL:
                this.renderer.drawCommercial(x, y, tile.development, tile.powered, tile.variant || 0);
                break;
            case TileType.INDUSTRIAL:
                this.renderer.drawIndustrial(x, y, tile.development, tile.powered, tile.variant || 0);
                break;
            case TileType.ROAD:
                const roadConnections = this.getRoadConnections(gridX, gridY);
                const roadVehicles = this.vehicles.filter(v => v.tileX === gridX && v.tileY === gridY);
                this.renderer.drawRoad(x, y, roadConnections.north, roadConnections.east, 
                                      roadConnections.south, roadConnections.west, tile.traffic, roadVehicles);
                
                // Ampel zeichnen falls vorhanden
                if (tile.trafficLight) {
                    this.renderer.drawTrafficLight(x, y, tile.trafficLight);
                }
                break;
            case TileType.POWER_PLANT:
                // Nur auf der Hauptkachel (linke obere) zeichnen
                // Prüfe ob dies die linke obere Ecke eines 3x3 Kraftwerks ist
                const isMainPowerPlant = (gridX === 0 || this.cityMap.getTile(gridX - 1, gridY)?.type !== TileType.POWER_PLANT) &&
                                         (gridY === 0 || this.cityMap.getTile(gridX, gridY - 1)?.type !== TileType.POWER_PLANT);
                if (isMainPowerPlant) {
                    this.renderer.drawPowerPlant(x, y);
                }
                break;
            case TileType.PARK:
                this.renderer.drawPark(x, y, tile.variant);
                break;
            case TileType.HOSPITAL:
                this.renderer.drawHospital(x, y, tile.powered);
                break;
            case TileType.POLICE:
                this.renderer.drawPolice(x, y, tile.powered);
                break;
        }
        
        // Stromleitung als Overlay zeichnen
        if (tile.powerLine) {
            const powerConnections = this.getPowerLineConnections(gridX, gridY);
            this.renderer.drawPowerLine(x, y, powerConnections.north, powerConnections.east,
                                       powerConnections.south, powerConnections.west);
        }

        // Kein-Strom-Indikator
        if (!tile.powered && tile.type !== TileType.EMPTY &&
            tile.type !== TileType.ROAD && !tile.powerLine) {
            this.renderer.drawNoPowerIndicator(x, y);
        }
    }

    private getRoadConnections(x: number, y: number): { north: boolean, east: boolean, south: boolean, west: boolean } {
        const map = this.cityMap.getAllTiles();
        
        const hasNorth = y > 0 && map[y - 1][x].type === TileType.ROAD;
        const hasEast = x < this.MAP_WIDTH - 1 && map[y][x + 1].type === TileType.ROAD;
        const hasSouth = y < this.MAP_HEIGHT - 1 && map[y + 1][x].type === TileType.ROAD;
        const hasWest = x > 0 && map[y][x - 1].type === TileType.ROAD;
        
        return { north: hasNorth, east: hasEast, south: hasSouth, west: hasWest };
    }

    private updateTraffic(): void {
        const map = this.cityMap.getAllTiles();
        
        // Verkehrsdichte für jede Straße basierend auf angrenzenden Gebäuden berechnen
        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                const tile = map[y][x];
                if (tile.type === TileType.ROAD) {
                    let traffic = 0;
                    
                    // Angrenzende Gebäude zählen
                    const neighbors = [
                        y > 0 ? map[y-1][x] : null,
                        y < this.MAP_HEIGHT - 1 ? map[y+1][x] : null,
                        x > 0 ? map[y][x-1] : null,
                        x < this.MAP_WIDTH - 1 ? map[y][x+1] : null
                    ];
                    
                    for (const neighbor of neighbors) {
                        if (neighbor && (neighbor.type === TileType.RESIDENTIAL || 
                            neighbor.type === TileType.COMMERCIAL || 
                            neighbor.type === TileType.INDUSTRIAL)) {
                            traffic += neighbor.population + (neighbor.development * 10);
                        }
                    }
                    
                    tile.traffic = Math.min(100, traffic);
                    
                    // Fahrzeuge basierend auf Verkehrsdichte erstellen (höhere Spawn-Rate)
                    if (tile.traffic > 20 && Math.random() < 0.3) {
                        this.spawnVehicle(x, y);
                    }
                }
            }
        }
    }

    private spawnVehicle(tileX: number, tileY: number): void {
        const tileSize = this.renderer.getTileSize();
        const colors = ['#f1c40f', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6'];
        const directions: Array<'north' | 'south' | 'east' | 'west'> = ['north', 'south', 'east', 'west'];
        
        const direction = directions[Math.floor(Math.random() * directions.length)];
        
        // Rechtsverkehr: Spur basierend auf Richtung
        // Nord/Süd: Nord fährt rechts (right), Süd fährt links (left)
        // Ost/West: Ost fährt unten (right), West fährt oben (left)
        let lane: 'left' | 'right';
        if (direction === 'north' || direction === 'east') {
            lane = 'right';  // Rechte Fahrbahn
        } else {
            lane = 'left';   // Linke Fahrbahn (Gegenverkehr)
        }
        
        // Startposition basierend auf Richtung und Fahrspur
        let startX = tileX * tileSize + tileSize / 2;
        let startY = tileY * tileSize + tileSize / 2;
        
        // Offset für Fahrspuren (3.5 Pixel vom Zentrum)
        const laneOffset = 3.5;
        if (direction === 'north' || direction === 'south') {
            startX += lane === 'right' ? laneOffset : -laneOffset;
        } else {
            startY += lane === 'right' ? laneOffset : -laneOffset;
        }
        
        const vehicle: Vehicle = {
            tileX,
            tileY,
            x: startX,
            y: startY,
            direction,
            speed: 0.5 + Math.random() * 1.5,  // Varianz: 0.5-2.0 Pixel/Frame (langsam bis schnell)
            color: colors[Math.floor(Math.random() * colors.length)],
            lane,
            stopped: false,
            turning: false,
            turnProgress: 0
        };
        
        this.vehicles.push(vehicle);
        
        // Maximale Anzahl Fahrzeuge begrenzen (erhöht für mehr Verkehr)
        if (this.vehicles.length > 200) {
            this.vehicles.shift();
        }
    }

    private updateVehicles(): void {
        const tileSize = this.renderer.getTileSize();
        const map = this.cityMap.getAllTiles();
        
        // DeltaTime-Multiplikator für gleichmäßige Bewegung (60 FPS Basis)
        const speedMultiplier = this.deltaTime * 60;
        
        for (let i = this.vehicles.length - 1; i >= 0; i--) {
            const vehicle = this.vehicles[i];
            
            // Aktuelles Tile prüfen
            const currentTile = map[vehicle.tileY]?.[vehicle.tileX];
            
            // Ampelstatus prüfen
            vehicle.stopped = false;
            if (currentTile?.trafficLight) {
                const isNorthSouth = vehicle.direction === 'north' || vehicle.direction === 'south';
                const isRedForMe = (currentTile.trafficLight === 1 && isNorthSouth) ||  // RED_NS
                                   (currentTile.trafficLight === 2 && !isNorthSouth);   // RED_EW
                
                if (isRedForMe) {
                    vehicle.stopped = true;
                }
            }
            
            // Kollisionserkennung: Prüfe ob Fahrzeug vor uns ist
            if (!vehicle.stopped) {
                const vehicleAhead = this.checkVehicleAhead(vehicle, i);
                if (vehicleAhead) {
                    vehicle.stopped = true;
                }
            }
            
            // Fahrzeug nur bewegen wenn nicht gestoppt
            if (!vehicle.stopped) {
                const moveSpeed = vehicle.speed * speedMultiplier;
                
                // Wenn Fahrzeug gerade abbiegt, nutze Kurven-Animation
                if (vehicle.turning && vehicle.turnProgress !== undefined && 
                    vehicle.turnFrom && vehicle.turnStartX !== undefined && vehicle.turnStartY !== undefined) {
                    
                    // Erhöhe Kurven-Fortschritt
                    vehicle.turnProgress += moveSpeed / 12; // Kurve über ~12 Pixel
                    
                    if (vehicle.turnProgress >= 1) {
                        // Kurve abgeschlossen
                        vehicle.turning = false;
                        vehicle.turnProgress = 0;
                        
                        // Setze finale Position
                        const tileSize = this.renderer.getTileSize();
                        const laneOffset = 3.5;
                        const centerX = vehicle.tileX * tileSize + tileSize / 2;
                        const centerY = vehicle.tileY * tileSize + tileSize / 2;
                        
                        if (vehicle.direction === 'north' || vehicle.direction === 'south') {
                            vehicle.x = centerX + (vehicle.lane === 'right' ? laneOffset : -laneOffset);
                        } else {
                            vehicle.y = centerY + (vehicle.lane === 'right' ? laneOffset : -laneOffset);
                        }
                    } else {
                        // Berechne Kurven-Position (Bezier-Kurve)
                        const t = vehicle.turnProgress;
                        const tileSize = this.renderer.getTileSize();
                        const laneOffset = 3.5;
                        
                        // Start- und Endpositionen
                        const startX = vehicle.turnStartX;
                        const startY = vehicle.turnStartY;
                        
                        const centerX = vehicle.tileX * tileSize + tileSize / 2;
                        const centerY = vehicle.tileY * tileSize + tileSize / 2;
                        
                        let endX = centerX;
                        let endY = centerY;
                        if (vehicle.direction === 'north' || vehicle.direction === 'south') {
                            endX = centerX + (vehicle.lane === 'right' ? laneOffset : -laneOffset);
                        } else {
                            endY = centerY + (vehicle.lane === 'right' ? laneOffset : -laneOffset);
                        }
                        
                        // Kontrollpunkt für sanfte Kurve
                        const ctrlX = (startX + endX) / 2;
                        const ctrlY = (startY + endY) / 2;
                        
                        // Quadratische Bezier-Kurve
                        vehicle.x = (1-t)*(1-t)*startX + 2*(1-t)*t*ctrlX + t*t*endX;
                        vehicle.y = (1-t)*(1-t)*startY + 2*(1-t)*t*ctrlY + t*t*endY;
                    }
                } else {
                    // Normale Bewegung
                    switch (vehicle.direction) {
                        case 'north':
                            vehicle.y -= moveSpeed;
                            break;
                        case 'south':
                            vehicle.y += moveSpeed;
                            break;
                        case 'east':
                            vehicle.x += moveSpeed;
                            break;
                        case 'west':
                            vehicle.x -= moveSpeed;
                            break;
                    }
                }
            }
            
            // Tile-Position aktualisieren
            const newTileX = Math.floor(vehicle.x / tileSize);
            const newTileY = Math.floor(vehicle.y / tileSize);
            
            // Prüfe ob Fahrzeug außerhalb der Karte ist
            if (newTileX < 0 || newTileX >= this.MAP_WIDTH ||
                newTileY < 0 || newTileY >= this.MAP_HEIGHT) {
                this.vehicles.splice(i, 1);
                continue;
            }
            
            // Wenn Fahrzeug Tile-Grenze überschreitet, prüfe ob abbiegen nötig
            if (newTileX !== vehicle.tileX || newTileY !== vehicle.tileY) {
                // Prüfe ob neues Tile eine Straße ist
                const newTile = map[newTileY][newTileX];
                if (newTile.type !== TileType.ROAD) {
                    // Nicht auf Straße - entfernen
                    this.vehicles.splice(i, 1);
                    continue;
                }
                
                vehicle.tileX = newTileX;
                vehicle.tileY = newTileY;
                
                // Neue Richtung wählen basierend auf Verbindungen
                const connections = this.getRoadConnections(vehicle.tileX, vehicle.tileY);
                this.updateVehicleDirection(vehicle, connections);
            }
        }
    }

    private updateVehicleDirection(vehicle: Vehicle, connections: { north: boolean, east: boolean, south: boolean, west: boolean }): void {
        const possibleDirections: Array<'north' | 'south' | 'east' | 'west'> = [];
        const tileSize = this.renderer.getTileSize();
        const laneOffset = 3.5;
        
        // Sammle mögliche Richtungen (nicht zurück)
        if (connections.north && vehicle.direction !== 'south') possibleDirections.push('north');
        if (connections.south && vehicle.direction !== 'north') possibleDirections.push('south');
        if (connections.east && vehicle.direction !== 'west') possibleDirections.push('east');
        if (connections.west && vehicle.direction !== 'east') possibleDirections.push('west');
        
        const oldDirection = vehicle.direction;
        
        // Wenn nur eine Möglichkeit: gehe diese Richtung
        if (possibleDirections.length === 1) {
            vehicle.direction = possibleDirections[0];
        }
        // Wenn mehrere Möglichkeiten: bevorzuge geradeaus, sonst zufällig abbiegen
        else if (possibleDirections.length > 1) {
            // Versuche geradeaus zu bleiben
            if (!possibleDirections.includes(vehicle.direction)) {
                // Muss abbiegen - wähle zufällige neue Richtung
                vehicle.direction = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
            }
            // Ansonsten geradeaus weiterfahren
        }
        
        // Wenn Richtung geändert wurde, starte Kurven-Animation
        if (oldDirection !== vehicle.direction) {
            // Rechtsverkehr: Spur basierend auf neue Richtung
            if (vehicle.direction === 'north' || vehicle.direction === 'east') {
                vehicle.lane = 'right';
            } else {
                vehicle.lane = 'left';
            }
            
            // Starte Kurven-Animation
            vehicle.turning = true;
            vehicle.turnProgress = 0;
            vehicle.turnFrom = oldDirection;
            vehicle.turnStartX = vehicle.x;
            vehicle.turnStartY = vehicle.y;
        }
    }

    private checkVehicleAhead(vehicle: Vehicle, currentIndex: number): Vehicle | null {
        const safeDistance = 8; // Mindestabstand in Pixeln
        
        // Prüfe alle anderen Fahrzeuge
        for (let i = 0; i < this.vehicles.length; i++) {
            if (i === currentIndex) continue; // Nicht sich selbst prüfen
            
            const other = this.vehicles[i];
            
            // Nur Fahrzeuge in gleicher Richtung und Spur prüfen
            if (other.direction !== vehicle.direction || other.lane !== vehicle.lane) {
                continue;
            }
            
            // Berechne ob anderes Fahrzeug vor uns ist
            let isAhead = false;
            let distance = 0;
            
            switch (vehicle.direction) {
                case 'north':
                    isAhead = other.y < vehicle.y;
                    distance = vehicle.y - other.y;
                    break;
                case 'south':
                    isAhead = other.y > vehicle.y;
                    distance = other.y - vehicle.y;
                    break;
                case 'east':
                    isAhead = other.x > vehicle.x;
                    distance = other.x - vehicle.x;
                    break;
                case 'west':
                    isAhead = other.x < vehicle.x;
                    distance = vehicle.x - other.x;
                    break;
            }
            
            // Wenn Fahrzeug vor uns und zu nah, stoppen
            if (isAhead && distance < safeDistance) {
                return other;
            }
        }
        
        return null;
    }

    private getPowerLineConnections(x: number, y: number): { north: boolean, east: boolean, south: boolean, west: boolean } {
        const map = this.cityMap.getAllTiles();
        
        // Verbindungen zu anderen Stromleitungen oder Kraftwerken
        const hasNorth = y > 0 && (map[y - 1][x].powerLine || map[y - 1][x].type === TileType.POWER_PLANT);
        const hasEast = x < this.MAP_WIDTH - 1 && (map[y][x + 1].powerLine || map[y][x + 1].type === TileType.POWER_PLANT);
        const hasSouth = y < this.MAP_HEIGHT - 1 && (map[y + 1][x].powerLine || map[y + 1][x].type === TileType.POWER_PLANT);
        const hasWest = x > 0 && (map[y][x - 1].powerLine || map[y][x - 1].type === TileType.POWER_PLANT);
        
        return { north: hasNorth, east: hasEast, south: hasSouth, west: hasWest };
    }

    private startGameLoop(): void {
        const loop = (currentTime: number) => {
            // Delta time in Sekunden berechnen
            this.deltaTime = (currentTime - this.lastFrameTime) / 1000;
            this.lastFrameTime = currentTime;
            
            // Fahrzeuge in jedem Frame bewegen (nicht nur bei Simulation)
            this.updateVehicles();
            
            this.render();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    public destroy(): void {
        if (this.simulationInterval !== null) {
            clearInterval(this.simulationInterval);
        }
    }
}
