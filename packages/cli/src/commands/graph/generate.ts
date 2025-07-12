import { writeFileSync } from 'node:fs'
import { toTrafficGraphFile } from '@piyoppi/sansaku-pilot/traffic/trafficGraphFile.js'
import { buildDefaultStationGrpahGenerator, buildDefaultBusStopGraphGenerator } from '@piyoppi/sansaku-pilot/main.js'
import { readFileSync } from 'node:fs'
import { fromMLITGeoJson as toBusStops } from '@piyoppi/sansaku-pilot/geojson/MLITGisTypes/busRoute.js'
import { fromMLITGeoJson as toRailRoads } from '@piyoppi/sansaku-pilot/geojson/MLITGisTypes/railroad.js'
import type { RailroadsGeoJson } from '@piyoppi/sansaku-pilot/geojson/MLITGisTypes/railroad.js'
import { mergeGraphNodes } from '@piyoppi/sansaku-pilot/traffic/graph/merge.js'
import { filterBusStopNodes, filterJunctionNodes, filterStationNodes } from '@piyoppi/sansaku-pilot/traffic/graph/trafficGraph.js'

type Option = {
  overrideRailroadInputFilename?: string
  companyIds?: string[]
}

export const execute = async (
  outputFileName: string,
  inputRailroadFilename?: string,
  inputStationFilename?: string,
  inputBusStopFilename?: string,
  option?: Option
) => {
  const { stationNodes, railroads, railroadCompanies } = inputRailroadFilename && inputStationFilename ?
    await loadStationGraph(inputRailroadFilename, inputStationFilename, option?.overrideRailroadInputFilename, option?.companyIds) :
    { stationNodes: [], railroads: [], railroadCompanies: [] }

  console.log('stationNodeJunction', filterJunctionNodes(stationNodes).length)

  const { busNodes, busCompanies, busRoutes } = inputBusStopFilename ?
    await loadBusStopGraph(inputBusStopFilename, option?.companyIds) :
    { busNodes: [], busCompanies: [], busRoutes: [] }

  const railroadStationById = new Map(railroads.flatMap(r => r.route.stations.map(s => [s.id, s])))
  const busStopById = new Map(busRoutes.flatMap(r => r.stations.map(s => [s.id, s])))

  mergeGraphNodes(
    filterStationNodes(stationNodes),
    filterBusStopNodes(busNodes),
    id => railroadStationById.get(id),
    id => busStopById.get(id)
  )

  const output = JSON.stringify(
    await toTrafficGraphFile(
      [...stationNodes, ...busNodes],
      [...railroadCompanies, ...busCompanies],
      railroads.map(r => r.route),
      busRoutes
    )
  )

  writeFileSync(outputFileName, output, "utf-8")
}

export const loadStationGraph = async (
  inputRailroadFilename: string,
  inputStationFilename: string,
  overrideRailroadInputFilename?: string,
  companyIds?: string[]
) => {
  const buildStationGraph = buildDefaultStationGrpahGenerator()

  const railroadGeoJson = JSON.parse(readFileSync(inputRailroadFilename, "utf-8"))
  const stationsGeoJson = JSON.parse(readFileSync(inputStationFilename, "utf-8"))
  const overrideInput = overrideRailroadInputFilename ?
    JSON.parse(readFileSync(overrideRailroadInputFilename, "utf-8")) :
    {}

  const railroadsGeoJson = {
    ...railroadGeoJson,
    features: [...railroadGeoJson.features, ...overrideInput.features ?? []],
  } as RailroadsGeoJson

  const [railroadCompanies, railroads] = await toRailRoads(railroadsGeoJson, stationsGeoJson)

  const filteredRailroadCompanies = companyIds ?
    railroadCompanies.filter(company => companyIds.includes(company.id)) :
    railroadCompanies

  const filteredRailroads = companyIds ?
    railroads.filter(railroad => companyIds.includes(railroad.route.companyId)) :
    railroads

  const stationNodes = await buildStationGraph(filteredRailroads)

  return {
    stationNodes,
    railroads: filteredRailroads,
    railroadCompanies: filteredRailroadCompanies
  }
}

export const loadBusStopGraph = async (inputBusStopFilename: string, companyIds?: string[]) => {
  const buildBusStopGraph = buildDefaultBusStopGraphGenerator()

  const inputBusStopJson = JSON.parse(readFileSync(inputBusStopFilename, "utf-8"))
  const [busCompanies, busRoutes] = await toBusStops(inputBusStopJson)

  const filteredBusCompanies = companyIds ?
    busCompanies.filter(company => companyIds.includes(company.id)) :
    busCompanies

  const filteredBusRoutes = companyIds ?
    busRoutes.filter(route => companyIds.includes(route.companyId)) :
    busRoutes

  const busNodes = (await buildBusStopGraph(filteredBusRoutes)).values().toArray().flat()

  return {
    busNodes,
    busCompanies: filteredBusCompanies,
    busRoutes: filteredBusRoutes
  }
}
