import { DatabaseSync } from 'node:sqlite';
import type { TrafficGraphNode } from './trafficGraph.js';
import { connect } from '../../graph/graph.js';
import { generateTransferOtherLineArc } from './trafficGraph.js';
import type { Position2D } from '../../geojson.js';

/**
 * Connects bus nodes to their nearest station nodes within maximum distance
 * @param stationNodes - Array of station graph nodes
 * @param busNodes - Array of bus stop graph nodes
 * @param maxDistance - Maximum connection distance threshold
 */
export function connectBusToStation(
  stationNodes: TrafficGraphNode[], 
  busNodes: TrafficGraphNode[], 
  maxDistance: number
): void {
  const allNodes = [...stationNodes, ...busNodes];
  const db = buildSpatialIndex(allNodes);
  
  try {
    for (const busNode of busNodes) {
      const position = busNode.item.station.position;
      const nearestStation = findNearestNodeOfType(
        db, 
        position, 
        'station', 
        maxDistance, 
        allNodes
      );
      
      if (nearestStation) {
        const arc = generateTransferOtherLineArc(busNode, nearestStation, 1);
        connect(busNode, nearestStation, arc);
      }
    }
  } finally {
    db.close();
  }
}

/**
 * Builds a spatial index for efficient nearest-neighbor queries
 * @param nodes - Traffic graph nodes to index
 * @returns SQLite database instance with spatial index
 */
function buildSpatialIndex(nodes: TrafficGraphNode[]): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  
  db.exec(`
    CREATE VIRTUAL TABLE nodes USING rtree(id, minX, maxX, minY, maxY);
    CREATE TABLE node_data(id INTEGER PRIMARY KEY, node_id TEXT, type TEXT, x REAL, y REAL);
  `);
  
  db.exec('BEGIN TRANSACTION');
  
  const insertRtree = db.prepare('INSERT INTO nodes VALUES (?, ?, ?, ?, ?)');
  const insertData = db.prepare('INSERT INTO node_data VALUES (?, ?, ?, ?, ?)');
  
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const pos = node.item.station.position;
    const type = node.item.station.routeId ? 'station' : 'bus_stop';
    
    insertRtree.run(i, pos[0], pos[0], pos[1], pos[1]);
    insertData.run(i, node.id.toString(), type, pos[0], pos[1]);
  }
  
  db.exec('COMMIT; CREATE INDEX idx_node_data_type ON node_data(type);');
  
  return db;
}

/**
 * Finds the nearest node of a specific type from the given position
 * @param db - SQLite database with spatial index
 * @param position - Geographic position to search from
 * @param type - Type of node to search for (station or bus_stop)
 * @param maxDistance - Maximum distance threshold for connection
 * @param allNodes - All traffic graph nodes
 * @returns The nearest node within maxDistance or null if none found
 */
function findNearestNodeOfType(
  db: DatabaseSync,
  position: Position2D,
  type: 'station' | 'bus_stop',
  maxDistance: number,
  allNodes: TrafficGraphNode[]
): TrafficGraphNode | null {
  const query = `
    SELECT n.id, nd.node_id, nd.x, nd.y,
           (((nd.x - ?) * (nd.x - ?)) + ((nd.y - ?) * (nd.y - ?))) as distance
    FROM nodes n
    JOIN node_data nd ON n.id = nd.id
    WHERE nd.type = ?
    ORDER BY distance ASC
    LIMIT 1
  `;
  
  const row = db.prepare(query).get(position[0], position[0], position[1], position[1], type);
  
  if (!row) return null;
  
  const distance = Math.sqrt(row.distance as any);
  if (distance > maxDistance) return null;
  
  const node = allNodes.find(n => n.id.toString() === row.node_id);
  return node || null;
}

