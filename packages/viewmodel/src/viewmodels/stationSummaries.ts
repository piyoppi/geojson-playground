import type { DatabaseHandler } from '../database.js'
import type { Railroad } from '@piyoppi/sansaku-pilot/traffic/railroad.js'

export type StationSummary = {
  id: string,
  partitionKey: string,
  name: string,
  routeName: string
}

export const createTable = (database: DatabaseHandler, railroads: Railroad[]) => {
  database.exec(`
    CREATE TABLE IF NOT EXISTS stations (
      id TEXT PRIMARY KEY,
      partition_key TEXT,
      name TEXT,
      route_name TEXT
    )
  `)

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_stations_name ON stations (name)
  `)

  const insertStmt = database.prepare('INSERT OR REPLACE INTO stations (id, partition_key, name, route_name) VALUES (?, ?, ?, ?)')
  
  try {
    database.exec('BEGIN TRANSACTION')
    
    for (const railroad of railroads) {
      const routeName = railroad.name
      
      for (const station of railroad.stations) {
        insertStmt.run(station.id, railroad.companyId, station.name, routeName)
      }
    }
    
    database.exec('COMMIT')
  } catch (error) {
    database.exec('ROLLBACK')
    throw error
  } finally {
    database.close()
  }
}

export const findStationSummaries = (database: DatabaseHandler, stationName: string): StationSummary[] => {
  const query = `
    SELECT id, partition_key, name, route_name 
    FROM stations 
    WHERE name LIKE ? 
    ORDER BY name
  `
  
  const stmt = database.prepare(query)
  const searchPattern = `${stationName}%`
  
  const items: any[] = stmt.all(searchPattern)

  return items.map(item => ({
    id: item.id,
    partitionKey: item.partition_key,
    name: item.name,
    routeName: item.route_name
  }))
}
