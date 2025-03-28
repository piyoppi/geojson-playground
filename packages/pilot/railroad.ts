import { center, type Position2D } from "./geometry"
import { fromPathChain } from "./graph/fromPathChain"
import { arcExists, connect, generateArc, mergeNodes, removeNode, type GraphNode } from "./graph/graph"
import type { RailroadsGeoJson } from "./MLITGisTypes/railroad"
import type { StationsGeoJson } from './MLITGisTypes/station'
import type { Path } from "./path"
import { ends, buildPathchain } from './pathchain'

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

export const toStationGraph = (railroads: Railroad[]): StationNode[] => {
  const stationNodes = railroads.flatMap(railroad => {
    const pathchainGroups = buildPathchain(railroad.rails)

    return pathchainGroups.flatMap((pathchains) => {
      const end = ends(pathchains)[0]

      return fromPathChain(
        railroad.stations.map(s => ({...s, position: center(s.platform)})),
        station => ({...station})
      )(pathchains, end.from())
    })
  })

  const duplicatedNodes = new Set()
  
  Map.groupBy(stationNodes, n => n.id).values().forEach(nodes => {
    if (nodes.length > 1) {
      const mergedNode = mergeNodes(...nodes)
      stationNodes.push(mergedNode)
      nodes.forEach(node => {
        removeNode(node)
        duplicatedNodes.add(node)
      })
    }
  })
  
  const filteredStationNodes = stationNodes.filter(node => !duplicatedNodes.has(node))

  const nodesByGroup = Map.groupBy(filteredStationNodes, n => n.groupId)
  filteredStationNodes.forEach(node => {
    nodesByGroup.get(node.groupId)?.forEach(current => {
      if (node !== current && !arcExists(node, current) && node.railroadId !== current.railroadId) {
        const arc = generateArc(node, current, 0)
        connect(node, current, arc)
      }
    })
  })

  return filteredStationNodes
}

export const fromMLITGeoJson = (railroadsGeoJson: RailroadsGeoJson, stationsGeoJson: StationsGeoJson): Railroad[] => {
  const railroadsFeature = Map.groupBy(railroadsGeoJson.features, (f) => `${f.properties.N02_003}-${f.properties.N02_004}`)
  const stationsFeature = Map.groupBy(stationsGeoJson.features, (f) => `${f.properties.N02_003}-${f.properties.N02_004}`)

  return Array.from(railroadsFeature.keys()).flatMap(key => {
    const railroad = railroadsFeature.get(key) || []
    if (railroad.length === 0) return []

    const stations =  stationsFeature.get(key) || []
    const lineName = railroad[0].properties.N02_003
    const company = railroad[0].properties.N02_004

    return [{
      id: key,
      name: lineName,
      company,
      rails: railroad.map(r => r.geometry.coordinates),
      stations: stations.map(s =>
        ({
          name: s.properties.N02_005,
          id: s.properties.N02_005c,
          railroadId: key,
          groupId: s.properties.N02_005g,
          platform: [s.geometry.coordinates[0], s.geometry.coordinates[1]],
        })
      )
    }]
  })
}
