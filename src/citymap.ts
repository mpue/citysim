import { Tile, TileType, Position } from './types.js';

export class CityMap {
    private map: Tile[][];
    private readonly width: number;
    private readonly height: number;
    public powerGrid: Set<string>;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.powerGrid = new Set<string>();
        this.map = this.createEmptyMap();
    }

    private createEmptyMap(): Tile[][] {
        const map: Tile[][] = [];
        for (let y = 0; y < this.height; y++) {
            map[y] = [];
            for (let x = 0; x < this.width; x++) {
                map[y][x] = {
                    type: TileType.EMPTY,
                    powered: false,
                    development: 0,
                    population: 0,
                    variant: Math.floor(Math.random() * 4),  // 4 verschiedene Varianten
                    powerLine: false,  // Keine Stromleitung zu Beginn
                    traffic: 0  // Kein Verkehr zu Beginn
                };
            }
        }
        return map;
    }

    // Kreuzungen mit Ampeln markieren
    public updateTrafficLights(): void {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.map[y][x];
                if (tile.type !== TileType.ROAD) {
                    tile.trafficLight = undefined;
                    continue;
                }

                // Prüfen ob Kreuzung (mindestens 3 Verbindungen)
                let connections = 0;
                const hasNorth = y > 0 && this.map[y - 1][x].type === TileType.ROAD;
                const hasEast = x < this.width - 1 && this.map[y][x + 1].type === TileType.ROAD;
                const hasSouth = y < this.height - 1 && this.map[y + 1][x].type === TileType.ROAD;
                const hasWest = x > 0 && this.map[y][x - 1].type === TileType.ROAD;

                if (hasNorth) connections++;
                if (hasEast) connections++;
                if (hasSouth) connections++;
                if (hasWest) connections++;

                // Ampel nur bei echten Kreuzungen (3 oder 4 Verbindungen)
                if (connections >= 3) {
                    if (!tile.trafficLight) {
                        tile.trafficLight = 1; // Start mit RED_NS
                    }
                } else {
                    tile.trafficLight = undefined;
                }
            }
        }
    }

    public getTile(x: number, y: number): Tile | null {
        if (!this.isValidPosition(x, y)) return null;
        return this.map[y][x];
    }

    public setTileType(x: number, y: number, type: TileType): boolean {
        if (!this.isValidPosition(x, y)) return false;
        const tile = this.map[y][x];
        tile.type = type;
        if (type === TileType.EMPTY) {
            tile.development = 0;
            tile.population = 0;
        }
        return true;
    }

    public setPowerLine(x: number, y: number, hasPowerLine: boolean): boolean {
        if (!this.isValidPosition(x, y)) return false;
        this.map[y][x].powerLine = hasPowerLine;
        return true;
    }

    public hasPowerLine(x: number, y: number): boolean {
        if (!this.isValidPosition(x, y)) return false;
        return this.map[y][x].powerLine;
    }

    public isValidPosition(x: number, y: number): boolean {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    public getWidth(): number {
        return this.width;
    }

    public getHeight(): number {
        return this.height;
    }

    public getAllTiles(): Tile[][] {
        return this.map;
    }

    public updatePowerGrid(): void {
        this.powerGrid.clear();

        // Alle Kraftwerke finden
        const powerSources: Position[] = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.map[y][x];
                tile.powered = false;
                if (tile.type === TileType.POWER_PLANT) {
                    powerSources.push({ x, y });
                    tile.powered = true;
                    this.powerGrid.add(`${x},${y}`);
                }
            }
        }

        // Strom durch Leitungen und direkte Nachbarschaft verteilen (Flood Fill)
        const queue: Position[] = [...powerSources];
        const visited = new Set<string>();

        while (queue.length > 0) {
            const pos = queue.shift()!;
            const key = `${pos.x},${pos.y}`;

            if (visited.has(key)) continue;
            visited.add(key);

            // Nachbarn prüfen
            const neighbors: Position[] = [
                { x: pos.x - 1, y: pos.y },
                { x: pos.x + 1, y: pos.y },
                { x: pos.x, y: pos.y - 1 },
                { x: pos.x, y: pos.y + 1 }
            ];

            for (const n of neighbors) {
                if (!this.isValidPosition(n.x, n.y)) continue;

                const nKey = `${n.x},${n.y}`;
                if (visited.has(nKey)) continue;

                const tile = this.map[n.y][n.x];
                
                // Stromleitungen UND Gebäude leiten Strom weiter (blockweise)
                const canConduct = tile.powerLine ||
                                  tile.type === TileType.RESIDENTIAL ||
                                  tile.type === TileType.COMMERCIAL ||
                                  tile.type === TileType.INDUSTRIAL;

                if (canConduct) {
                    // Strom verteilen UND weiterleiten
                    tile.powered = true;
                    this.powerGrid.add(nKey);
                    queue.push(n);
                }
            }
        }
    }

    public hasAdjacentRoad(x: number, y: number): boolean {
        const neighbors: Position[] = [
            { x: x - 1, y },
            { x: x + 1, y },
            { x, y: y - 1 },
            { x, y: y + 1 }
        ];

        for (const n of neighbors) {
            if (!this.isValidPosition(n.x, n.y)) continue;
            if (this.map[n.y][n.x].type === TileType.ROAD) return true;
        }
        return false;
    }

    public calculatePopulation(): number {
        let total = 0;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                total += this.map[y][x].population;
            }
        }
        return total;
    }
}
