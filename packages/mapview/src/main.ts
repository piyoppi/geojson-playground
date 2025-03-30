import Graph from "graphology"
import Sigma from "sigma"
import railroadsGeoJsonRaw from "./geojsons/railroads-sanyo.json"
import stationsGeoJsonRaw from "./geojsons/stations-sanyo.json"
import { RailroadsGeoJson } from '@piyoppi/sansaku-pilot/MLITGisTypes/railroad'
import { StationsGeoJson } from '@piyoppi/sansaku-pilot/MLITGisTypes/station'
import { fromMLITGeoJson, toStationGraph } from '@piyoppi/sansaku-pilot/railroad'

const railroadsGeoJson = railroadsGeoJsonRaw as RailroadsGeoJson
const stationsGeoJson = stationsGeoJsonRaw as StationsGeoJson

const railroads = fromMLITGeoJson(railroadsGeoJson, stationsGeoJson)
const stationNodes = toStationGraph(railroads)

const graph = new Graph({ multi: true })
stationNodes.forEach(node => {
  graph.addNode(node.id, { label: node.name, size: 1, x: node.platform[0][0], y: node.platform[0][1], color: "blue" })
})

stationNodes.forEach(node => {
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

