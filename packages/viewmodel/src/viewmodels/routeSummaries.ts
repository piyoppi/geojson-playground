import { Route, Station } from '@piyoppi/sansaku-pilot/traffic/transportation'
import type { DatabaseHandler } from '../database.js'

export type RouteSummary = {
  id: string,
  name: string,
}

type RouteSummaryRecord = {
  id: string,
  name: string,
}

export const createTable = (database: DatabaseHandler, routes: Route<Station>[]) => {
  database.exec(`
    CREATE TABLE IF NOT EXISTS routes (
      id TEXT PRIMARY KEY,
      name TEXT
    )
  `)

  const insertStmt = database.prepare('INSERT OR REPLACE INTO routes (id, name) VALUES (?, ?)')

  try {
    database.exec('BEGIN TRANSACTION')

    for (const railroad of routes) {
      const routeName = railroad.name

      insertStmt.run(railroad.id, routeName)
    }

    database.exec('COMMIT')
  } catch (error) {
    database.exec('ROLLBACK')
    throw error
  }
}

export const findRouteSummariesFromId = (database: DatabaseHandler, ids: string[]): RouteSummary[] => {
  const query = `
    SELECT id, name 
    FROM routes 
    WHERE id in (${ids.map(_ => '?').join(',')})
  `

  const stmt = database.prepare(query)
  const records = stmt.all(...ids) as RouteSummaryRecord[]

  return records.map(record => ({
    id: record.id,
    name: record.name,
  }))
}
