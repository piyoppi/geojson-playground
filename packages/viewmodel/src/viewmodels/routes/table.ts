import { Company, Route, Station } from "@piyoppi/sansaku-pilot/traffic/transportation"
import { DatabaseHandler } from "../../database.js"
import { StationKind } from "./model.js"
import { transaction } from "../../helpers/query.js"

export type CompanySummaryRecord = {
  id: string,
  name: string,
}

export type RouteSummaryRecord = {
  id: string,
  name: string,
  company_id: string
}

export type StationSummaryGroupRecord = {
  id: string,
  name: string,
  kind: StationKind,
}

export type StationSummaryRecord = {
  id: string,
  group_id: string,
  partition_key: string,
  name: string,
  kind: StationKind,
  route_id: string
}

export const createTable = (database: DatabaseHandler) => {
  database.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT
    )
  `)

  database.exec(`
    CREATE TABLE IF NOT EXISTS routes (
      id TEXT PRIMARY KEY,
      name TEXT,
      company_id TEXT
    )
  `)


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


  database.exec(`
    CREATE TABLE IF NOT EXISTS stations (
      id TEXT PRIMARY KEY,
      group_id TEXT,
      partition_key TEXT,
      name TEXT,
      kind TEXT,
      route_id TEXT
    )
  `)

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_stations_name ON stations (name)
  `)
}

export const insert = (database: DatabaseHandler, companies: Company[], routes: Route<Station>[]) => {
  (() => {
    const insertStmt = database.prepare('INSERT OR REPLACE INTO companies (id, name) VALUES (?, ?)')

    transaction(database, () => {
      for (const company of companies) {
        insertStmt.run(company.id, company.name)
      }
    })
  })();

  (() => {
    const insertStmt = database.prepare('INSERT OR REPLACE INTO routes (id, name, company_id) VALUES (?, ?, ?)')

    transaction(database, () => {
      for (const railroad of routes) {
        insertStmt.run(railroad.id, railroad.name, railroad.companyId)
      }
    })
  })();

  (() => {
    const insertStmt = database.prepare('INSERT OR REPLACE INTO station_groups (id, name, kind) VALUES (?, ?, ?)')
    const insertedGroups = new Set<string>()

    transaction(database, () => {
      for (const railroad of routes) {
        for (const station of railroad.stations) {
          if (station.groupId && insertedGroups.has(station.groupId)) {
            continue
          }

          insertStmt.run(station.groupId || station.id, station.name, railroad.kind)
        }
      }
    })
  })();

  (() => {
    const insertStmt = database.prepare('INSERT OR REPLACE INTO stations (id, group_id, partition_key, name, kind, route_id) VALUES (?, ?, ?, ?, ?, ?)')

    transaction(database, () => {
      for (const route of routes) {
        for (const station of route.stations) {
          insertStmt.run(station.id, station.groupId || station.id, route.companyId, station.name, route.kind, route.id)
        }
      }
    })
  })();
}
