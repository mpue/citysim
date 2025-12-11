// Moderner City Builder Renderer
export class AmberRenderer {
    private ctx: CanvasRenderingContext2D;
    
    // Icon Caches
    private houseIcons: HTMLImageElement[] = [];
    private commercialIcons: HTMLImageElement[] = [];
    private industrialIcons: HTMLImageElement[] = [];
    private treeIcons: HTMLImageElement[] = [];
    private hospitalIcon: HTMLImageElement | null = null;
    private policeIcon: HTMLImageElement | null = null;
    private powerplantIcon: HTMLImageElement | null = null;
    private iconsLoaded: boolean = false;
    
    // Moderne Farbpalette
    private readonly BG_COLOR = '#1a1a2e';
    private readonly GRID_COLOR = '#16213e';
    
    // Wohngebäude - warme Farbtöne
    private readonly RES_BASE = '#e94560';
    private readonly RES_DARK = '#b83350';
    private readonly RES_LIGHT = '#ff6b88';
    
    // Gewerbe - Grau- und Schwarztöne
    private readonly COM_BASE = '#5a5a5a';
    private readonly COM_DARK = '#2a2a2a';
    private readonly COM_LIGHT = '#7a7a7a';
    
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
        this.loadIcons();
    }

    private loadIcons(): void {
        // Lade Wohngebäude-Icons
        for (let i = 1; i <= 4; i++) {
            const img = new Image();
            img.src = `icons/house_${i}.png`;
            this.houseIcons.push(img);
        }
        
        // Lade Gewerbe-Icons
        for (let i = 1; i <= 4; i++) {
            const img = new Image();
            img.src = `icons/commercial_${i}.png`;
            this.commercialIcons.push(img);
        }
        
        // Lade Industrie-Icons
        for (let i = 1; i <= 4; i++) {
            const img = new Image();
            img.src = `icons/industrial_${i}.png`;
            this.industrialIcons.push(img);
        }
        
        // Lade Baum-Icons
        for (let i = 1; i <= 4; i++) {
            const img = new Image();
            img.src = `icons/tree_${i}.png`;
            this.treeIcons.push(img);
        }
        
        // Lade Hospital Icon
        this.hospitalIcon = new Image();
        this.hospitalIcon.src = 'icons/hospital.png';
        
        // Lade Police Icon
        this.policeIcon = new Image();
        this.policeIcon.src = 'icons/police.png';
        
        // Lade Powerplant Icon
        this.powerplantIcon = new Image();
        this.powerplantIcon.src = 'icons/powerplant.png';
        
        // Warte bis alle Icons geladen sind
        const allIcons = [
            ...this.houseIcons, 
            ...this.commercialIcons, 
            ...this.industrialIcons,
            ...this.treeIcons,
            this.hospitalIcon,
            this.policeIcon,
            this.powerplantIcon
        ];
        let loadedCount = 0;
        allIcons.forEach(img => {
            img.onload = () => {
                loadedCount++;
                if (loadedCount === allIcons.length) {
                    this.iconsLoaded = true;
                }
            };
        });
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
        // Icons nur bei bebauten Gebieten (development > 0)
        if (development > 0 && this.iconsLoaded && variant >= 0 && variant < 4) {
            const icon = this.houseIcons[variant];
            if (icon.complete) {
                // Zeichne Icon zentriert im Tile
                this.ctx.drawImage(icon, x, y, this.TILE_SIZE, this.TILE_SIZE);
                
                // Zeige unpowered mit dunklem Overlay
                if (!powered) {
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    this.ctx.fillRect(x, y, this.TILE_SIZE, this.TILE_SIZE);
                }
                return;
            }
        }
        
        // Fallback: Original-Rendering
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
        // Icons nur bei bebauten Gebieten (development > 0)
        if (development > 0 && this.iconsLoaded && variant >= 0 && variant < 4) {
            const icon = this.commercialIcons[variant];
            if (icon.complete) {
                // Zeichne Icon zentriert im Tile
                this.ctx.drawImage(icon, x, y, this.TILE_SIZE, this.TILE_SIZE);
                
                // Zeige unpowered mit dunklem Overlay
                if (!powered) {
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    this.ctx.fillRect(x, y, this.TILE_SIZE, this.TILE_SIZE);
                }
                return;
            }
        }
        
        // Fallback: Original-Rendering
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
        // Icons nur bei bebauten Gebieten (development > 0)
        if (development > 0 && this.iconsLoaded && variant >= 0 && variant < 4) {
            const icon = this.industrialIcons[variant];
            if (icon.complete) {
                // Zeichne Icon zentriert im Tile
                this.ctx.drawImage(icon, x, y, this.TILE_SIZE, this.TILE_SIZE);
                
                // Zeige unpowered mit dunklem Overlay
                if (!powered) {
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    this.ctx.fillRect(x, y, this.TILE_SIZE, this.TILE_SIZE);
                }
                return;
            }
        }
        
        // Fallback: Original-Rendering
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
    }

    public drawHospital(x: number, y: number, powered: boolean): void {
        if (this.hospitalIcon && this.hospitalIcon.complete) {
            this.ctx.drawImage(this.hospitalIcon, x, y, this.TILE_SIZE, this.TILE_SIZE);
            
            if (!powered) {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                this.ctx.fillRect(x, y, this.TILE_SIZE, this.TILE_SIZE);
            }
        } else {
            // Fallback: rotes Kreuz
            this.ctx.fillStyle = powered ? '#e74c3c' : '#c0392b';
            this.ctx.fillRect(x + 4, y + 4, 16, 16);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(x + 10, y + 6, 4, 12);
            this.ctx.fillRect(x + 6, y + 10, 12, 4);
        }
    }

    public drawPolice(x: number, y: number, powered: boolean): void {
        if (this.policeIcon && this.policeIcon.complete) {
            this.ctx.drawImage(this.policeIcon, x, y, this.TILE_SIZE, this.TILE_SIZE);
            
            if (!powered) {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                this.ctx.fillRect(x, y, this.TILE_SIZE, this.TILE_SIZE);
            }
        } else {
            // Fallback: blaues Schild
            this.ctx.fillStyle = powered ? '#3498db' : '#2980b9';
            this.ctx.fillRect(x + 4, y + 4, 16, 16);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(x + 8, y + 8, 8, 8);
        }
    }

    public drawRoad(x: number, y: number, hasNorth: boolean, hasEast: boolean, hasSouth: boolean, hasWest: boolean, traffic: number = 0, vehicles?: any[]): void {
        this.ctx.fillStyle = this.ROAD_COLOR;
        
        const center = this.TILE_SIZE / 2;
        const roadWidth = 14;  // Breiter: von 8 auf 14
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
        
        // Gelbe Markierungslinien (dünner wegen breiterer Straße)
        this.ctx.fillStyle = this.ROAD_LINE;
        const hasVertical = hasNorth || hasSouth;
        const hasHorizontal = hasEast || hasWest;
        
        if (hasVertical && !hasHorizontal) {
            // Vertikale Straße - gestrichelte Mittellinie
            for (let i = 0; i < this.TILE_SIZE; i += 4) {
                this.ctx.fillRect(x + center - 0.5, y + i, 1, 2);
            }
        } else if (hasHorizontal && !hasVertical) {
            // Horizontale Straße - gestrichelte Mittellinie
            for (let i = 0; i < this.TILE_SIZE; i += 4) {
                this.ctx.fillRect(x + i, y + center - 0.5, 2, 1);
            }
        }
        
        // Fahrzeuge zeichnen wenn Verkehr vorhanden
        if (vehicles && vehicles.length > 0) {
            for (const vehicle of vehicles) {
                this.drawVehicle(vehicle.x, vehicle.y, vehicle.direction, vehicle.color, vehicle.lane);
            }
        }
    }

    public drawTrafficLight(x: number, y: number, state: number): void {
        const center = this.TILE_SIZE / 2;
        const radius = 2;
        
        // Nord-Süd Ampel (links)
        this.ctx.beginPath();
        this.ctx.arc(x + center - 4, y + center - 4, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = state === 1 ? '#e74c3c' : '#27ae60';  // RED_NS = rot, sonst grün
        this.ctx.fill();
        
        // Ost-West Ampel (rechts)
        this.ctx.beginPath();
        this.ctx.arc(x + center + 4, y + center + 4, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = state === 2 ? '#e74c3c' : '#27ae60';  // RED_EW = rot, sonst grün
        this.ctx.fill();
    }

    private drawVehicle(x: number, y: number, direction: string, color: string, lane: 'left' | 'right'): void {
        const size = 3;
        this.ctx.fillStyle = color;
        
        // Position bereits basierend auf lane berechnet (aus spawnVehicle)
        // Einfaches Rechteck als Fahrzeug
        if (direction === 'north' || direction === 'south') {
            this.ctx.fillRect(x - 1, y - size/2, 2, size);
        } else {
            this.ctx.fillRect(x - size/2, y - 1, size, 2);
        }
    }

    public drawPowerPlant(x: number, y: number): void {
        const size = this.TILE_SIZE * 3;
        
        // Versuche Icon zu rendern, falls geladen
        if (this.iconsLoaded && this.powerplantIcon && this.powerplantIcon.complete) {
            this.ctx.drawImage(this.powerplantIcon, x, y, size, size);
            return;
        }
        
        // Fallback: Gezeichnetes Kraftwerk
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

    public drawPark(x: number, y: number, variant: number): void {
        // Grüne Parkfläche
        this.ctx.fillStyle = this.PARK_BASE;
        this.ctx.fillRect(x + 2, y + 2, this.TILE_SIZE - 4, this.TILE_SIZE - 4);
        
        // Baum-Icon anzeigen (zufällige Variante)
        if (this.iconsLoaded && this.treeIcons.length > 0) {
            const treeIcon = this.treeIcons[variant % 4];
            this.ctx.drawImage(treeIcon, x, y, this.TILE_SIZE, this.TILE_SIZE);
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
