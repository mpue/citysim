// Moderner City Builder Renderer
export class AmberRenderer {
    private ctx: CanvasRenderingContext2D;
    
    // Icon Caches
    private houseIcons: HTMLImageElement[] = [];
    private commercialIcons: HTMLImageElement[] = [];
    private industrialIcons: HTMLImageElement[] = [];
    
    // Neue strukturierte Icon-Caches
    private commercialBakeryIcons: HTMLImageElement[] = [];
    private commercialBookstoreIcons: HTMLImageElement[] = [];
    private commercialGroceryIcons: HTMLImageElement[] = [];
    private commercialPharmacyIcons: HTMLImageElement[] = [];
    
    private industrialFactoriesIcons: HTMLImageElement[] = [];
    private industrialStorageIcons: HTMLImageElement[] = [];
    
    private residentialAppartementsIcons: HTMLImageElement[] = [];
    private residentialHousesIcons: HTMLImageElement[] = [];
    private residentialSkyscraperIcons: HTMLImageElement[] = [];
    
    private powerPlantIcons: HTMLImageElement[] = [];
    private treeIcons: HTMLImageElement[] = [];
    private hospitalIcon: HTMLImageElement | null = null;
    private policeIcon: HTMLImageElement | null = null;
    private schoolIcon: HTMLImageElement | null = null;
    private libraryIcon: HTMLImageElement | null = null;
    private powerplantIcon: HTMLImageElement | null = null;
    private waterpumpIcon: HTMLImageElement | null = null;
    private carIcon: HTMLImageElement | null = null;
    private iconsLoaded: boolean = false;
    
    // Moderne Farbpalette
    private readonly BG_COLOR = '#222222';
    private readonly GRID_COLOR = '#444444';
    
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
    private readonly POWER_COLOR = '#f1c40f';  // Gelb
    private readonly POWER_DARK = '#d68910';   // Dunkelgelb
    private readonly POWER_GLOW = '#f39c12';   // Gelber Glow
    
    // Parks - Grüntöne
    private readonly PARK_BASE = '#27ae6000';
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
        // Lade Commercial Buildings - Bakery (49 Icons)
        for (let i = 1; i <= 49; i++) {
            const img = new Image();
            img.src = `/game/icons/buildings/commercial/bakery/${String(i).padStart(4, '0')}.png`;
            this.commercialBakeryIcons.push(img);
        }
        
        // Lade Commercial Buildings - Bookstore (48 Icons)
        for (let i = 1; i <= 48; i++) {
            const img = new Image();
            img.src = `/game/icons/buildings/commercial/bookstore/${String(i).padStart(4, '0')}.png`;
            this.commercialBookstoreIcons.push(img);
        }
        
        // Lade Commercial Buildings - Grocery (17 Icons)
        for (let i = 1; i <= 17; i++) {
            const img = new Image();
            img.src = `/game/icons/buildings/commercial/grocery/${String(i).padStart(4, '0')}.png`;
            this.commercialGroceryIcons.push(img);
        }
        
        // Lade Commercial Buildings - Pharmacy (48 Icons)
        for (let i = 1; i <= 48; i++) {
            const img = new Image();
            img.src = `/game/icons/buildings/commercial/pharmacy/${String(i).padStart(4, '0')}.png`;
            this.commercialPharmacyIcons.push(img);
        }
        
        // Lade Industrial Buildings - Factories (51 Icons)
        for (let i = 1; i <= 51; i++) {
            const img = new Image();
            img.src = `/game/icons/buildings/industrial/factories/${String(i).padStart(4, '0')}.png`;
            this.industrialFactoriesIcons.push(img);
        }
        
        // Lade Industrial Buildings - Storage (57 Icons)
        for (let i = 1; i <= 57; i++) {
            const img = new Image();
            img.src = `/game/icons/buildings/industrial/storage/${String(i).padStart(4, '0')}.png`;
            this.industrialStorageIcons.push(img);
        }
        
        // Lade Residential Buildings - Appartements (64 Icons)
        for (let i = 1; i <= 64; i++) {
            const img = new Image();
            img.src = `/game/icons/buildings/residential/appartements/${String(i).padStart(4, '0')}.png`;
            this.residentialAppartementsIcons.push(img);
        }
        
