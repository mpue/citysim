import { CityMap } from './citymap.js';
import { AmberRenderer } from './renderer.js';
import { TileType, Vehicle } from './types.js';

export class TrafficManager {
    private vehicles: Vehicle[];
    private cityMap: CityMap;
    private renderer: AmberRenderer;
    private deltaTime: number;
    private readonly MAP_WIDTH: number;
    private readonly MAP_HEIGHT: number;

    constructor(cityMap: CityMap, renderer: AmberRenderer, mapWidth: number, mapHeight: number) {
        this.vehicles = [];
        this.cityMap = cityMap;
        this.renderer = renderer;
        this.deltaTime = 0;
        this.MAP_WIDTH = mapWidth;
        this.MAP_HEIGHT = mapHeight;
    }

    public setDeltaTime(deltaTime: number): void {
        this.deltaTime = deltaTime;
    }

    public getVehicles(): Vehicle[] {
        return this.vehicles;
    }

    public updateTraffic(): void {
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

    public updateVehicles(getRoadConnections: (x: number, y: number) => { north: boolean, east: boolean, south: boolean, west: boolean }): void {
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
                const connections = getRoadConnections(vehicle.tileX, vehicle.tileY);
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

    public cycleTrafficLights(): void {
        const map = this.cityMap.getAllTiles();
        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                const tile = map[y][x];
                if (tile.trafficLight) {
                    // Wechsel zwischen RED_NS (1) und RED_EW (2)
                    tile.trafficLight = tile.trafficLight === 1 ? 2 : 1;
                }
            }
        }
    }

    public drawTrafficDensityOverlay(ctx: CanvasRenderingContext2D, x: number, y: number, traffic: number): void {
        const tileSize = this.renderer.getTileSize();
        
        // Farbe basierend auf Verkehrsdichte (0-100)
        let color: string;
        if (traffic < 25) {
            color = `rgba(46, 204, 113, 0.6)`; // Grün - wenig Verkehr
        } else if (traffic < 50) {
            color = `rgba(241, 196, 15, 0.6)`; // Gelb - mittel
        } else if (traffic < 75) {
            color = `rgba(230, 126, 34, 0.6)`; // Orange - viel
        } else {
            color = `rgba(231, 76, 60, 0.6)`; // Rot - Stau
        }
        
        ctx.fillStyle = color;
        ctx.fillRect(x, y, tileSize, tileSize);
        
        // Text mit Verkehrsdichte-Wert
        ctx.fillStyle = 'white';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(traffic.toString(), x + tileSize / 2, y + tileSize / 2);
    }
}
