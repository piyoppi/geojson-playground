import Graph from "graphology"
import Sigma from "sigma"
import railroadsGeoJsonAllRaw from "./geojsons/railroads-all.json"
import railroadsGeoJsonExtendsRaw from "./geojsons/railroads-all-extends.json"
import stationsGeoJsonRaw from "./geojsons/stations-all.json"
import busStopsGeoJsonRaw from "./geojsons/bus-stops-s-mini.json"
import busRoutesGeoJsonRaw from "./geojsons/bus-routes-s-mini.json"
import { RailroadsGeoJson } from '@piyoppi/sansaku-pilot/MLITGisTypes/railroad'
import { StationsGeoJson } from '@piyoppi/sansaku-pilot/MLITGisTypes/station'
import { BusStopsGeoJson } from '@piyoppi/sansaku-pilot/MLITGisTypes/busStop'
import { BusRoutesGeoJson } from '@piyoppi/sansaku-pilot/MLITGisTypes/busRoute'
import { fromMLITGeoJson as toRailRoads } from '@piyoppi/sansaku-pilot/railroad'
import { StationNode, toStationGraph } from '@piyoppi/sansaku-pilot/stationGraph'
import { fromMLITGeoJson as toBusStops } from '@piyoppi/sansaku-pilot/busstop'
import { fromMLITGeoJson as toBusRoutes } from '@piyoppi/sansaku-pilot/busroute'
import { BusStopNode, toBusStopGraph } from '@piyoppi/sansaku-pilot/busStopGraph'
import { tagToString } from "@piyoppi/sansaku-pilot/svg/element"
import { circle } from "@piyoppi/sansaku-pilot/svg/circle"
import { path } from "@piyoppi/sansaku-pilot/svg/path"
import { toPathData } from "@piyoppi/sansaku-pilot/svg/pathutils"
import { rgb } from "@piyoppi/sansaku-pilot/svg/color"
import { strokeWidth } from "@piyoppi/sansaku-pilot/svg/presentationalAttributes"
import { px } from "@piyoppi/sansaku-pilot/svg/size"
import { addPadding, getBoundaryViewBox } from "@piyoppi/sansaku-pilot/svg/svg"

const loadStations = async () => {
  const railroadsGeoJson = {
    ...railroadsGeoJsonAllRaw,
    features: [...railroadsGeoJsonAllRaw.features, ...railroadsGeoJsonExtendsRaw.features],
  } as RailroadsGeoJson
  const stationsGeoJson = stationsGeoJsonRaw as StationsGeoJson

  const railroads = toRailRoads(railroadsGeoJson, stationsGeoJson)
  const stationNodes = await toStationGraph(railroads)

  return stationNodes
}

const loadBusStops = async () => {
  const busStopsGeoJson = busStopsGeoJsonRaw as BusStopsGeoJson
  const busRoutesGeoJson = busRoutesGeoJsonRaw as BusRoutesGeoJson

  const busStops = toBusStops(busStopsGeoJson)
  const busRoutes = toBusRoutes(busRoutesGeoJson)

  const viewBox = addPadding(getBoundaryViewBox(busRoutes.map(b => b.routes).flat().flat()), 0.001, 0.001).join(" ")
  const svg = document.getElementById("debugsvg") as SVGElement | null
  if (!svg) return []
  svg.setAttribute("viewBox", viewBox)
  svg.setAttribute("width", "100%")
  svg.setAttribute("height", "100%")

  const busNodes = await toBusStopGraph(
    busRoutes,
    busStops,
    {
      async currentPathchainChanged(pathchain) {
        svg.innerHTML += tagToString(
          path({d: toPathData(pathchain.path), fill: 'transparent', stroke: rgb(255, 0, 0), strokeWidth: strokeWidth(px(0.000005))})
        )
        await new Promise(resolve => setTimeout(resolve, 500))
      },
      async nodeCreated(busStop) {
        svg.innerHTML += tagToString(
          circle({cx: px(busStop.position[0]), cy: px(busStop.position[1]), r: px(0.00003), fill: 'blue', stroke: rgb(0, 0, 255), strokeWidth: strokeWidth(px(0.000002))})
        )
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  )

  return busNodes
}

const displayGraph = (stationNodes: StationNode[], busNodes: BusStopNode[]) => {
  const graph = new Graph({ multi: true })

  stationNodes.forEach(node => {
    graph.addNode(node.id, { label: node.name, size: 0.5, x: node.platform[0][0], y: node.platform[0][1], color: "blue" })
  })

  busNodes.forEach(node => {
    graph.addNode(node.id, { label: node.name, size: 7, x: node.position[0], y: node.position[1], color: "green" })
  });

  [...stationNodes, ...busNodes].forEach(node => {
    node.arcs.forEach(arc => {
      const aNode = arc.a.deref()
      const bNode = arc.b.deref()

      if (!aNode || !bNode) return

      graph.addEdge(aNode.id, bNode.id, { color: "black" })
    })
  })

  const container = document.getElementById("app")

  if (container) {
    new Sigma(graph, container)
  }
}


window.addEventListener("DOMContentLoaded", async () => {
  //displayGraph(await loadStations(), [])
  displayGraph([], await loadBusStops())
})
