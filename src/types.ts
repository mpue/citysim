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
    variant: number;  // Gebäudevariante für visuelle Vielfalt
    powerLine: boolean;  // Stromleitung als Overlay
    traffic: number;  // Verkehrsdichte (0-100)
    trafficLight?: TrafficLightState;  // Ampelzustand an Kreuzungen
}

export enum TrafficLightState {
    NONE = 0,
    RED_NS = 1,    // Rot für Nord-Süd, Grün für Ost-West
    RED_EW = 2     // Rot für Ost-West, Grün für Nord-Süd
}

export interface Vehicle {
    x: number;
    y: number;
    tileX: number;
    tileY: number;
    direction: 'north' | 'south' | 'east' | 'west';
    speed: number;
    color: string;
    lane: 'left' | 'right';  // Fahrspur (rechts = rechte Fahrbahn)
    stopped: boolean;  // Ob Fahrzeug an Ampel wartet
    turning?: boolean;  // Ob Fahrzeug gerade abbiegt
    turnProgress?: number;  // Fortschritt der Kurve (0-1)
    turnFrom?: 'north' | 'south' | 'east' | 'west';  // Ursprungsrichtung
    turnStartX?: number;  // Startposition X der Kurve
    turnStartY?: number;  // Startposition Y der Kurve
}

export interface Position {
    x: number;
    y: number;
    width?: number;  // Optionale Breite für Multi-Tile-Gebäude
    height?: number; // Optionale Höhe für Multi-Tile-Gebäude
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
