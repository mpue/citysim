import { CityMap } from './citymap.js';
import { TileType } from './types.js';

export class SimulationEngine {
    private cityMap: CityMap;

    constructor(cityMap: CityMap) {
        this.cityMap = cityMap;
    }

    public simulate(happiness: number): number {
        this.cityMap.updatePowerGrid();

        let monthlyIncome = 0;

        const map = this.cityMap.getAllTiles();
        for (let y = 0; y < this.cityMap.getHeight(); y++) {
            for (let x = 0; x < this.cityMap.getWidth(); x++) {
                const tile = map[y][x];

                switch (tile.type) {
                    case TileType.RESIDENTIAL:
                        monthlyIncome += this.simulateResidential(x, y, tile, happiness);
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

    private simulateResidential(x: number, y: number, tile: any, happiness: number): number {
        const hasRoad = this.cityMap.hasAdjacentRoad(x, y);
        
        // Abwanderung bei niedriger Zufriedenheit
        if (happiness < 40 && tile.population > 0) {
            // Je niedriger die Zufriedenheit, desto höher die Abwanderungsrate
            const emigrationChance = (40 - happiness) / 200; // 0% bei 40, 20% bei 0
            if (Math.random() < emigrationChance) {
                const loss = Math.floor(Math.random() * 10) + 5; // 5-15 Einwohner
                tile.population = Math.max(0, tile.population - loss);
                
                // Bei sehr niedriger Bevölkerung sinkt auch Entwicklung
                if (tile.population < 10 + (tile.development - 1) * 50 && tile.development > 0) {
                    tile.development = Math.max(0, tile.development - 1);
                }
            }
        }
        
        // Grundbevölkerung auch ohne Entwicklung
        if (tile.population === 0 && hasRoad && tile.powered && happiness >= 30) {
            tile.population = 10; // Startbevölkerung (nur wenn Zufriedenheit nicht zu niedrig)
        }
        
        // Wachstum nur bei ausreichender Zufriedenheit
        if (hasRoad && tile.powered && tile.development < 3 && happiness >= 50) {
            if (Math.random() < 0.05) {
                tile.development++;
                tile.population = 10 + tile.development * 50;
            }
        }
        
        // Bevölkerung wächst auch ohne Entwicklungssprünge (nur bei guter Zufriedenheit)
        if (hasRoad && tile.powered && tile.population > 0 && tile.population < 10 + tile.development * 50 && happiness >= 40) {
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
