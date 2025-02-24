import { center, Position2D } from "./geometry"
import { fromPathChain } from "./graph"
import { RailroadsGeoJson } from "./MLITGisTypes/railroad"
import { StationsGeoJson } from './MLITGisTypes/station'
import { Path } from "./path"
import { toPathchain } from './pathchain'

export type RailroadState = {
  name: string,
  company: string,
  paths: Path[]
  stations: Station[]
}

export type Station = {
  name: string,
  platform: [Position2D, Position2D]
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
  const stationGraph = fromPathChain(
    railroadState.stations.map(s => ({...s, position: center(s.platform)})),
    (station, _point) => ({...station})
  )(pathchain.ends()[0])

  return {
    stationGraph
    //visit: (stationName: string) => {
    //  const station = railroadState.stations.get(stationName)
    //  if (!station) return null

    //  const point = center(station.position)
    //  
    //}
  }
}

export const fromMLITGeoJson = (railroadsGeoJson: RailroadsGeoJson, stationsGeoJson: StationsGeoJson): RailroadState[] => {
  const railroadsFeature = Object.groupBy(railroadsGeoJson.features, (f) => f.properties.N02_003)
  const stationsFeature = Object.groupBy(stationsGeoJson.features, (f) => f.properties.N02_003)
  const lineNames = new Set([...Object.keys(railroadsFeature), ...Object.keys(stationsFeature)])

  return Array.from(lineNames).flatMap(lineName => {
    const railroad = railroadsFeature[lineName] || []
    const stations =  stationsFeature[lineName] || []

    if (railroad.length === 0) return []

    return [{
      name: lineName,
      company: railroad[0].properties.N02_004,
      paths: railroad.map(r => r.geometry.coordinates),
      stations: stations.map(s => 
        ({
          name: s.properties.N02_005,
          platform: [s.geometry.coordinates[0], s.geometry.coordinates[1]]
        })
      )
    }]
  })
}
