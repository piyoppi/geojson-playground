import { readFileSync } from 'fs';
import { RailroadsGeoJson } from './MLITGisTypes/railroad'
import { StationsGeoJson } from './MLITGisTypes/station'
import { fromMLITGeoJson, toStationGraph } from './railroad.js'
import { walk } from './graph/graphwalk.ts'

const railroadsGeoJson = JSON.parse(readFileSync('./geojsons/railroads.json', 'utf-8').toString()) as RailroadsGeoJson
const stationsGeoJson = JSON.parse(readFileSync('./geojsons/stations.json', 'utf-8').toString()) as StationsGeoJson

const railroads = fromMLITGeoJson(railroadsGeoJson, stationsGeoJson)
const stationGraph = toStationGraph(railroads)

if (stationGraph) {
  walk(stationGraph, async (current, prev, arc) => {
    console.log(prev.name, `(${prev.railroadId})`, '->>', current.name, `(${current.railroadId})`, arc.cost)
  })
}
