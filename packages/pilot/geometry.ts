export type Position2D = [number, number]

export const distance = (p1: Readonly<Position2D>, p2: Readonly<Position2D>) => (p1[0] - p2[0]) * (p1[0] - p2[0]) + (p1[1] - p2[1]) * (p1[1] - p2[1])
export const center = ([[sx, sy], [ex, ey]]: Readonly<[Position2D, Position2D]>): Position2D => [(sx + ex) / 2, (sy + ey) / 2]
export const innerProduction = ([ax, ay]: Readonly<Position2D>, [bx, by]: Readonly<Position2D>): number => ax * bx + ay * by
export const add = ([ax, ay]: Readonly<Position2D>, [bx, by]: Readonly<Position2D>): Position2D => [ax + bx, ay + by]
export const subtract = ([ax, ay]: Readonly<Position2D>, [bx, by]: Readonly<Position2D>): Position2D => [ax - bx, ay - by]
export const length = ([x, y]: Readonly<Position2D>): number => Math.sqrt(x * x + y * y)
export const normalize = (v: Readonly<Position2D>): Position2D => {
  const l = length(v)
  return l === 0 ? [0, 0] : [v[0] / l, v[1] / l]
}
export const findNearestPoint = <T>(
  position: Position2D,
  items: [(() => Position2D), (() => T)][],
  limit: number = 1
): Array<{ item: T, distance: number }> =>
  items
    .map(([getPairPosition, getPairItem]) => ({
      item: getPairItem(),
      distance: distance(position, getPairPosition())
    }))
    .filter(({ item }) => item !== position)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
