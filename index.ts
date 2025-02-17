import { readFileSync, writeFileSync } from 'fs';
import { addPadding, getBoundaryViewBox, svg } from './svg.js'
import { path, strokeWidth } from './path.js'
import { tagToString } from './element.js';
import { rgb } from './color.js';
import { toPathData } from './pathutils.js';
import { px } from './size.js';
import { RailroadsGeoJson } from './railload.js';
import { StationsGeoJson } from './station.js';
import { toPathchain } from './pathchain.js';

const railroadsGeoJson = JSON.parse(readFileSync('./geojsons/railroads.json', 'utf-8').toString()) as RailroadsGeoJson;
const stationsGeoJson = JSON.parse(readFileSync('./geojsons/stations.json', 'utf-8').toString()) as StationsGeoJson;

const railroads = Object.groupBy(railroadsGeoJson.features, (f) => f.properties.N02_003)
const stations = Object.groupBy(stationsGeoJson.features, (f) => f.properties.N02_003)

const lineNames = new Set([...Object.keys(railroads), ...Object.keys(stations)])
const trainLines = Array.from(lineNames).map(lineName => ({
  lineName,
  railroads: railroads[lineName] || [],
  stations:  stations[lineName] || []
}))


const results = trainLines.map(l => toPathchain(l.railroads.map(r => r.geometry.coordinates)))

const actualPaths = railroadsGeoJson.features.map(f => 
  path({d: toPathData(f.geometry.coordinates), stroke: rgb(0, 255, 0), strokeWidth: strokeWidth(px(0.001))})
)

const paths = [...actualPaths]
console.log("ends: ", results[0].ends().map(v => v.positions))
const end = results[0].ends()[0]
paths.push(path({d: toPathData(end.positions), stroke: rgb(255, 0, 0), strokeWidth: strokeWidth(px(0.001))}))
let next = end.from()

for(let i=0; i<1000; i++) {
  const visits = next()
  if (visits.length === 0) break
  console.log("visits: ", visits.length)
  const res  = visits[0]()
  const rail = res.path
  
  console.log(rail.positions)
  paths.push(path({d: toPathData(rail.positions), stroke: rgb(255, 0, 0), strokeWidth: strokeWidth(px(0.005))}))

  next = res.next
}

const svgTag = svg(
  {
    viewBox: addPadding(getBoundaryViewBox(paths.map(p => p.points()).flat()), 0, 0),
    width: px(1500),
    height: px(1500)
  },
  paths
)

writeFileSync('./out.json', JSON.stringify(results))
writeFileSync('./out.svg', tagToString(svgTag))