        // Lade Residential Buildings - Houses (27 Icons)
        for (let i = 1; i <= 27; i++) {
            const img = new Image();
            img.src = `/game/icons/buildings/residential/houses/${String(i).padStart(4, '0')}.png`;
            this.residentialHousesIcons.push(img);
        }
        
        // Lade Residential Buildings - Skyscraper (12 Icons)
        for (let i = 1; i <= 12; i++) {
            const img = new Image();
            img.src = `/game/icons/buildings/residential/skyscraper/${String(i).padStart(4, '0')}.png`;
            this.residentialSkyscraperIcons.push(img);
        }
        
        // Lade Power Plants (7 Icons)
        for (let i = 1; i <= 7; i++) {
            const img = new Image();
            img.src = `/game/icons/buildings/power/${String(i).padStart(4, '0')}.png`;
            this.powerPlantIcons.push(img);
        }
        
        // Lade Baum-Icons
        for (let i = 1; i <= 4; i++) {
            const img = new Image();
            img.src = `/game/icons/tree_${i}.png`;            
            this.treeIcons.push(img);
        }

        const img = new Image();
        img.src = `/game/icons/grass_1.png`;            
        this.treeIcons.push(img);

        // Lade Hospital Icon
        this.hospitalIcon = new Image();
        this.hospitalIcon.src = 'icons/hospital.png';
        
        // Lade Police Icon
        this.policeIcon = new Image();
        this.policeIcon.src = 'icons/police.png';
        
        // Lade School Icon
        this.schoolIcon = new Image();
        this.schoolIcon.src = 'icons/school.png';
        
        // Lade Library Icon
        this.libraryIcon = new Image();
        this.libraryIcon.src = 'icons/library.png';
        
        // Lade Powerplant Icon (fallback für altes Format)
        this.powerplantIcon = new Image();
        this.powerplantIcon.src = 'icons/powerplant.png';
        
        // Lade Waterpump Icon
        this.waterpumpIcon = new Image();
        this.waterpumpIcon.src = 'icons/commands/waterpunp.png';
        
        // Lade Car Icon
        this.carIcon = new Image();
        this.carIcon.src = 'icons/car.png';
        
