import { Route, Station } from '@piyoppi/sansaku-pilot/traffic/transportation'
import type { DatabaseHandler } from '../../database.js'

export type StationSummaryGroup = {
  id: string,
  groupId: string,
  partitionKey: string,
  name: string,
  routeName: string
}

type StationSummaryGroupRecord = {
  id: string,
  group_id: string,
  partition_key: string,
  name: string,
  route_name: string
}

export const createTable = (database: DatabaseHandler, routes: Route<Station>[]) => {
  database.exec(`
    CREATE TABLE IF NOT EXISTS station_groups (
      id TEXT PRIMARY KEY,
      name TEXT
    )
  `)

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_stations_name ON stations (name)
  `)

  const insertStmt = database.prepare('INSERT OR REPLACE INTO stations (id, name) VALUES (?, ?, ?, ?)')
  
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
  }
}

export const findStationSummariesFromKeyword = (database: DatabaseHandler, stationNamePart: string, limit: number): StationSummary[] => {
  const query = `
    SELECT id, partition_key, name, route_name 
    FROM stations 
    WHERE name LIKE ? 
    ORDER BY name
    LIMIT ?
  `
  
  const stmt = database.prepare(query)
  const searchPattern = `${stationNamePart}%`
  
  const items: any[] = stmt.all(searchPattern, limit) as StationSummaryRecord[]

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
