import { Route, Station } from '@piyoppi/sansaku-pilot/traffic/transportation'
import type { DatabaseHandler } from '../database.js'

export type StationSummary = {
  id: string,
  partitionKey: string,
  name: string,
  routeName: string
}

type StationSummaryRecord = {
  id: string,
  partition_key: string,
  name: string,
  route_name: string
}

export const createTable = (database: DatabaseHandler, routes: Route<Station>[]) => {
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
    
    for (const railroad of routes) {
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

export const findStationSummariesFromKeyword = (database: DatabaseHandler, stationName: string): StationSummary[] => {
  const query = `
    SELECT id, partition_key, name, route_name 
    FROM stations 
    WHERE name LIKE ? 
    ORDER BY name
  `
  
  const stmt = database.prepare(query)
  const searchPattern = `${stationName}%`
  
  const items: any[] = stmt.all(searchPattern) as StationSummaryRecord[]

  return convertRecordToModel(items)
}

export const findStationSummariesFromId = (database: DatabaseHandler, ids: string[]): StationSummary[] => {
  const query = `
    SELECT id, partition_key, name, route_name 
    FROM stations 
    WHERE id in (${ids.map(_ => '?').join(',')})
    ORDER BY name
  `

  const stmt = database.prepare(query)
  const items = stmt.all(...ids) as StationSummaryRecord[]

  return convertRecordToModel(items)
}

const convertRecordToModel = (items: StationSummaryRecord[]): StationSummary[] =>
  items.map(item => ({
    id: item.id,
    partitionKey: item.partition_key,
    name: item.name,
    routeName: item.route_name
  }))
