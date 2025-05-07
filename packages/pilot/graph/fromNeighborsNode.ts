import { findNearestPoint, type Position2D } from "../geometry.js"
import { arcExists, connect, type GraphNode, type NodeId } from "./graph.js"
import type { ArcGenerator } from "./arc/index.js"

type CallbackGenerated<I> = [NodeId, I]

export const graphBuilder = <I>(
  generateArc: ArcGenerator<I>
) => async <T>(
  point: T[],
  createNodeCallback: (node: T) => CallbackGenerated<I>,
  getPointCallback: (node: T) => Position2D,
) => {
  const items: [GraphNode<I>, Position2D][] = 
    point
      .map(n => [getPointCallback(n), createNodeCallback(n)] as const)
      .map(([p, [id, item]]) => [{id, item, arcs: []}, p])

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
