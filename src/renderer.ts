// Moderner City Builder Renderer
export class AmberRenderer {
    private ctx: CanvasRenderingContext2D;
    
    // Moderne Farbpalette
    private readonly BG_COLOR = '#1a1a2e';
    private readonly GRID_COLOR = '#16213e';
    
    // Wohngebäude - warme Farbtöne
    private readonly RES_BASE = '#e94560';
    private readonly RES_DARK = '#b83350';
    private readonly RES_LIGHT = '#ff6b88';
    
    // Gewerbe - kühle Blautöne
    private readonly COM_BASE = '#4a90e2';
    private readonly COM_DARK = '#3470b8';
    private readonly COM_LIGHT = '#6baef5';
    
    // Industrie - Grautöne
    private readonly IND_BASE = '#7f8c8d';
    private readonly IND_DARK = '#5a6263';
    private readonly IND_LIGHT = '#95a5a6';
    
    // Infrastruktur
    private readonly ROAD_COLOR = '#34495e';
    private readonly ROAD_LINE = '#f1c40f';
    private readonly POWER_COLOR = '#00d4ff';
    private readonly POWER_DARK = '#0099cc';
    private readonly POWER_GLOW = '#00ffff';
    
    // Parks - Grüntöne
    private readonly PARK_BASE = '#27ae60';
    private readonly PARK_DARK = '#1e8449';
    private readonly PARK_LIGHT = '#2ecc71';
    
    // Kraftwerk - Gelb/Orange
    private readonly PLANT_BASE = '#f39c12';
    private readonly PLANT_DARK = '#d68910';
    private readonly PLANT_LIGHT = '#f5b041';
    
    private readonly TILE_SIZE = 24;
    private animationTime: number = 0;

