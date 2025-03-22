import { Path } from "../path"
import { line, move, PathDatas, pathDatas } from "./path"

export const toPathData = (positions: Path): PathDatas => pathDatas(positions.length >= 2 ? [move(...positions[0]), ...positions.slice(1).map(p => line(...p))] : [])
