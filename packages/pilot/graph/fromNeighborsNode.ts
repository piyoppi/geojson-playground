import { findNearestPoint, Position2D } from "../geometry.js"
import { arcExists, connect, type GraphNode } from "./graph.js"
import type { ArcGenerator } from "./arcGenerator"
import { Arc } from "./arc.js"

type CallbackGenerated<N> = Omit<N, 'arcs'>

export const graphBuilder = <N extends GraphNode>(
  generateArc: ArcGenerator<N>
) => async <T>(
  point: T[],
  createNodeCallback: (node: T) => CallbackGenerated<N>,
  getPointCallback: (node: T) => Position2D,
) => {
  const items: [N, Position2D][] = 
    point
      .map<[T, Position2D]>(n => [n, getPointCallback(n)])
      .map(([n, p]) => [{arcs: [] as Arc[], ...createNodeCallback(n)} as N, p])

  for (const [item, position] of items) {
    const nearest = findNearestPoint(
      position,
      items.map(([item, p]) => [() => p, () => item]),
      2,
    ).filter(async ({item: pair}) => !(await arcExists(item, pair)))

    if (nearest.length > 0) {
      for (const { item: nearestItem, distance } of nearest) {
        connect(item, nearestItem, generateArc(item, nearestItem, distance))
      }
    }
  }

  return items.map(([item]) => item)
}
