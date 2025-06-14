import { length, subtract, type Position2D } from "../index.js"

/**
 * path
 *
 *   p0       p1         p2
 *    x-------x----------x
 */
export type Path = Position2D[]

export const pathLength = (path: Path) => path.slice(1).reduce((acc, end, i) => {
  const start = path[i]
  
  return acc + length(subtract(start, end))
}, 0)
