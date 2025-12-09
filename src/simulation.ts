import { CityMap } from './citymap.js';
import { TileType } from './types.js';

export class SimulationEngine {
    private cityMap: CityMap;

    constructor(cityMap: CityMap) {
        this.cityMap = cityMap;
    }

    public simulate(): number {
        this.cityMap.updatePowerGrid();

        let monthlyIncome = 0;

        const map = this.cityMap.getAllTiles();
        for (let y = 0; y < this.cityMap.getHeight(); y++) {
            for (let x = 0; x < this.cityMap.getWidth(); x++) {
                const tile = map[y][x];

                switch (tile.type) {
                    case TileType.RESIDENTIAL:
                        monthlyIncome += this.simulateResidential(x, y, tile);
                        break;
                    case TileType.COMMERCIAL:
                        monthlyIncome += this.simulateCommercial(x, y, tile);
                        break;
                    case TileType.INDUSTRIAL:
                        monthlyIncome += this.simulateIndustrial(x, y, tile);
                        break;
                    case TileType.POWER_PLANT:
                        monthlyIncome -= 50; // Wartungskosten
                        break;
                }
            }
        }

        return Math.floor(monthlyIncome);
    }

    private simulateResidential(x: number, y: number, tile: any): number {
        const hasRoad = this.cityMap.hasAdjacentRoad(x, y);
        
        // Grundbevölkerung auch ohne Entwicklung
        if (tile.population === 0 && hasRoad && tile.powered) {
            tile.population = 10; // Startbevölkerung
        }
        
        if (hasRoad && tile.powered && tile.development < 3) {
            if (Math.random() < 0.05) {
                tile.development++;
                tile.population = 10 + tile.development * 50;
            }
        }
        
        // Bevölkerung wächst auch ohne Entwicklungssprünge
        if (hasRoad && tile.powered && tile.population > 0 && tile.population < 10 + tile.development * 50) {
            if (Math.random() < 0.1) {
                tile.population += Math.floor(Math.random() * 5) + 1;
            }
        }
        
        return tile.population * 0.1; // Steuereinnahmen
    }

    private simulateCommercial(x: number, y: number, tile: any): number {
        const hasRoad = this.cityMap.hasAdjacentRoad(x, y);
        if (hasRoad && tile.powered && tile.development < 3) {
            if (Math.random() < 0.03) {
                tile.development++;
            }
        }
        return tile.development * 10;
    }

    private simulateIndustrial(x: number, y: number, tile: any): number {
        const hasRoad = this.cityMap.hasAdjacentRoad(x, y);
        if (hasRoad && tile.powered && tile.development < 3) {
            if (Math.random() < 0.04) {
                tile.development++;
            }
        }
        return tile.development * 15;
    }
}