    constructor(canvas: HTMLCanvasElement) {
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Canvas 2D context nicht verfügbar');
        }
        this.ctx = context;
        this.setupAmberDisplay();
        this.animationTime = Date.now();
    }

    private setupAmberDisplay(): void {
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        const canvas = this.ctx.canvas;
        canvas.style.imageRendering = 'auto';
    }

    public clearScreen(width: number, height: number): void {
        this.ctx.fillStyle = this.BG_COLOR;
        this.ctx.fillRect(0, 0, width, height);
    }

    public drawGrid(mapWidth: number, mapHeight: number): void {
        this.ctx.strokeStyle = this.GRID_COLOR;
        this.ctx.lineWidth = 1;
        
        // Vertikale Linien
        for (let x = 0; x <= mapWidth; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.TILE_SIZE, 0);
            this.ctx.lineTo(x * this.TILE_SIZE, mapHeight * this.TILE_SIZE);
            this.ctx.stroke();
        }
        
        // Horizontale Linien
        for (let y = 0; y <= mapHeight; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.TILE_SIZE);
            this.ctx.lineTo(mapWidth * this.TILE_SIZE, y * this.TILE_SIZE);
            this.ctx.stroke();
        }
    }

    public highlightTile(x: number, y: number): void {
        this.ctx.strokeStyle = this.POWER_COLOR;
        this.ctx.lineWidth = 2;
        const px = x * this.TILE_SIZE;
        const py = y * this.TILE_SIZE;
        this.ctx.strokeRect(px + 1, py + 1, this.TILE_SIZE - 2, this.TILE_SIZE - 2);
    }

    public drawMultiTileHighlight(x: number, y: number, width: number, height: number): void {
        this.ctx.strokeStyle = this.POWER_COLOR;
        this.ctx.lineWidth = 2;
        const px = x * this.TILE_SIZE;
        const py = y * this.TILE_SIZE;
        const w = width * this.TILE_SIZE;
        const h = height * this.TILE_SIZE;
        this.ctx.strokeRect(px + 1, py + 1, w - 2, h - 2);
    }

    public drawResidential(x: number, y: number, development: number, powered: boolean, variant: number = 0): void {
        const color = powered ? this.RES_BASE : this.RES_DARK;
        const lightColor = powered ? this.RES_LIGHT : this.RES_BASE;
        const shadowColor = 'rgba(0, 0, 0, 0.3)';
        
        // Schatten
        this.ctx.fillStyle = shadowColor;
        const size = 8 + development * 4;
        const offset = (this.TILE_SIZE - size) / 2;
        this.ctx.fillRect(x + offset + 2, y + offset + 6, size, size - 2);
        
        // Haus-Basis
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x + offset, y + offset + 4, size, size - 4);
        
        // Dach mit Gradient-Effekt
        this.ctx.fillStyle = lightColor;
        for (let i = 0; i < size / 2; i++) {
            this.ctx.fillRect(x + offset + i, y + offset + 4 - i, size - i * 2, 1);
        }
        
        // Fenster
        if (development > 0) {
            this.ctx.fillStyle = '#f5e6d3';
            this.ctx.fillRect(x + offset + 2, y + offset + 6, 2, 2);
            this.ctx.fillRect(x + offset + size - 4, y + offset + 6, 2, 2);
        }
        if (development > 1) {
            this.ctx.fillRect(x + offset + 2, y + offset + size - 3, 2, 2);
            this.ctx.fillRect(x + offset + size - 4, y + offset + size - 3, 2, 2);
        }
    }

    public drawCommercial(x: number, y: number, development: number, powered: boolean, variant: number = 0): void {
        const color = powered ? this.COM_BASE : this.COM_DARK;
        const lightColor = powered ? this.COM_LIGHT : this.COM_BASE;
        const shadowColor = 'rgba(0, 0, 0, 0.3)';
        
        const width = 12;
        const height = 10 + development * 4;
        const offsetX = (this.TILE_SIZE - width) / 2;
        const offsetY = this.TILE_SIZE - height - 2;
        
        // Schatten
        this.ctx.fillStyle = shadowColor;
        this.ctx.fillRect(x + offsetX + 2, y + offsetY + 2, width, height);
        
        // Gebäude
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x + offsetX, y + offsetY, width, height);
        
        // Dach
        this.ctx.fillStyle = lightColor;
        this.ctx.fillRect(x + offsetX, y + offsetY, width, 2);
        
        // Glas-Fenster in Reihen
        this.ctx.fillStyle = 'rgba(173, 216, 230, 0.7)';
        for (let floor = 0; floor < development + 1; floor++) {
            const floorY = y + offsetY + 3 + floor * 4;
            this.ctx.fillRect(x + offsetX + 2, floorY, 2, 2);
            this.ctx.fillRect(x + offsetX + 5, floorY, 2, 2);
            this.ctx.fillRect(x + offsetX + 8, floorY, 2, 2);
        }
    }

    public drawIndustrial(x: number, y: number, development: number, powered: boolean, variant: number = 0): void {
        const color = powered ? this.IND_BASE : this.IND_DARK;
        const lightColor = powered ? this.IND_LIGHT : this.IND_BASE;
        const shadowColor = 'rgba(0, 0, 0, 0.3)';
        
        const width = 16;
        const height = 10;
        
        // Schatten
        this.ctx.fillStyle = shadowColor;
        this.ctx.fillRect(x + 6, y + 10, width, height);
        
        // Fabrikgebäude
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x + 4, y + 8, width, height);
        
        // Dach
        this.ctx.fillStyle = lightColor;
        this.ctx.fillRect(x + 4, y + 8, width, 2);
        
        // Schornsteine
        const chimneys = 1 + development;
        for (let i = 0; i < chimneys; i++) {
            const chimX = x + 6 + i * 5;
            this.ctx.fillStyle = color;
            this.ctx.fillRect(chimX, y + 2, 3, 8);
            // Rauch wenn powered
            if (powered) {
                this.ctx.fillStyle = '#95a5a6';
                this.ctx.fillRect(chimX, y, 3, 2);
            }
        }
        
        // Große Tore/Öffnungen
        this.ctx.fillStyle = this.BG_COLOR;
        this.ctx.fillRect(x + 7, y + 12, 4, 5);
        if (development > 1) {
            this.ctx.fillRect(x + 13, y + 12, 4, 5);
        }
    }

    public drawRoad(x: number, y: number, hasNorth: boolean, hasEast: boolean, hasSouth: boolean, hasWest: boolean): void {
        this.ctx.fillStyle = this.ROAD_COLOR;
        
        const center = this.TILE_SIZE / 2;
        const roadWidth = 8;
        const offset = (this.TILE_SIZE - roadWidth) / 2;
        
        // Immer Zentrum zeichnen
        this.ctx.fillRect(x + offset, y + offset, roadWidth, roadWidth);
        
        // Nur Verbindungen zu Nachbarn zeichnen
        if (hasNorth) {
            this.ctx.fillRect(x + offset, y, roadWidth, offset);
        }
        if (hasEast) {
            this.ctx.fillRect(x + offset + roadWidth, y + offset, this.TILE_SIZE - offset - roadWidth, roadWidth);
        }
        if (hasSouth) {
            this.ctx.fillRect(x + offset, y + offset + roadWidth, roadWidth, this.TILE_SIZE - offset - roadWidth);
        }
        if (hasWest) {
            this.ctx.fillRect(x, y + offset, offset, roadWidth);
        }
        
        // Gelbe Markierungslinien
        this.ctx.fillStyle = this.ROAD_LINE;
        const hasVertical = hasNorth || hasSouth;
        const hasHorizontal = hasEast || hasWest;
        
        if (hasVertical && !hasHorizontal) {
            // Vertikale Straße - gestrichelte Linie
            for (let i = 0; i < this.TILE_SIZE; i += 4) {
                this.ctx.fillRect(x + center - 1, y + i, 2, 2);
            }
        } else if (hasHorizontal && !hasVertical) {
            // Horizontale Straße - gestrichelte Linie
            for (let i = 0; i < this.TILE_SIZE; i += 4) {
                this.ctx.fillRect(x + i, y + center - 1, 2, 2);
            }
        }
    }

    public drawPowerPlant(x: number, y: number): void {
        const size = this.TILE_SIZE * 2;
        const shadowColor = 'rgba(0, 0, 0, 0.4)';
        
        // Schatten
        this.ctx.fillStyle = shadowColor;
        this.ctx.fillRect(x + 4, y + 4, size - 4, size - 4);
        
        // Äußeres Gebäude
        this.ctx.fillStyle = this.PLANT_DARK;
        this.ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        
        // Innerer Bereich
        this.ctx.fillStyle = this.PLANT_BASE;
        this.ctx.fillRect(x + 6, y + 6, size - 12, size - 12);
        
        // Kühlturm links
        this.ctx.fillStyle = this.PLANT_LIGHT;
        this.ctx.fillRect(x + 8, y + 10, 8, 16);
        this.ctx.fillRect(x + 9, y + 8, 6, 2);
        
        // Kühlturm rechts
        this.ctx.fillRect(x + 28, y + 10, 8, 16);
        this.ctx.fillRect(x + 29, y + 8, 6, 2);
        
        // Energie-Symbol mit Glow
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = this.POWER_GLOW;
        this.ctx.fillStyle = this.POWER_COLOR;
        this.ctx.fillRect(x + 22, y + 18, 3, 10);
        this.ctx.fillRect(x + 20, y + 24, 7, 3);
        this.ctx.shadowBlur = 0;
    }

    public drawPowerLine(x: number, y: number, hasNorth: boolean, hasEast: boolean, hasSouth: boolean, hasWest: boolean): void {
        this.ctx.fillStyle = this.POWER_DARK;
        
        const center = this.TILE_SIZE / 2;
        const lineWidth = 3;
        const offset = (this.TILE_SIZE - lineWidth) / 2;
        
        // Immer Zentrum zeichnen (Knotenpunkt)
        this.ctx.fillStyle = this.POWER_COLOR;
        this.ctx.fillRect(x + offset - 1, y + offset - 1, lineWidth + 2, lineWidth + 2);
        
        // Nur Verbindungen zu Nachbarn zeichnen
        this.ctx.fillStyle = this.POWER_DARK;
        if (hasNorth) {
            this.ctx.fillRect(x + offset, y, lineWidth, offset);
        }
        if (hasEast) {
            this.ctx.fillRect(x + offset + lineWidth, y + offset, this.TILE_SIZE - offset - lineWidth, lineWidth);
        }
        if (hasSouth) {
            this.ctx.fillRect(x + offset, y + offset + lineWidth, lineWidth, this.TILE_SIZE - offset - lineWidth);
        }
        if (hasWest) {
            this.ctx.fillRect(x, y + offset, offset, lineWidth);
        }
        
        // Leuchtende Punkte an Verbindungen
        this.ctx.fillStyle = this.POWER_COLOR;
        if (hasNorth || hasSouth || hasEast || hasWest) {
            this.ctx.fillRect(x + center - 1, y + center - 1, 2, 2);
        }
    }

    public drawPark(x: number, y: number): void {
        // Grüne Parkfläche
        this.ctx.fillStyle = this.PARK_BASE;
        this.ctx.fillRect(x + 2, y + 2, this.TILE_SIZE - 4, this.TILE_SIZE - 4);
        
        // Bäume
        this.ctx.fillStyle = this.PARK_DARK;
        for (let i = 0; i < 3; i++) {
            const treeX = x + 4 + i * 6;
            const treeY = y + 4 + (i % 2) * 8;
            this.ctx.fillRect(treeX, treeY, 3, 3);
            this.ctx.fillRect(treeX + 1, treeY - 2, 1, 2);
        }
    }

    public drawNoPowerIndicator(x: number, y: number): void {
        // Blinkender Blitz (1 Sekunde an, 1 Sekunde aus)
        const blinkCycle = Math.floor(Date.now() / 500) % 2;
        if (blinkCycle === 0) return; // Jede zweite halbe Sekunde ausblenden
        
        const centerX = x + this.TILE_SIZE / 2;
        const centerY = y + this.TILE_SIZE / 2;
        
        // Gelber Blitz mit Glow
        this.ctx.shadowBlur = 6;
        this.ctx.shadowColor = '#f1c40f';
        this.ctx.fillStyle = '#f39c12';
        
        // Blitz-Form (vereinfacht)
        this.ctx.fillRect(centerX - 1, centerY - 4, 2, 4); // Oberer Teil
        this.ctx.fillRect(centerX - 2, centerY, 4, 1);     // Mitte breit
        this.ctx.fillRect(centerX, centerY + 1, 2, 3);     // Unterer Teil
        
        this.ctx.shadowBlur = 0;
    }

    public drawDragRect(start: { x: number, y: number }, end: { x: number, y: number }): void {
        const minX = Math.min(start.x, end.x) * this.TILE_SIZE;
        const maxX = (Math.max(start.x, end.x) + 1) * this.TILE_SIZE;
        const minY = Math.min(start.y, end.y) * this.TILE_SIZE;
        const maxY = (Math.max(start.y, end.y) + 1) * this.TILE_SIZE;
        
        this.ctx.strokeStyle = this.POWER_COLOR;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
        this.ctx.setLineDash([]);
        
        // Semi-transparente Füllung
        this.ctx.fillStyle = 'rgba(0, 212, 255, 0.1)';
        this.ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
    }

    public getTileSize(): number {
        return this.TILE_SIZE;
    }
}
