import { readFileSync } from 'node:fs'
import { TrafficGraphFile } from '@piyoppi/sansaku-pilot/traffic/graph/trafficGraphFile'
import { buildDefaultTrafficGraphFromFile } from '@piyoppi/sansaku-pilot/traffic/graph/combined'
import { DatabaseSync } from 'node:sqlite'

export const execute = async (
  inputGraphFilename: string,
  outFilename: string,
) => {
  const railroadJson = JSON.parse(readFileSync(inputGraphFilename, "utf-8")) as TrafficGraphFile
  const buildTrafficGraphFromFile = buildDefaultTrafficGraphFromFile()

  const { railroads } = buildTrafficGraphFromFile(railroadJson)

  const database = new DatabaseSync(outFilename)

  database.exec(`
    CREATE TABLE IF NOT EXISTS stations (
      id TEXT PRIMARY KEY,
      name TEXT,
      route_name TEXT
    )
  `)
  
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_stations_name ON stations (name)
  `)

  // Insert stations data
  const insertStmt = database.prepare('INSERT OR REPLACE INTO stations (id, name, route_name) VALUES (?, ?, ?)')
  
  try {
    database.exec('BEGIN TRANSACTION')
    
    for (const railroad of railroads) {
      const routeName = railroad.name
      
      for (const station of railroad.stations) {
        insertStmt.run(station.id, station.name, routeName)
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
