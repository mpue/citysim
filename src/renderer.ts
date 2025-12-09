// Amber Hercules Grafik-Renderer
export class AmberRenderer {
    private ctx: CanvasRenderingContext2D;
    private readonly AMBER_COLOR = '#FFA500';
    private readonly AMBER_DARK = '#CC8400';
    private readonly AMBER_LIGHT = '#FFD700';
    private readonly BG_COLOR = '#000000';
    private readonly TILE_SIZE = 24;

    constructor(canvas: HTMLCanvasElement) {
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Canvas 2D context nicht verfügbar');
        }
        this.ctx = context;
        this.setupAmberDisplay();
    }

    private setupAmberDisplay(): void {
        this.ctx.imageSmoothingEnabled = false;
        const canvas = this.ctx.canvas;
        canvas.style.imageRendering = 'pixelated';
    }

    public clearScreen(width: number, height: number): void {
        this.ctx.fillStyle = this.BG_COLOR;
        this.ctx.fillRect(0, 0, width, height);
    }

    public drawGrid(mapWidth: number, mapHeight: number): void {
        this.ctx.strokeStyle = this.AMBER_DARK;
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
        this.ctx.strokeStyle = this.AMBER_LIGHT;
        this.ctx.lineWidth = 2;
        const px = x * this.TILE_SIZE;
        const py = y * this.TILE_SIZE;
        this.ctx.strokeRect(px + 1, py + 1, this.TILE_SIZE - 2, this.TILE_SIZE - 2);
    }

    public drawResidential(x: number, y: number, development: number, powered: boolean): void {
        const color = powered ? this.AMBER_COLOR : this.AMBER_DARK;
        const lightColor = powered ? this.AMBER_LIGHT : this.AMBER_COLOR;
        
        // Haus-Basis
        const size = 8 + development * 4;
        const offset = (this.TILE_SIZE - size) / 2;
        
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x + offset, y + offset + 4, size, size - 4);
        
        // Dach (Dreieck-Form mit Pixeln)
        this.ctx.fillStyle = lightColor;
        for (let i = 0; i < size / 2; i++) {
            this.ctx.fillRect(x + offset + i, y + offset + 4 - i, size - i * 2, 1);
        }
        
        // Fenster
        if (development > 0) {
            this.ctx.fillStyle = this.BG_COLOR;
            this.ctx.fillRect(x + offset + 2, y + offset + 6, 2, 2);
            this.ctx.fillRect(x + offset + size - 4, y + offset + 6, 2, 2);
        }
        if (development > 1) {
            this.ctx.fillRect(x + offset + 2, y + offset + size - 3, 2, 2);
            this.ctx.fillRect(x + offset + size - 4, y + offset + size - 3, 2, 2);
        }
    }

    public drawCommercial(x: number, y: number, development: number, powered: boolean): void {
        const color = powered ? this.AMBER_COLOR : this.AMBER_DARK;
        const lightColor = powered ? this.AMBER_LIGHT : this.AMBER_COLOR;
        
        // Hochhaus mit mehreren Etagen
        const width = 12;
        const height = 10 + development * 4;
        const offsetX = (this.TILE_SIZE - width) / 2;
        const offsetY = this.TILE_SIZE - height - 2;
        
        // Gebäude
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x + offsetX, y + offsetY, width, height);
        
        // Dach
        this.ctx.fillStyle = lightColor;
        this.ctx.fillRect(x + offsetX, y + offsetY, width, 2);
        
        // Fenster in Reihen
        this.ctx.fillStyle = this.BG_COLOR;
        for (let floor = 0; floor < development + 1; floor++) {
            const floorY = y + offsetY + 3 + floor * 4;
            this.ctx.fillRect(x + offsetX + 2, floorY, 2, 2);
            this.ctx.fillRect(x + offsetX + 5, floorY, 2, 2);
            this.ctx.fillRect(x + offsetX + 8, floorY, 2, 2);
        }
    }

    public drawIndustrial(x: number, y: number, development: number, powered: boolean): void {
        const color = powered ? this.AMBER_COLOR : this.AMBER_DARK;
        const lightColor = powered ? this.AMBER_LIGHT : this.AMBER_COLOR;
        
        // Fabrikgebäude (breit und flach)
        const width = 16;
        const height = 10;
        
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
                this.ctx.fillStyle = this.AMBER_DARK;
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
        this.ctx.fillStyle = this.AMBER_DARK;
        
        const center = this.TILE_SIZE / 2;
        const roadWidth = 6;
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
        
        // Mittellinie bei geraden Straßen
        this.ctx.fillStyle = this.AMBER_COLOR;
        const hasVertical = hasNorth || hasSouth;
        const hasHorizontal = hasEast || hasWest;
        
        if (hasVertical && !hasHorizontal) {
            // Vertikale Straße
            this.ctx.fillRect(x + center - 1, y, 1, this.TILE_SIZE);
        } else if (hasHorizontal && !hasVertical) {
            // Horizontale Straße
            this.ctx.fillRect(x, y + center - 1, this.TILE_SIZE, 1);
        }
    }

    public drawPowerPlant(x: number, y: number): void {
        this.ctx.fillStyle = this.AMBER_LIGHT;
        this.ctx.fillRect(x + 2, y + 2, 12, 12);
        this.ctx.fillStyle = this.AMBER_COLOR;
        this.ctx.fillRect(x + 4, y + 4, 8, 8);
        // Blitz-Symbol
        this.ctx.fillStyle = this.AMBER_LIGHT;
        this.ctx.fillRect(x + 7, y + 6, 2, 6);
        this.ctx.fillRect(x + 6, y + 9, 4, 2);
    }

    public drawPowerLine(x: number, y: number): void {
        this.ctx.fillStyle = this.AMBER_DARK;
        this.ctx.fillRect(x + 7, y, 2, this.TILE_SIZE);
        this.ctx.fillRect(x, y + 7, this.TILE_SIZE, 2);
        this.ctx.fillStyle = this.AMBER_LIGHT;
        this.ctx.fillRect(x + 6, y + 6, 4, 4);
    }

    public drawPark(x: number, y: number): void {
        this.ctx.fillStyle = this.AMBER_COLOR;
        for (let i = 0; i < 4; i++) {
            this.ctx.fillRect(x + 3 + i * 3, y + 4 + (i % 2) * 4, 2, 2);
        }
    }

    public drawNoPowerIndicator(x: number, y: number): void {
        this.ctx.fillStyle = this.AMBER_DARK;
        this.ctx.fillRect(x + 2, y + 2, 3, 3);
    }

    public getTileSize(): number {
        return this.TILE_SIZE;
    }
}
