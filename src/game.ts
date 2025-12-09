import { CityMap } from './citymap.js';
import { AmberRenderer } from './renderer.js';
import { SimulationEngine } from './simulation.js';
import { TileType, ToolType, TILE_COSTS, Position, GameStats } from './types.js';

export class Game {
    private canvas: HTMLCanvasElement;
    private renderer: AmberRenderer;
    private cityMap: CityMap;
    private simulation: SimulationEngine;
    private currentTool: ToolType;
    private selectedTile: Position | null;
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
        this.renderer = new AmberRenderer(canvas);
        this.cityMap = new CityMap(this.MAP_WIDTH, this.MAP_HEIGHT);
        this.simulation = new SimulationEngine(this.cityMap);
        this.currentTool = 'residential';
        this.selectedTile = null;
        this.simulationInterval = null;
        this.isDragging = false;
        this.dragStartPos = null;
        this.dragEndPos = null;
        this.simulationSpeed = this.DEFAULT_SIMULATION_SPEED;
        this.isPanning = false;
        this.panStartPos = null;
        this.zoom = 1.0;
        this.offsetX = 0;
        this.offsetY = 0;

        this.stats = {
            money: 20000,
            population: 0,
            year: 1900,
            month: 0
        };

        this.setupEventListeners();
        this.startGameLoop();
        this.startSimulation();
    }

    private setupEventListeners(): void {
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
            
            // Linke Maustaste = Bauen
            if (e.button === 0 && !this.isPanning) {
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

            // Während des Ziehens
            if (this.isDragging && this.dragStartPos) {
                this.dragEndPos = pos;
                
                // Nur für Straßen und Stromleitungen: kontinuierlich platzieren
                if (this.currentTool === 'road' || this.currentTool === 'powerline') {
                    if (pos.x !== this.dragStartPos.x || pos.y !== this.dragStartPos.y) {
                        this.handleTileClick(pos.x, pos.y);
                        this.dragStartPos = pos;
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
            this.cityMap.setTileType(x, y, TileType.EMPTY);
            this.showInfo('Gebäude abgerissen');
            return;
        }

        const tileType = this.toolToTileType(this.currentTool);
        if (tileType === null) return;

        const cost = TILE_COSTS[tileType];
        
        // Auto-Abriss für Stromleitungen
        if (this.currentTool === 'powerline' && tile.type !== TileType.EMPTY) {
            // Kraftwerke und andere teure Gebäude nicht automatisch abreißen
            if (tile.type !== TileType.POWER_PLANT && 
                tile.type !== TileType.RESIDENTIAL && 
                tile.type !== TileType.COMMERCIAL && 
                tile.type !== TileType.INDUSTRIAL) {
                this.cityMap.setTileType(x, y, TileType.EMPTY);
            } else {
                this.showInfo('Kann teure Gebäude nicht überbauen!');
                return;
            }
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

        if (tileType === TileType.POWER_PLANT) {
            this.cityMap.updatePowerGrid();
        }
    }

    private toolToTileType(tool: ToolType): TileType | null {
        const mapping: Record<string, TileType> = {
            'residential': TileType.RESIDENTIAL,
            'commercial': TileType.COMMERCIAL,
            'industrial': TileType.INDUSTRIAL,
            'road': TileType.ROAD,
            'power': TileType.POWER_PLANT,
            'powerline': TileType.POWER_LINE,
            'park': TileType.PARK
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
            'bulldozer': 'Abriss'
        };
        return names[tool] ?? tool;
    }

    private showInfo(message: string): void {
        const infoElement = document.getElementById('tile-info');
        if (infoElement) {
            infoElement.textContent = message;
        }
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

        this.updateUI();
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

                // Ausgewählte Kachel markieren
                if (this.selectedTile && this.selectedTile.x === x && this.selectedTile.y === y) {
                    this.renderer.highlightTile(x, y);
                }
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
                this.renderer.drawRoad(x, y, roadConnections.north, roadConnections.east, 
                                      roadConnections.south, roadConnections.west);
                break;
            case TileType.POWER_PLANT:
                this.renderer.drawPowerPlant(x, y);
                break;
            case TileType.POWER_LINE:
                this.renderer.drawPowerLine(x, y);
                break;
            case TileType.PARK:
                this.renderer.drawPark(x, y);
                break;
        }

        // Kein-Strom-Indikator
        if (!tile.powered && tile.type !== TileType.EMPTY &&
            tile.type !== TileType.ROAD && tile.type !== TileType.POWER_LINE) {
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

    private startGameLoop(): void {
        const loop = () => {
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
