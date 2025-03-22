import { readFileSync, writeFileSync } from "fs"
import { RailroadsGeoJson } from "@piyoppi/sansaku-pilot/MLITGisTypes/railroad"
import { StationsGeoJson } from "@piyoppi/sansaku-pilot/MLITGisTypes/station"
import { toPathchain } from "@piyoppi/sansaku-pilot/pathchain"
import { path } from "@piyoppi/sansaku-pilot/svg/path"
import { toPathData } from "@piyoppi/sansaku-pilot/svg/pathutils"
import { rgb } from "@piyoppi/sansaku-pilot/svg/color"
import { strokeWidth } from "@piyoppi/sansaku-pilot/svg/presentationalAttributes"
import { px } from "@piyoppi/sansaku-pilot/svg/size"
import { addPadding, getBoundaryViewBox, svg } from "@piyoppi/sansaku-pilot/svg/svg"
import { tagToString } from "@piyoppi/sansaku-pilot/svg/element"
import { pathChainWalk } from "@piyoppi/sansaku-pilot/walk"
import { randomRgb } from "@piyoppi/sansaku-pilot/svg/colorutils"

const railroadsGeoJson = JSON.parse(readFileSync('./geojsons/railroads.json', 'utf-8').toString()) as RailroadsGeoJson
const stationsGeoJson = JSON.parse(readFileSync('./geojsons/stations.json', 'utf-8').toString()) as StationsGeoJson

const railroads = Object.groupBy(railroadsGeoJson.features, (f) => f.properties.N02_003)
const stations = Object.groupBy(stationsGeoJson.features, (f) => f.properties.N02_003)

const lineNames = new Set([...Object.keys(railroads), ...Object.keys(stations)])
const trainLines = Array.from(lineNames).map(lineName => ({
  lineName,
  railroads: railroads[lineName] || [],
  stations:  stations[lineName] || []
}))

const results = trainLines.map(l => toPathchain(l.railroads.map(r => r.geometry.coordinates)))

const paths = []
const end = results[0].ends()[0]
paths.push(path({d: toPathData(end.path), fill: 'transparent', stroke: rgb(255, 0, 0), strokeWidth: strokeWidth(px(0.0005))}))
let next = end.from()

pathChainWalk(next, (p) => paths.push(path({d: toPathData(p.path), fill: 'transparent', stroke: randomRgb(), strokeWidth: strokeWidth(px(0.0005))})))

const svgTag = svg(
  {
    viewBox: addPadding(getBoundaryViewBox(paths.map(p => p.points()).flat()), 0, 0),
    width: px(15000),
    height: px(10000)
  },
  paths
)

writeFileSync('./out.json', JSON.stringify(results))
writeFileSync('./out.svg', tagToString(svgTag))
