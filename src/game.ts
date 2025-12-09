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
    private simulationSpeed: number;

    private readonly MAP_WIDTH = 45;
    private readonly MAP_HEIGHT = 30;
    private readonly DEFAULT_SIMULATION_SPEED = 2000; // ms

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
        this.simulationSpeed = this.DEFAULT_SIMULATION_SPEED;

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

        // Canvas-Klick (für einzelne Platzierung)
        this.canvas.addEventListener('click', (e) => {
            if (!this.isDragging) {
                const pos = this.getCanvasPosition(e);
                this.handleTileClick(pos.x, pos.y);
            }
        });

        // Drag & Drop für Straßen und Stromleitungen
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.currentTool === 'road' || this.currentTool === 'powerline') {
                const pos = this.getCanvasPosition(e);
                this.isDragging = true;
                this.dragStartPos = pos;
                this.handleTileClick(pos.x, pos.y);
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const pos = this.getCanvasPosition(e);
            this.selectedTile = pos;

            // Während des Ziehens platzieren
            if (this.isDragging && this.dragStartPos) {
                if (pos.x !== this.dragStartPos.x || pos.y !== this.dragStartPos.y) {
                    this.handleTileClick(pos.x, pos.y);
                    this.dragStartPos = pos;
                }
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.dragStartPos = null;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.selectedTile = null;
            this.isDragging = false;
            this.dragStartPos = null;
        });

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
        return {
            x: Math.floor((e.clientX - rect.left) / tileSize),
            y: Math.floor((e.clientY - rect.top) / tileSize)
        };
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
        
        // Bildschirm löschen
        this.renderer.clearScreen(this.canvas.width, this.canvas.height);

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
    }

    private renderTile(x: number, y: number, tile: any, gridX: number, gridY: number): void {
        switch (tile.type) {
            case TileType.RESIDENTIAL:
                this.renderer.drawResidential(x, y, tile.development, tile.powered);
                break;
            case TileType.COMMERCIAL:
                this.renderer.drawCommercial(x, y, tile.development, tile.powered);
                break;
            case TileType.INDUSTRIAL:
                this.renderer.drawIndustrial(x, y, tile.development, tile.powered);
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
