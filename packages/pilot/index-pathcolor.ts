import { readFileSync, writeFileSync } from "fs"
import { RailroadsGeoJson } from "./MLITGisTypes/railroad"
import { StationsGeoJson } from "./MLITGisTypes/station"
import { ends, buildPathchain } from "./pathchain"
import { path } from "./svg/path"
import { toPathData } from "./svg/pathutils"
import { rgb } from "./svg/color"
import { strokeWidth } from "./svg/presentationalAttributes"
import { px } from "./svg/size"
import { addPadding, getBoundaryViewBox, svg } from "./svg/svg"
import { tagToString } from "./svg/element"
import { pathChainWalk } from "./walk"
import { randomRgb } from "./svg/colorutils"

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

const results = await Promise.all(trainLines.map(l => buildPathchain(l.railroads.map(r => r.geometry.coordinates))))

const paths = []
const end = ends(results[0][0])[0]
paths.push(path({d: toPathData(end.path), fill: 'transparent', stroke: rgb(255, 0, 0), strokeWidth: strokeWidth(px(0.0005))}))
let next = end.from()

pathChainWalk(next, current => {
  paths.push(path({d: toPathData(current.pathChain.path), fill: 'transparent', stroke: randomRgb(), strokeWidth: strokeWidth(px(0.0005))}))
  return Promise.resolve()
})

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
