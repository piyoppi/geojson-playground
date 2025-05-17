import { Route, Station } from '@piyoppi/sansaku-pilot/traffic/transportation'
import type { DatabaseHandler } from '../database.js'
import { buildPlaceholder } from '../helpers/query.js'
import { getTrafficGraphPartitionKey } from '@piyoppi/sansaku-pilot/traffic/graph/separate'

type StationKind = 'station' | 'busStop'

export type StationSummaryGroup = {
  id: string,
  name: string,
  kind: StationKind
}

export type StationSummary = {
  id: string,
  groupId: string,
  partitionKey: string,
  name: string,
  kind: StationKind,
  routeName: string
}

type StationSummaryRecord = {
  id: string,
  group_id: string,
  partition_key: string,
  name: string,
  kind: StationKind,
  route_name: string
}

type StationSummaryGroupRecord = {
  id: string,
  name: string,
  kind: StationKind
}

export const createTable = (database: DatabaseHandler, routes: Route<Station>[]) => {
  createStationSummaryTable(database)
  createStationSummaryGroupTable(database)

  insertStationSummaryGroup(database, routes)
  insertStationSummary(database, routes)
}

export const findStationSummariesFromGroupId = (database: DatabaseHandler, groupIds: string[]): StationSummary[] => {
  const query = `
    SELECT id, group_id, partition_key, name, kind, route_name 
    FROM stations 
    WHERE group_id in (${buildPlaceholder(groupIds)})
    ORDER BY name
  `

  const stmt = database.prepare(query)
  const items = stmt.all(...groupIds) as StationSummaryRecord[]

  return convertStationSummaryRecordsToModel(items)
}

export const findStationSummariesFromKeyword = (database: DatabaseHandler, stationNamePart: string, limit: number): StationSummary[] => {
  const query = `
    SELECT id, group_id, partition_key, name, kind, route_name 
    FROM stations 
    WHERE name LIKE ? 
    ORDER BY name
    LIMIT ?
  `
  
  const stmt = database.prepare(query)
  const searchPattern = `${stationNamePart}%`
  
  const items: any[] = stmt.all(searchPattern, limit) as StationSummaryRecord[]

  return convertStationSummaryRecordsToModel(items)
}

export const findStationSummaryGroupsFromKeyword = (database: DatabaseHandler, stationNamePart: string, limit: number): StationSummaryGroup[] => {
  const query = `
    SELECT id, name, kind
    FROM station_groups
    WHERE name LIKE ?
    ORDER BY name
    LIMIT ?
  `

  const stmt = database.prepare(query)
  const searchPattern = `${stationNamePart}%`
  
  const items: any[] = stmt.all(searchPattern, limit) as StationSummaryGroupRecord[]

  return convertStationSummaryGroupRecordsToModel(items)
}

export const findStationSummariesFromId = (database: DatabaseHandler, ids: string[]): StationSummary[] => {
  const query = `
    SELECT id, group_id, partition_key, name, kind, route_name 
    FROM stations 
    WHERE id in (${buildPlaceholder(ids)})
    ORDER BY name
  `

  const stmt = database.prepare(query)
  const items = stmt.all(...ids) as StationSummaryRecord[]

  return convertStationSummaryRecordsToModel(items)
}

export const findStationSummaryGroupFromId = (database: DatabaseHandler, ids: string[]): StationSummaryGroup[] => {
  const query = `
    SELECT id, name, kind
    FROM station_groups 
    WHERE id in (${buildPlaceholder(ids)})
    ORDER BY name
  `

  const stmt = database.prepare(query)
  const items = stmt.all(...ids) as StationSummaryGroupRecord[]

  return convertStationSummaryGroupRecordsToModel(items)
}

const convertStationSummaryRecordsToModel = (items: StationSummaryRecord[]): StationSummary[] =>
  items.map(item => ({
    id: item.id,
    groupId: item.group_id,
    partitionKey: item.partition_key,
    name: item.name,
    kind: item.kind,
    routeName: item.route_name
  }))

const convertStationSummaryGroupRecordsToModel = (items: StationSummaryGroupRecord[]): StationSummaryGroup[] =>
  items.map(item => ({
    id: item.id,
    name: item.name,
    kind: item.kind
  }))

const createStationSummaryTable = (database: DatabaseHandler) => {
  database.exec(`
    CREATE TABLE IF NOT EXISTS stations (
      id TEXT PRIMARY KEY,
      group_id TEXT,
      partition_key TEXT,
      name TEXT,
      kind TEXT,
      route_name TEXT
    )
  `)

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_stations_name ON stations (name)
  `)
}

const createStationSummaryGroupTable = (database: DatabaseHandler) => {
  database.exec(`
    CREATE TABLE IF NOT EXISTS station_groups (
      id TEXT PRIMARY KEY,
      name TEXT,
      kind TEXT
    )
  `)

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_station_groups_name ON station_groups (name)
  `)
}

const insertStationSummaryGroup = (database: DatabaseHandler, routes: Route<Station>[]) => {
  const insertStmt = database.prepare('INSERT OR REPLACE INTO station_groups (id, name, kind) VALUES (?, ?, ?)')
  const insertedGroups = new Set<string>()
  
  try {
    database.exec('BEGIN TRANSACTION')
    
    for (const railroad of routes) {
      for (const station of railroad.stations) {
        if (station.groupId && insertedGroups.has(station.groupId)) {
          continue
        }

        insertStmt.run(station.groupId || station.id, station.name, railroad.kind)
      }
    }
    
    database.exec('COMMIT')
  } catch (error) {
    database.exec('ROLLBACK')
    throw error
  }
}

const insertStationSummary = (database: DatabaseHandler, routes: Route<Station>[]) => {
  const insertStmt = database.prepare('INSERT OR REPLACE INTO stations (id, group_id, partition_key, name, kind, route_name) VALUES (?, ?, ?, ?, ?, ?)')
  
  try {
    database.exec('BEGIN TRANSACTION')
    
    for (const railroad of routes) {
      const routeName = railroad.name
      
      for (const station of railroad.stations) {
        insertStmt.run(station.id, station.groupId || station.id, getTrafficGraphPartitionKey(railroad), station.name, railroad.kind, routeName)
      }
    }
    
    database.exec('COMMIT')
  } catch (error) {
    database.exec('ROLLBACK')
    throw error
  }
}
