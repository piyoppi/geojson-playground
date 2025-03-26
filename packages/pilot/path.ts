import { type Position2D, innerProduction, subtract, length } from "./geometry"

export type Path = Position2D[]

export type PointInPath = {
  path: WeakRef<Path>
  startIndex: number,
  distance: () => number
}

export const pointInPath = (pos: Readonly<Position2D>, path: Path): PointInPath | null => {
  const [index, distance] = path.slice(1).reduce((current, end, i) => {
    if (current[0] > 0) return current

    const start = path[i]

    const p1 = subtract(pos, start)
    const lp1 = length(p1)
    const a = subtract(end, start)
    const angle1 = innerProduction(a, p1) / (length(a) * lp1)

    const p2 = subtract(pos, end)
    const lp2 = length(p2)
    const b = subtract(start, end)
    const angle2 = innerProduction(b, p2) / (length(b) * lp2)

    // Check direction
    if (angle1 < 0 || angle2 < 0) return current

    if (Math.max(angle1, angle2) < 0.999) return current

    return [i, lp1]
  }, [-1, -1])

  if (index < 0) return null

  return {
    path: new WeakRef(path),
    startIndex: index - 1,
    distance: () => pathLength(path.slice(0, index + 1)) + distance
  }
}

export const pathLength = (path: Path) => path.slice(1).reduce((acc, end, i) => {
  const start = path[i]
  
  return acc + length(subtract(start, end))
}, 0)
