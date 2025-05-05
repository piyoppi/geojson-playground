import type { Path } from "../path.js"
import { line, move, pathDatas, type PathDatas } from "./path.js"

export const toPathData = (positions: Path): PathDatas => pathDatas(positions.length >= 2 ? [move(...positions[0]), ...positions.slice(1).map(p => line(...p))] : [])
export const flipAroundCenter = (positions: Path, centerX: number, centerY: number): Path => positions.map(([x, y]) => [2 * centerX - x, 2 * centerY - y])
export const flipHorizontally = (positions: Path, centerX: number): Path => positions.map(([x, y]) => [2 * centerX - x, y])
export const flipVertically = (positions: Path, centerY: number): Path => positions.map(([x, y]) => [x, 2 * centerY - y])
