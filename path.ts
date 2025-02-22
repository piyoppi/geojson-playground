import { innerProduction, Position2D, subtract, length } from "./geometry"

export type Path = Position2D[]

export type PointInPath = {
  path: WeakRef<Path>
  order: number,
  distance: number
}

export const pointInPath = (p: Position2D, path: Path): PointInPath | null => {
  const [index, distance] = path.slice(1).reduce((current, end, i) => {
    if (current) return current

    const start = path[i]

    const b = subtract(start, p)
    const lb = length(b)

    const a = subtract(start, end)
    const prod1 = innerProduction(a, b)
    const angle1 = prod1 / (length(a) * lb)

    if (angle1 < 0) return current

    const c = subtract(end, start)
    const prod2 = innerProduction(b, c)
    const angle2 = prod2 / (length(c) * lb)

    if (angle2 < 0) return current

    if (Math.max(angle1, angle2) < 0.95) return current

    return [i, lb]

  }, [-1, -1])

  if (index < 0) return null

  return {
    path: new WeakRef(path),
    order: index,
    distance
  }
}
