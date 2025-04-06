import Graph from "graphology"
import Sigma from "sigma"
import railroadsGeoJsonAllRaw from "./geojsons/railroads-all.json"
import railroadsGeoJsonExtendsRaw from "./geojsons/railroads-all-extends.json"
import stationsGeoJsonRaw from "./geojsons/stations-all.json"
import busStopsGeoJsonRaw from "./geojsons/bus-stops-s-mid-ta43.json"
import busRoutesGeoJsonRaw from "./geojsons/bus-routes-s-mid-ta43.json"
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
import { toPathData, flipVertically } from "@piyoppi/sansaku-pilot/svg/pathutils"
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

  const viewBox = addPadding(getBoundaryViewBox(busRoutes.map(b => b.routes).flat().flat()), 0.001, 0.001)
  const center = [viewBox[0] + viewBox[2] / 2, viewBox[1] + viewBox[3] / 2]
  const svg = document.getElementById("debugsvg") as SVGElement | null
  if (!svg) return []
  svg.setAttribute("viewBox", viewBox.join(' '))
  svg.setAttribute("width", "100%")
  svg.setAttribute("height", "100%")

  const busNodes = await toBusStopGraph(
    busRoutes,
    busStops,
    {
      async currentPathchainChanged(pathchain) {
        svg.innerHTML += tagToString(
          path({d: toPathData(flipVertically(pathchain.path, center[1])), fill: 'transparent', stroke: rgb(255, 0, 0), strokeWidth: strokeWidth(px(0.0003))})
        )
        await new Promise(resolve => setTimeout(resolve, 200))
      },
      async nodeCreated(busStop) {
        const flipped = flipVertically([busStop.position], center[1])[0]
        svg.innerHTML += tagToString(
          circle({cx: px(flipped[0]), cy: px(flipped[1]), r: px(0.00035), fill: 'blue', stroke: rgb(0, 0, 255), strokeWidth: strokeWidth(px(0.000002))})
        )
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
  )

  return Array.from(busNodes.values()).flat()
}

const displayGraph = (stationNodes: StationNode[], busNodes: BusStopNode[]) => {
  const graph = new Graph({ multi: true })

  console.log(stationNodes)

  stationNodes.forEach(node => {
    graph.addNode(node.id, { label: node.name, size: 0.55, x: node.platform[0][0], y: node.platform[0][1], color: "blue" })
  })

  busNodes.forEach(node => {
    graph.addNode(node.id, { label: node.name, size: 3, x: node.position[0], y: node.position[1], color: "green" })
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


window.addEventListener("DOMContentLoaded", () => {
  loadStations().then(stations => displayGraph(stations, []))
  //loadBusStops().then(b => displayGraph([], b))
})
