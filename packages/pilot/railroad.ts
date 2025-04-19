import { type Position2D } from "./geometry.js"
import type { RailroadsGeoJson } from "./MLITGisTypes/railroad.js"
import type { StationsGeoJson } from './MLITGisTypes/station.js'
import type { Path } from "./path.js"

export type Railroad = {
  id: string,
  name: string,
  company: string,
  rails: Path[]
  stations: Station[]
}

export type Station = {
  id: string,
  name: string,
  railroadId: string,
  groupId: string,
  platform: [Position2D, Position2D],
}

export const fromMLITGeoJson = (railroadsGeoJson: RailroadsGeoJson, stationsGeoJson: StationsGeoJson): Railroad[] => {
  const railroadsFeature = Map.groupBy(railroadsGeoJson.features, (f) => `${f.properties.N02_003}-${f.properties.N02_004}`)
  const stationsFeature = Map.groupBy(stationsGeoJson.features, (f) => `${f.properties.N02_003}-${f.properties.N02_004}`)

  return Array.from(railroadsFeature.keys()).flatMap(id => {
    const railroad = railroadsFeature.get(id) || []
    if (railroad.length === 0) return []

    const stations =  stationsFeature.get(id) || []
    const lineName = railroad[0].properties.N02_003
    const company = railroad[0].properties.N02_004

    return [{
      id: id,
      name: lineName,
      company,
      rails: railroad.map(r => r.geometry.coordinates),
      stations: stations.map(s =>
        ({
          name: s.properties.N02_005,
          id: s.properties.N02_005c,
          railroadId: id,
          groupId: s.properties.N02_005g,
          platform: [s.geometry.coordinates[0], s.geometry.coordinates[1]],
        })
      )
    }]
  })
}
