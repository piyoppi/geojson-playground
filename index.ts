import { readFileSync, writeFileSync } from 'fs';
import { addPadding, getBoundaryViewBox, svg } from './svg/svg.js'
import { path, strokeWidth } from './svg/path.js'
import { tagToString } from './element.js'
import { rgb } from './color.js'
import { toPathData } from './pathutils.js'
import { px } from './svg/size.js'
import { RailroadsGeoJson } from './MLITGisTypes/railroad'
import { StationsGeoJson } from './MLITGisTypes/station'
import { toPathchain } from './pathchain.js'
import { walk } from './walk.js'
import { randomRgb } from './colorutils.js'

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
paths.push(path({d: toPathData(end.lines), fill: 'transparent', stroke: rgb(255, 0, 0), strokeWidth: strokeWidth(px(0.0001))}))
let next = end.from()

walk(next, (p) => paths.push(path({d: toPathData(p.path), fill: 'transparent', stroke: randomRgb(), strokeWidth: strokeWidth(px(0.0001))})))

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
