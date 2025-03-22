import { readFileSync, writeFileSync } from 'fs'
import { RailroadsGeoJson } from '@piyoppi/sansaku-pilot/MLITGisTypes/railroad'
import { StationsGeoJson } from '@piyoppi/sansaku-pilot/MLITGisTypes/station'
import { fromMLITGeoJson, toStationGraph } from '@piyoppi/sansaku-pilot/railroad'
import { walk } from '@piyoppi/sansaku-pilot/graph/graphwalk'
import { toDotGraph } from '@piyoppi/sansaku-pilot/graph/toDotGraph'

const railroadsGeoJson = JSON.parse(readFileSync('./geojsons/railroads-all.geojson', 'utf-8').toString()) as RailroadsGeoJson
const stationsGeoJson = JSON.parse(readFileSync('./geojsons/stations-all.geojson', 'utf-8').toString()) as StationsGeoJson

const railroads = fromMLITGeoJson(railroadsGeoJson, stationsGeoJson)
const stationGraph = toStationGraph(railroads)

if (stationGraph?.length > 0) {
  walk(stationGraph[0], async (current, prev, arc) => {
    console.log(prev.name, `(${prev.railroadId})`, '->>', current.name, `(${current.railroadId})`, arc.cost)
  })
}

const dot = toDotGraph(stationGraph)
writeFileSync('./stationGraph.dot', dot)
