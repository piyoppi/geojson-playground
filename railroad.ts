import { center, Position2D } from "./geometry"
import { RailroadsGeoJson } from "./MLITGisTypes/railroad"
import { StationsGeoJson } from './MLITGisTypes/station'
import { toPathchain } from './pathchain'

export type RailroadState = {
  name: string,
  company: string,
  paths: Position2D[][]
  stations: Map<string, Station>
}

export type Station = {
  name: string,
  position: [Position2D, Position2D]
}

export type StationChainResult = {
  station: Station,
  distance: number
}

export type GetNeighboringStations = () => StationChainResult[]

export type StationChain = {
  station: Station,
  next: GetNeighboringStations,
  prev: GetNeighboringStations
}

export const toRailRoad = (railroadState: RailroadState) => {
  const pathchain = toPathchain(railroadState.paths)

  return {
    visit: (stationName: string) => {
      const station = railroadState.stations.get(stationName)
      if (!station) return null

      const point = center(station.position)
    }
  }
}

export const fromMLITGeoJson = (railroadsGeoJson: RailroadsGeoJson, stationsGeoJson: StationsGeoJson): RailroadState[] => {
  const railroadsFeature = Object.groupBy(railroadsGeoJson.features, (f) => f.properties.N02_003)
  const stationsFeature = Object.groupBy(stationsGeoJson.features, (f) => f.properties.N02_003)
  const lineNames = new Set([...Object.keys(railroadsFeature), ...Object.keys(stationsFeature)])

  return Array.from(lineNames).map(lineName => {
    const railroad = railroadsFeature[lineName] || []
    const stations =  stationsFeature[lineName] || []

    return {
      name: lineName,
      company: railroad[0].properties.N02_004,
      paths: railroad.map(r => r.geometry.coordinates),
      stations: new Map(stations.map(s => [
        s.properties.N02_005,
        {
          name: s.properties.N02_005,
          position: [s.geometry.coordinates[0], s.geometry.coordinates[1]]
        }
      ]))
    }
  })
}
