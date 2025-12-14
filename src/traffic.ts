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
                    
                    // Fahrzeuge basierend auf Verkehrsdichte erstellen
                    // Geringere Wahrscheinlichkeit für gleichmäßigere Verteilung
                    if (tile.traffic > 20 && Math.random() < 0.05) {
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
        
        let lane: 'left' | 'right';
        if (direction === 'north' || direction === 'east') {
            lane = 'right';
        } else {
            lane = 'left';
        }
        
        let startX = tileX * tileSize + tileSize / 2;
        let startY = tileY * tileSize + tileSize / 2;
        
        const laneOffset = 3.5;
        if (direction === 'north' || direction === 'south') {
            startX += lane === 'right' ? laneOffset : -laneOffset;
        } else {
            startY += lane === 'right' ? laneOffset : -laneOffset;
        }
        
        const baseSpeed = 1.0 + Math.random() * 0.5;  // 1.0-1.5 für flüssigeren Verkehr
        const vehicle: Vehicle = {
            tileX,
            tileY,
            x: startX,
            y: startY,
            direction,
            speed: baseSpeed,
            targetSpeed: baseSpeed,
            color: colors[Math.floor(Math.random() * colors.length)],
            lane,
            stopped: false,
            turning: false,
            turnProgress: 0
        };
        
        this.vehicles.push(vehicle);
        
        if (this.vehicles.length > 250) {
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
            
            // Zielgeschwindigkeit zurücksetzen (wird basierend auf Bedingungen angepasst)
            vehicle.targetSpeed = vehicle.speed;
            vehicle.stopped = false;
            
            // Ampelstatus prüfen
            if (currentTile?.trafficLight) {
                const isNorthSouth = vehicle.direction === 'north' || vehicle.direction === 'south';
                const isRedForMe = (currentTile.trafficLight === 1 && isNorthSouth) ||  // RED_NS
                                   (currentTile.trafficLight === 2 && !isNorthSouth);   // RED_EW
                
                if (isRedForMe) {
                    vehicle.targetSpeed = 0;
                    vehicle.stopped = vehicle.speed < 0.1;  // Nur als gestoppt markieren wenn fast steht
                }
            }
            
            // Kollisionserkennung: Passe Geschwindigkeit an Fahrzeug vor uns an
            if (!vehicle.stopped) {
                const result = this.checkVehicleAhead(vehicle, i);
                if (result) {
                    // Sanft bremsen basierend auf Abstand
                    if (result.distance < 12) {
                        vehicle.targetSpeed = Math.max(0, result.other.speed * 0.7);
                    } else if (result.distance < 20) {
                        vehicle.targetSpeed = result.other.speed;
                    }
                    
                    if (result.distance < 6) {
                        vehicle.stopped = true;
                    }
                }
            }
            
            // Sanft zur Zielgeschwindigkeit beschleunigen/bremsen
            const acceleration = 0.15 * speedMultiplier;  // Beschleunigung
            if (vehicle.speed < vehicle.targetSpeed) {
                vehicle.speed = Math.min(vehicle.targetSpeed, vehicle.speed + acceleration);
            } else if (vehicle.speed > vehicle.targetSpeed) {
                vehicle.speed = Math.max(vehicle.targetSpeed, vehicle.speed - acceleration * 2);  // Schneller bremsen als beschleunigen
            }
            
            // Fahrzeug nur bewegen wenn Geschwindigkeit > 0
            if (vehicle.speed > 0.05) {
                const moveSpeed = vehicle.speed * speedMultiplier;
                
                // Normale Bewegung - keine komplexe Kurven-Animation
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
            
            // Tile-Position aktualisieren
            const newTileX = Math.floor(vehicle.x / tileSize);
            const newTileY = Math.floor(vehicle.y / tileSize);
            
            // Prüfe ob Fahrzeug außerhalb der Karte ist - dann löschen
            if (newTileX < 0 || newTileX >= this.MAP_WIDTH ||
                newTileY < 0 || newTileY >= this.MAP_HEIGHT) {
                this.vehicles.splice(i, 1);
                continue;
            }
            
            // Wenn Fahrzeug Tile-Grenze überschreitet
            if (newTileX !== vehicle.tileX || newTileY !== vehicle.tileY) {
                vehicle.tileX = newTileX;
                vehicle.tileY = newTileY;
                
                // Prüfe ob aktuelles Tile eine Straße ist
                const currentTile = map[vehicle.tileY][vehicle.tileX];
                if (currentTile.type === TileType.ROAD) {
                    // Neue Richtung wählen basierend auf Verbindungen
                    const connections = getRoadConnections(vehicle.tileX, vehicle.tileY);
                    this.updateVehicleDirection(vehicle, connections);
                } else {
                    // Nicht auf Straße, aber gib eine Chance zur Korrektur
                    // Lösche nur nach mehreren Frames
                    if (!vehicle.offRoadCounter) vehicle.offRoadCounter = 0;
                    vehicle.offRoadCounter++;
                    if (vehicle.offRoadCounter > 2) {
                        this.vehicles.splice(i, 1);
                        continue;
                    }
                }
            } else {
                // Auf Straße, Counter zurücksetzen
                vehicle.offRoadCounter = 0;
            }
        }
    }

    private updateVehicleDirection(vehicle: Vehicle, connections: { north: boolean, east: boolean, south: boolean, west: boolean }): void {
        const possibleDirections: Array<'north' | 'south' | 'east' | 'west'> = [];
        const tileSize = this.renderer.getTileSize();
        
        // Sammle mögliche Richtungen (nicht zurück)
        if (connections.north && vehicle.direction !== 'south') possibleDirections.push('north');
        if (connections.south && vehicle.direction !== 'north') possibleDirections.push('south');
        if (connections.east && vehicle.direction !== 'west') possibleDirections.push('east');
        if (connections.west && vehicle.direction !== 'east') possibleDirections.push('west');
        
        // Wenn keine möglichen Richtungen, nichts ändern
        if (possibleDirections.length === 0) {
            return;
        }
        
        const oldDirection = vehicle.direction;
        
        // Wenn nur eine Möglichkeit: gehe diese Richtung
        if (possibleDirections.length === 1) {
            vehicle.direction = possibleDirections[0];
        }
        // Wenn mehrere Möglichkeiten: bevorzuge geradeaus
        else if (possibleDirections.length > 1) {
            // Versuche geradeaus zu bleiben
            if (possibleDirections.includes(vehicle.direction)) {
                // Bleib geradeaus (oder biege mit 25% Chance ab)
                if (Math.random() < 0.25) {
                    vehicle.direction = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
                }
            } else {
                // Muss abbiegen
                vehicle.direction = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
            }
        }
        
        // Wenn Richtung geändert wurde, passe Spur und Position an
        if (oldDirection !== vehicle.direction) {
            // Rechtsverkehr: Spur basierend auf neue Richtung
            if (vehicle.direction === 'north' || vehicle.direction === 'east') {
                vehicle.lane = 'right';
            } else {
                vehicle.lane = 'left';
            }
            
            // Setze Position auf korrekte Spur
            const laneOffset = 3.5;
            const centerX = vehicle.tileX * tileSize + tileSize / 2;
            const centerY = vehicle.tileY * tileSize + tileSize / 2;
            
            if (vehicle.direction === 'north' || vehicle.direction === 'south') {
                vehicle.x = centerX + (vehicle.lane === 'right' ? laneOffset : -laneOffset);
            } else {
                vehicle.y = centerY + (vehicle.lane === 'right' ? laneOffset : -laneOffset);
            }
        }
    }

    private checkVehicleAhead(vehicle: Vehicle, currentIndex: number): { other: Vehicle, distance: number } | null {
        const lookAheadDistance = 30; // Vorausschau-Distanz in Pixeln
        let closestVehicle: Vehicle | null = null;
        let closestDistance = Infinity;
        
        // Prüfe nur Fahrzeuge in der Nähe für bessere Performance
        for (let i = 0; i < this.vehicles.length; i++) {
            if (i === currentIndex) continue; // Nicht sich selbst prüfen
            
            const other = this.vehicles[i];
            
            // Nur Fahrzeuge in gleicher Richtung und Spur prüfen
            if (other.direction !== vehicle.direction || other.lane !== vehicle.lane) {
                continue;
            }
            
            // Schnelle Grob-Prüfung: Ist anderes Fahrzeug in der Nähe?
            const dx = Math.abs(other.x - vehicle.x);
            const dy = Math.abs(other.y - vehicle.y);
            if (dx + dy > lookAheadDistance) {
                continue;  // Zu weit weg
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
            
            // Wenn Fahrzeug vor uns und näher als bisheriger nächster, merken
            if (isAhead && distance > 0 && distance < lookAheadDistance && distance < closestDistance) {
                closestVehicle = other;
                closestDistance = distance;
            }
        }
        
        return closestVehicle ? { other: closestVehicle, distance: closestDistance } : null;
    }

    public cycleTrafficLights(): void {
        const map = this.cityMap.getAllTiles();
        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                const tile = map[y][x];
                if (tile.trafficLight) {
                    // Initialisiere Timer und Phasendauer bei erster Nutzung
                    if (tile.trafficLightTimer === undefined) {
                        // Zufälliger Start-Timer (0-8 Ticks) für versetzte Schaltung
                        tile.trafficLightTimer = Math.floor(Math.random() * 8);
                        // Zufällige Phasendauer zwischen 3 und 7 Ticks (6-14 Sekunden bei 2s/Tick)
                        tile.trafficLightPhaseDuration = 3 + Math.floor(Math.random() * 5);
                    }
                    
                    // Timer herunterzählen
                    tile.trafficLightTimer!--;
                    
                    // Wenn Timer abgelaufen, Ampel schalten
                    if (tile.trafficLightTimer! <= 0) {
                        // Wechsel zwischen RED_NS (1) und RED_EW (2)
                        tile.trafficLight = tile.trafficLight === 1 ? 2 : 1;
                        
                        // Neuer Timer mit neuer zufälliger Phasendauer
                        tile.trafficLightPhaseDuration = 3 + Math.floor(Math.random() * 5);
                        tile.trafficLightTimer = tile.trafficLightPhaseDuration;
                    }
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
