import { line, move, PathDatas, pathDatas } from "./path.js"

export const toPathData = (positions: [number, number][]): PathDatas => pathDatas(positions.length >= 2 ? [move(...positions[0]), ...positions.slice(1).map(p => line(...p))] : [])
