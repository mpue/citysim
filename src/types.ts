// Types und Interfaces
export enum TileType {
    EMPTY = 0,
    RESIDENTIAL = 1,
    COMMERCIAL = 2,
    INDUSTRIAL = 3,
    ROAD = 4,
    POWER_PLANT = 5,
    POWER_LINE = 6,
    PARK = 7
}

export interface Tile {
    type: TileType;
    powered: boolean;
    development: number;
    population: number;
}

export interface Position {
    x: number;
    y: number;
}

export interface GameStats {
    money: number;
    population: number;
    year: number;
    month: number;
}

export type ToolType = 'bulldozer' | 'residential' | 'commercial' | 'industrial' | 
                       'road' | 'power' | 'powerline' | 'park';

export const TILE_COSTS: Record<TileType, number> = {
    [TileType.EMPTY]: 0,
    [TileType.RESIDENTIAL]: 100,
    [TileType.COMMERCIAL]: 100,
    [TileType.INDUSTRIAL]: 100,
    [TileType.ROAD]: 10,
    [TileType.POWER_PLANT]: 3000,
    [TileType.POWER_LINE]: 5,
    [TileType.PARK]: 20
};
