import Graph from "graphology"
import Sigma from "sigma"
import railroadsGeoJsonAllRaw from "./geojsons/railroads-all.json"
import railroadsGeoJsonExtendsRaw from "./geojsons/railroads-all-extends.json"
import stationsGeoJsonRaw from "./geojsons/stations-all.json"
import busStopsGeoJsonRaw from "./geojsons/bus-stops-s.json"
import busRoutesGeoJsonRaw from "./geojsons/bus-routes-s.json"
import { RailroadsGeoJson } from '@piyoppi/sansaku-pilot/MLITGisTypes/railroad'
import { StationsGeoJson } from '@piyoppi/sansaku-pilot/MLITGisTypes/station'
import { BusStopsGeoJson } from '@piyoppi/sansaku-pilot/MLITGisTypes/busStop'
import { BusRoutesGeoJson } from '@piyoppi/sansaku-pilot/MLITGisTypes/busRoute'
import { fromMLITGeoJson as toRailRoads } from '@piyoppi/sansaku-pilot/railroad'
import { StationNode, toStationGraph } from '@piyoppi/sansaku-pilot/stationGraph'
import { fromMLITGeoJson as toBusStops } from '@piyoppi/sansaku-pilot/busstop'
import { fromMLITGeoJson as toBusRoutes } from '@piyoppi/sansaku-pilot/busroute'
import { BusStopNode, toBusStopGraph } from '@piyoppi/sansaku-pilot/busStopGraph'

const loadStations = () => {
  const railroadsGeoJson = {
    ...railroadsGeoJsonAllRaw,
    features: [...railroadsGeoJsonAllRaw.features, ...railroadsGeoJsonExtendsRaw.features],
  } as RailroadsGeoJson
  const stationsGeoJson = stationsGeoJsonRaw as StationsGeoJson

  const railroads = toRailRoads(railroadsGeoJson, stationsGeoJson)
  const stationNodes = toStationGraph(railroads)

  return stationNodes
}

const loadBusStops = () => {
  const busStopsGeoJson = busStopsGeoJsonRaw as BusStopsGeoJson
  const busRoutesGeoJson = busRoutesGeoJsonRaw as BusRoutesGeoJson

  const busStops = toBusStops(busStopsGeoJson)
  const busRoutes = toBusRoutes(busRoutesGeoJson)

  const busNodes = toBusStopGraph(busRoutes, busStops)

  return busNodes
}

const displayGraph = (stationNodes: StationNode[], busNodes: BusStopNode[]) => {
  const graph = new Graph({ multi: true })

  stationNodes.forEach(node => {
    graph.addNode(node.id, { label: node.name, size: 0.7, x: node.platform[0][0], y: node.platform[0][1], color: "blue" })
  })

  busNodes.forEach(node => {
    graph.addNode(node.id, { label: node.name, size: 0.7, x: node.position[0], y: node.position[1], color: "yellow" })
  });

  [...stationNodes, ...busNodes].forEach(node => {
    node.arcs.forEach(arc => {
      const aNode = arc.a.deref()
      const bNode = arc.b.deref()

      if (!aNode || !bNode) return

      graph.addEdge(aNode.id, bNode.id, { color: "black" })
    })
  })

  window.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("app")

    if (container) {
      new Sigma(graph, container)
    }
  })
}

//displayGraph(loadStations(), [])
displayGraph([], loadBusStops())
