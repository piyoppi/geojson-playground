import { readFileSync, writeFileSync } from 'fs';
import { RailroadsGeoJson } from './MLITGisTypes/railroad'
import { StationsGeoJson } from './MLITGisTypes/station'
import { fromMLITGeoJson, toRailRoad } from './railroad.js'
import { walk } from './graph/graphwalk.ts'

const railroadsGeoJson = JSON.parse(readFileSync('./geojsons/railroads.json', 'utf-8').toString()) as RailroadsGeoJson
const stationsGeoJson = JSON.parse(readFileSync('./geojsons/stations.json', 'utf-8').toString()) as StationsGeoJson

const railroadState = fromMLITGeoJson(railroadsGeoJson, stationsGeoJson)

const railroad = toRailRoad(railroadState[0])

const stationGraph = railroad.stationGraph
if (stationGraph) {
  walk(stationGraph, async (current, prev) => {
    console.log(prev.name, '->>', current.name)
  })
}

writeFileSync('./out.json', JSON.stringify(railroad))
