import { center, type Position2D } from "./geometry.ts"
import { fromPathChain } from "./graph/fromPathChain.ts"
import { arcExists, generateArc, type GraphNode } from "./graph/graph.ts"
import type { RailroadsGeoJson } from "./MLITGisTypes/railroad.ts"
import type { StationsGeoJson } from './MLITGisTypes/station.ts'
import type { Path } from "./path.ts"
import { toPathchain } from './pathchain.ts'

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

export type StationNode = Station & GraphNode

export const toStationGraph = (railroads: Railroad[]): StationNode | null => {
  const stationNodes = railroads.flatMap(railroad => {
    const pathchain = toPathchain(railroad.rails)
    return fromPathChain(
      railroad.stations.map(s => ({...s, position: center(s.platform)})),
      (station, _point) => ({...station})
    )(pathchain.ends()[0])
  })

  const nodesByGroup = Map.groupBy(stationNodes, n => n.groupId)

  stationNodes.map(node => {
    const groupedNode = nodesByGroup.get(node.groupId)
    if (!groupedNode) return

    groupedNode.forEach(current => {
      if (node !== current && arcExists(node, current) && node.railroadId !== current.railroadId) {
        const arc = generateArc(node, current, 0)
        node.arcs.push(arc)
      }
    })
  })

  return stationNodes[0]
}

export const fromMLITGeoJson = (railroadsGeoJson: RailroadsGeoJson, stationsGeoJson: StationsGeoJson): Railroad[] => {
  const railroadsFeature = Object.groupBy(railroadsGeoJson.features, (f) => f.properties.N02_003)
  const stationsFeature = Object.groupBy(stationsGeoJson.features, (f) => f.properties.N02_003)
  const lineNames = new Set([...Object.keys(railroadsFeature), ...Object.keys(stationsFeature)])

  return Array.from(lineNames).flatMap(lineName => {
    const railroad = railroadsFeature[lineName] || []
    const stations =  stationsFeature[lineName] || []

    if (railroad.length === 0) return []

    return [{
      id: lineName,
      name: lineName,
      company: railroad[0].properties.N02_004,
      rails: railroad.map(r => r.geometry.coordinates),
      stations: stations.map(s => 
        ({
          name: s.properties.N02_005,
          id: s.properties.N02_005c,
          railroadId: lineName,
          groupId: s.properties.N02_005g,
          platform: [s.geometry.coordinates[0], s.geometry.coordinates[1]],
        })
      )
    }]
  })
}