        // Warte bis alle Icons geladen sind
        const allIcons = [
            ...this.commercialBakeryIcons,
            ...this.commercialBookstoreIcons,
            ...this.commercialGroceryIcons,
            ...this.commercialPharmacyIcons,
            ...this.industrialFactoriesIcons,
            ...this.industrialStorageIcons,
            ...this.residentialAppartementsIcons,
            ...this.residentialHousesIcons,
            ...this.residentialSkyscraperIcons,
            ...this.powerPlantIcons,
            ...this.treeIcons,
            this.hospitalIcon,
            this.policeIcon,
            this.schoolIcon,
            this.libraryIcon,
            this.powerplantIcon,
            this.waterpumpIcon,
            this.carIcon
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
        if (development > 0 && this.iconsLoaded) {
            let iconArray: HTMLImageElement[] = [];
            
            // Wähle Icon-Set basierend auf Entwicklungsstufe
            if (development <= 1) {
                iconArray = this.residentialHousesIcons;
            } else if (development <= 2) {
                iconArray = this.residentialAppartementsIcons;
            } else {
                iconArray = this.residentialSkyscraperIcons;
            }
            
            // Wähle zufälliges Icon aus dem Array basierend auf variant
            if (iconArray.length > 0) {
                const iconIndex = variant % iconArray.length;
                const icon = iconArray[iconIndex];
                
                if (icon && icon.complete) {
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
        if (development > 0 && this.iconsLoaded) {
            // Wähle Icon-Set basierend auf Variante (zyklisch durch die 4 Typen)
            const commercialTypes = [
                this.commercialBakeryIcons,
                this.commercialBookstoreIcons,
                this.commercialGroceryIcons,
                this.commercialPharmacyIcons
            ];
            
            const typeIndex = variant % commercialTypes.length;
            const iconArray = commercialTypes[typeIndex];
            
            // Wähle Icon aus dem Array (zufällig basierend auf Position)
            if (iconArray.length > 0) {
                const iconIndex = Math.floor(variant / commercialTypes.length) % iconArray.length;
                const icon = iconArray[iconIndex];
                
                if (icon && icon.complete) {
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
        if (development > 0 && this.iconsLoaded) {
            // Wechsle zwischen Factories und Storage
            const iconArray = (variant % 2 === 0) ? this.industrialFactoriesIcons : this.industrialStorageIcons;
            
            // Wähle Icon aus dem Array
            if (iconArray.length > 0) {
                const iconIndex = Math.floor(variant / 2) % iconArray.length;
                const icon = iconArray[iconIndex];
                
                if (icon && icon.complete) {
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

    public drawSchool(x: number, y: number, powered: boolean): void {
        if (this.schoolIcon && this.schoolIcon.complete) {
            this.ctx.drawImage(this.schoolIcon, x, y, this.TILE_SIZE, this.TILE_SIZE);
            
            if (!powered) {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                this.ctx.fillRect(x, y, this.TILE_SIZE, this.TILE_SIZE);
            }
        } else {
            // Fallback: gelbes Gebäude
            this.ctx.fillStyle = powered ? '#f39c12' : '#d68910';
            this.ctx.fillRect(x + 4, y + 4, 16, 16);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(x + 8, y + 8, 8, 8);
        }
    }

    public drawLibrary(x: number, y: number, powered: boolean): void {
        if (this.libraryIcon && this.libraryIcon.complete) {
            this.ctx.drawImage(this.libraryIcon, x, y, this.TILE_SIZE, this.TILE_SIZE);
            
            if (!powered) {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                this.ctx.fillRect(x, y, this.TILE_SIZE, this.TILE_SIZE);
            }
        } else {
            // Fallback: grünes Gebäude
            this.ctx.fillStyle = powered ? '#27ae60' : '#1e8449';
            this.ctx.fillRect(x + 4, y + 4, 16, 16);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(x + 8, y + 8, 8, 8);
        }
    }

    public drawRoad(x: number, y: number, hasNorth: boolean, hasEast: boolean, hasSouth: boolean, hasWest: boolean, traffic: number = 0, vehicles?: any[]): void {
        const center = this.TILE_SIZE / 2;
        const roadWidth = 14;
        const offset = (this.TILE_SIZE - roadWidth) / 2;
        const connections = [hasNorth, hasEast, hasSouth, hasWest].filter(c => c).length;
        
        // Straßengrundfarbe
        this.ctx.fillStyle = this.ROAD_COLOR;
        
        // Bei Kurven (2 Verbindungen, nicht gegenüberliegend) mit abgerundeten Ecken zeichnen
        const isCurve = connections === 2 && !((hasNorth && hasSouth) || (hasEast && hasWest));
        
        if (isCurve) {
            // Abgerundete Kurve zeichnen
            this.ctx.save();
            this.ctx.fillStyle = this.ROAD_COLOR;
            
            if (hasNorth && hasEast) {
                // Nordost-Kurve: L-Form mit abgerundeter Innenecke
                this.ctx.fillRect(x + offset, y, roadWidth, offset + roadWidth);  // Nord
                this.ctx.fillRect(x + offset, y + offset, this.TILE_SIZE - offset, roadWidth);  // Ost
                // Abgerundete Innenecke
                this.ctx.beginPath();
                this.ctx.arc(x + offset + roadWidth, y + offset, roadWidth/2, Math.PI, Math.PI * 1.5);
                this.ctx.lineTo(x + offset + roadWidth, y + offset);
                this.ctx.lineTo(x + offset + roadWidth - roadWidth/2, y + offset);
                this.ctx.fill();
            } else if (hasEast && hasSouth) {
                // Südost-Kurve
                this.ctx.fillRect(x + offset, y + offset, this.TILE_SIZE - offset, roadWidth);  // Ost
                this.ctx.fillRect(x + offset, y + offset, roadWidth, this.TILE_SIZE - offset);  // Süd
                this.ctx.beginPath();
                this.ctx.arc(x + offset + roadWidth, y + offset + roadWidth, roadWidth/2, Math.PI * 1.5, 0);
                this.ctx.lineTo(x + offset + roadWidth, y + offset + roadWidth);
                this.ctx.lineTo(x + offset + roadWidth, y + offset + roadWidth - roadWidth/2);
                this.ctx.fill();
            } else if (hasSouth && hasWest) {
                // Südwest-Kurve
                this.ctx.fillRect(x, y + offset, offset + roadWidth, roadWidth);  // West
                this.ctx.fillRect(x + offset, y + offset, roadWidth, this.TILE_SIZE - offset);  // Süd
                this.ctx.beginPath();
                this.ctx.arc(x + offset, y + offset + roadWidth, roadWidth/2, 0, Math.PI * 0.5);
                this.ctx.lineTo(x + offset, y + offset + roadWidth);
                this.ctx.lineTo(x + offset + roadWidth/2, y + offset + roadWidth);
                this.ctx.fill();
            } else if (hasWest && hasNorth) {
                // Nordwest-Kurve
                this.ctx.fillRect(x, y + offset, offset + roadWidth, roadWidth);  // West
                this.ctx.fillRect(x + offset, y, roadWidth, offset + roadWidth);  // Nord
                this.ctx.beginPath();
                this.ctx.arc(x + offset, y + offset, roadWidth/2, Math.PI * 0.5, Math.PI);
                this.ctx.lineTo(x + offset, y + offset);
                this.ctx.lineTo(x + offset, y + offset - roadWidth/2);
                this.ctx.fill();
            }
            this.ctx.restore();
        } else {
            // Gerade Straßen oder Kreuzungen: normal zeichnen
            this.ctx.fillRect(x + offset, y + offset, roadWidth, roadWidth);
            
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
        }
        
        // Gelbe Markierungslinien
        this.ctx.strokeStyle = this.ROAD_LINE;
        this.ctx.fillStyle = this.ROAD_LINE;
        this.ctx.lineWidth = 1;
        
        if (connections === 1 || (connections === 2 && ((hasNorth && hasSouth) || (hasEast && hasWest)))) {
            // Gerade Straße - gestrichelte Mittellinie
            if (hasNorth || hasSouth) {
                // Vertikal
                for (let i = 0; i < this.TILE_SIZE; i += 4) {
                    this.ctx.fillRect(x + center - 0.5, y + i, 1, 2);
                }
            } else {
                // Horizontal
                for (let i = 0; i < this.TILE_SIZE; i += 4) {
                    this.ctx.fillRect(x + i, y + center - 0.5, 2, 1);
                }
            }
        } else if (isCurve) {
            // Kurven - gebogene gestrichelte Linie von Mitte zu Mitte
            this.ctx.setLineDash([2, 2]);
            this.ctx.beginPath();
            
            // Radius = halbe Tile-Größe, damit Bogen von Mitte zu Mitte geht
            const curveRadius = center;
            
            if (hasNorth && hasEast) {
                // Von Mitte oben (center, 0) nach Mitte rechts (TILE_SIZE, center)
                // Zentrum an äußerer Ecke: (TILE_SIZE, 0)
                this.ctx.arc(x + this.TILE_SIZE, y, curveRadius, Math.PI, Math.PI * 0.5, true);
            } else if (hasEast && hasSouth) {
                // Von Mitte rechts (TILE_SIZE, center) nach Mitte unten (center, TILE_SIZE)
                // Zentrum an äußerer Ecke: (TILE_SIZE, TILE_SIZE)
                this.ctx.arc(x + this.TILE_SIZE, y + this.TILE_SIZE, curveRadius, Math.PI * 1.5, Math.PI, true);
            } else if (hasSouth && hasWest) {
                // Von Mitte unten (center, TILE_SIZE) nach Mitte links (0, center)
                // Zentrum an äußerer Ecke: (0, TILE_SIZE)
                this.ctx.arc(x, y + this.TILE_SIZE, curveRadius, 0, Math.PI * 1.5, true);
            } else if (hasWest && hasNorth) {
                // Von Mitte links (0, center) nach Mitte oben (center, 0)
                // Zentrum an äußerer Ecke: (0, 0)
                this.ctx.arc(x, y, curveRadius, Math.PI * 0.5, 0, true);
            }
            
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
        
        // Fahrzeuge zeichnen
        if (vehicles && vehicles.length > 0) {
            for (const vehicle of vehicles) {
                this.drawVehicle(vehicle.x, vehicle.y, vehicle.direction, vehicle.color, vehicle.lane);
            }
        }
    }

    public drawRoundabout(x: number, y: number): void {
        const size = this.TILE_SIZE * 2;
        const center = size / 2;
        const outerRadius = size * 0.45;
        const innerRadius = size * 0.25;
        
        // Straßenhintergrund (2x2 Tiles)
        this.ctx.fillStyle = this.ROAD_COLOR;
        this.ctx.fillRect(x, y, size, size);
        
        // Äußerer Kreis (Fahrbahn)
        this.ctx.fillStyle = this.ROAD_COLOR;
        this.ctx.beginPath();
        this.ctx.arc(x + center, y + center, outerRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Innerer Kreis (Mittelinsel)
        this.ctx.fillStyle = '#27ae60'; // Grün für die Insel
        this.ctx.beginPath();
        this.ctx.arc(x + center, y + center, innerRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Gelbe Markierung am äußeren Rand
        this.ctx.strokeStyle = this.ROAD_LINE;
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([3, 3]);
        this.ctx.beginPath();
        this.ctx.arc(x + center, y + center, outerRadius - 1, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Gelbe Markierung am inneren Rand
        this.ctx.beginPath();
        this.ctx.arc(x + center, y + center, innerRadius + 1, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Pfeile für Fahrtrichtung (gegen Uhrzeigersinn)
        this.ctx.fillStyle = '#ffffff';
        const arrowPositions = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
        const arrowRadius = (outerRadius + innerRadius) / 2;
        
        arrowPositions.forEach(angle => {
            const arrowX = x + center + Math.cos(angle) * arrowRadius;
            const arrowY = y + center + Math.sin(angle) * arrowRadius;
            
            // Kleiner Pfeil
            this.ctx.save();
            this.ctx.translate(arrowX, arrowY);
            this.ctx.rotate(angle + Math.PI / 2); // Richtung gegen Uhrzeigersinn
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, -3);
            this.ctx.lineTo(2, 0);
            this.ctx.lineTo(0, 3);
            this.ctx.fill();
            
            this.ctx.restore();
        });
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
        // Verwende car.png Icon wenn geladen, sonst Fallback
        if (this.iconsLoaded && this.carIcon && this.carIcon.complete) {
            const size = 8; // Größe des Auto-Icons
            
            // Speichere aktuellen Zustand
            this.ctx.save();
            
            // Verschiebe zum Mittelpunkt des Autos
            this.ctx.translate(x, y);
            
            // Rotiere je nach Richtung (car.png zeigt nach oben)
            switch(direction) {
                case 'north':
                    // 0° - keine Rotation nötig
                    break;
                case 'south':
                    this.ctx.rotate(Math.PI); // 180°
                    break;
                case 'east':
                    this.ctx.rotate(Math.PI / 2); // 90°
                    break;
                case 'west':
                    this.ctx.rotate(-Math.PI / 2); // -90°
                    break;
            }
            
            // Zeichne das Icon
            this.ctx.drawImage(this.carIcon, -size/2, -size/2, size, size);
            
            // Färbe das Auto mit multiply blend mode für bessere Einfärbung
            this.ctx.globalCompositeOperation = 'darken';
            this.ctx.fillStyle = color;
            this.ctx.fillRect(-size/2, -size/2, size, size);
            
            // Setze blend mode zurück
            this.ctx.globalCompositeOperation = 'source-over';
            
            // Stelle den ursprünglichen Zustand wieder her
            this.ctx.restore();
        } else {
            // Fallback: Einfaches Rechteck als Fahrzeug
            const size = 3;
            this.ctx.fillStyle = color;
            
            if (direction === 'north' || direction === 'south') {
                this.ctx.fillRect(x - 1, y - size/2, 2, size);
            } else {
                this.ctx.fillRect(x - size/2, y - 1, size, 2);
            }
        }
    }

    public drawPowerPlant(x: number, y: number, variant: number = 0): void {
        const size = this.TILE_SIZE * 3;
        
        // Versuche Icon aus neuem Power-Ordner zu rendern
        if (this.iconsLoaded && this.powerPlantIcons.length > 0) {
            const iconIndex = variant % this.powerPlantIcons.length;
            const icon = this.powerPlantIcons[iconIndex];
            
            if (icon && icon.complete) {
                this.ctx.drawImage(icon, x, y, size, size);
                return;
            }
        }
        
        // Fallback: Versuche altes Powerplant Icon
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
            const treeIcon = this.treeIcons[variant % 5];
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

    public drawWaterLine(x: number, y: number, hasNorth: boolean, hasEast: boolean, hasSouth: boolean, hasWest: boolean): void {
        this.ctx.fillStyle = '#1e88e5'; // Dunkelblau
        
        const center = this.TILE_SIZE / 2;
        const lineWidth = 3;
        const offset = (this.TILE_SIZE - lineWidth) / 2;
        
        // Immer Zentrum zeichnen (Knotenpunkt)
        this.ctx.fillStyle = '#42a5f5'; // Hellblau
        this.ctx.fillRect(x + offset - 1, y + offset - 1, lineWidth + 2, lineWidth + 2);
        
        // Nur Verbindungen zu Nachbarn zeichnen
        this.ctx.fillStyle = '#1e88e5';
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
        
        // Tropfen an Verbindungen
        this.ctx.fillStyle = '#42a5f5';
        if (hasNorth || hasSouth || hasEast || hasWest) {
            this.ctx.fillRect(x + center - 1, y + center - 1, 2, 2);
        }
    }

    public drawWaterPump(x: number, y: number): void {
        const size = this.TILE_SIZE * 2;
        
        // Versuche Icon zu rendern, falls geladen
        if (this.iconsLoaded && this.waterpumpIcon && this.waterpumpIcon.complete) {
            this.ctx.drawImage(this.waterpumpIcon, x, y, size, size);
            return;
        }
        
        // Fallback: Gezeichnete Wasserpumpe
        const shadowColor = 'rgba(0, 0, 0, 0.3)';
        
        // Schatten
        this.ctx.fillStyle = shadowColor;
        this.ctx.fillRect(x + 4, y + 4, size - 4, size - 4);
        
        // Gebäude
        this.ctx.fillStyle = '#1565c0'; // Dunkelblau
        this.ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        
        // Innerer Bereich
        this.ctx.fillStyle = '#1e88e5'; // Mittelblau
        this.ctx.fillRect(x + 6, y + 6, size - 12, size - 12);
        
        // Wassertropfen-Symbol
        this.ctx.fillStyle = '#42a5f5'; // Hellblau
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        
        // Tropfen-Form
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY + 3, 6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillRect(centerX - 2, centerY - 5, 4, 8);
        
        // Glanz-Effekt
        this.ctx.fillStyle = '#90caf9';
        this.ctx.fillRect(centerX - 1, centerY, 2, 2);
    }

    public drawNoWaterIndicator(x: number, y: number, noPower: boolean): void {
        // Wenn kein Strom, dann wechselnd Blitz und Tropfen anzeigen
        const blinkCycle = Math.floor(Date.now() / 500) % 2;
        
        if (noPower) {
            // Wechsle zwischen Blitz und Tropfen
            const showWater = Math.floor(Date.now() / 1000) % 2;
            if (showWater === 0) {
                this.drawNoPowerIndicator(x, y);
                return;
            }
        }
        
        // Blinkender Wassertropfen (nur anzeigen wenn blink cycle aktiv)
        if (blinkCycle === 0) return;
        
        const centerX = x + this.TILE_SIZE / 2;
        const centerY = y + this.TILE_SIZE / 2;
        
        // Blauer Wassertropfen mit Glow
        this.ctx.shadowBlur = 6;
        this.ctx.shadowColor = '#42a5f5';
        this.ctx.fillStyle = '#1e88e5';
        
        // Tropfen-Form
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY + 1, 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillRect(centerX - 1, centerY - 3, 2, 4);
        
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
