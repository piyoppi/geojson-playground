import { readFileSync, writeFileSync } from 'fs';
import { RailroadsGeoJson } from './MLITGisTypes/railroad'
import { StationsGeoJson } from './MLITGisTypes/station'
import { fromMLITGeoJson, toStationGraph } from './railroad.js'
import { walk } from './graph/graphwalk.ts'
import { toDotGraph } from './graph/toDotGraph';

const railroadsGeoJson = JSON.parse(readFileSync('./geojsons/railroads.json', 'utf-8').toString()) as RailroadsGeoJson
const stationsGeoJson = JSON.parse(readFileSync('./geojsons/stations.json', 'utf-8').toString()) as StationsGeoJson

const railroads = fromMLITGeoJson(railroadsGeoJson, stationsGeoJson)
const stationGraph = toStationGraph(railroads)

if (stationGraph?.length > 0) {
  walk(stationGraph[0], async (current, prev, arc) => {
    console.log(prev.name, `(${prev.railroadId})`, '->>', current.name, `(${current.railroadId})`, arc.cost)
  })
}

const dot = toDotGraph(stationGraph)
writeFileSync('./stationGraph.dot', dot)
