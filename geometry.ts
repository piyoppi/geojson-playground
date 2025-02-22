export type Position2D = [number, number]

export const diff = (p1: Position2D, p2: Position2D) => (p1[0] - p2[0]) * (p1[0] - p2[0]) + (p1[1] - p2[1]) * (p1[1] - p2[1])

export const center = ([[sx, sy], [ex, ey]]: [Position2D, Position2D]) => [(sx + ex) / 2, (sy + ey) / 2]

export const innerProduction = ([ax, ay]: Position2D, [bx, by]: Position2D): number => ax * bx + ay * by
export const add = ([ax, ay]: Position2D, [bx, by]: Position2D): Position2D => [ax + bx, ay + by]
export const subtract = ([ax, ay]: Position2D, [bx, by]: Position2D): Position2D => [ax - bx, ay - by]
export const length = ([x, y]: Position2D): number => Math.sqrt(x * x + y * y)
