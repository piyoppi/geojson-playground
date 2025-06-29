import type { BusStopNode, RailroadStationNode, TrafficNode } from './trafficGraph.js';
import { connect } from '../../graph/graph.js';
import { generateTransferOtherLineArc } from './trafficGraph.js';
import type { Position2D } from '../../geometry/index.js';
import { BusStop } from '../busroute.js';
import { StationId } from '../transportation.js';
import { RailroadStation } from '../railroad.js';

/**
 * Connects bus nodes to their nearest station nodes within maximum distance
 * @param stationNodes - Array of station graph nodes
 * @param busNodes - Array of bus stop graph nodes
 * @param maxDistance - Maximum connection distance threshold
 */
export function mergeGraphNodes(
  stationNodes: RailroadStationNode[],
  busNodes: BusStopNode[],
  getRailroadStation: (id: StationId) => RailroadStation | undefined,
  getBusStop: (id: StationId) => BusStop | undefined,
  maxDistance: number = 0.0012868993
): void {
  const { grid, cellSize } = buildSpatialIndex(stationNodes, getRailroadStation, maxDistance);

  for (const busNode of busNodes) {
    const busStop = getBusStop(busNode.item.busStopIds[0])
    if (!busStop) continue

    const position = busStop.position;
    const nearestStation = findNearest(position, maxDistance, grid, getRailroadStation, cellSize)

    if (nearestStation) {
      const arc = generateTransferOtherLineArc(busNode, nearestStation, 1)
      connect(busNode, nearestStation, arc);
    }
  }
}

type SpatialGrid<T> = {
  grid: Map<string, T[]>
  cellSize: number
}

/**
 * Builds a spatial index using grid-based partitioning
 * @param nodes - Traffic graph nodes to index
 * @param maxDistance - The maximum search distance (used to determine cell size)
 * @returns Spatial grid data structure
 */
function buildSpatialIndex(
  nodes: RailroadStationNode[],
  getRailroadStation: (id: StationId) => RailroadStation | undefined,
  maxDistance: number
): SpatialGrid<RailroadStationNode> {
  const grid = new Map<string, RailroadStationNode[]>()
  const cellSize = maxDistance * 2

  // Index all nodes
  for (const node of nodes) {
    const railroadStation = getRailroadStation(node.item.stationId)
    if (!railroadStation) continue

    const cellKey = getCellKey(railroadStation.position, cellSize)

    if (!grid.has(cellKey)) {
      grid.set(cellKey, [])
    }

    grid.get(cellKey)!.push(node)
  }

  return { grid, cellSize }
}

/**
 * Find the nearest node to the given position within maximum distance
 * @param position - The position to search from
 * @param maxDistance - Maximum allowable distance
 * @param grid - The spatial grid to search in
 * @param cellSize - Size of each grid cell
 * @returns The nearest node within the max distance, or null if none found
 */
function findNearest(
  position: Position2D,
  maxDistance: number,
  grid: Map<string, RailroadStationNode[]>,
  getRailroadStation: (id: StationId) => RailroadStation | undefined,
  cellSize: number
): TrafficNode | null {
  const cellKey = getCellKey(position, cellSize);

  const cellsToCheck = getAdjacentCellKeys(cellKey);

  let nearestNode: TrafficNode | null = null;
  let minDistance = maxDistance;

  for (const key of cellsToCheck) {
    const nodesInCell = grid.get(key) || [];

    for (const node of nodesInCell) {
      const railroadStation = getRailroadStation(node.item.stationId)
      if (!railroadStation) continue

      const distance = calculateDistance(position, railroadStation.position);
      if (distance < minDistance) {
        minDistance = distance;
        nearestNode = node;
      }
    }
  }

  return nearestNode;
}

/**
 * Convert a geographic position to a grid cell key
 * @param position - The position to convert
 * @param cellSize - Size of each grid cell
 * @returns A string key representing the cell
 */
function getCellKey(position: Position2D, cellSize: number): string {
  const x = Math.floor(position[0] / cellSize);
  const y = Math.floor(position[1] / cellSize);
  return `${x},${y}`;
}

/**
 * Get the keys for adjacent cells including the given cell
 * @param cellKey - The center cell key
 * @returns Array of cell keys to check
 */
function getAdjacentCellKeys(cellKey: string): string[] {
  const [x, y] = cellKey.split(',').map(Number);
  const keys: string[] = [];

  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      keys.push(`${x + i},${y + j}`);
    }
  }

  return keys;
}

/**
 * Calculate the Euclidean distance between two points
 * @param p1 - First position
 * @param p2 - Second position
 * @returns The distance between the points
 */
function calculateDistance(p1: Position2D, p2: Position2D): number {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  return Math.sqrt(dx * dx + dy * dy);
}
