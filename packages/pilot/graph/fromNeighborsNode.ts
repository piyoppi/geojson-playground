import { findNearestPoint, Position2D } from "../geometry.js"
import { ArcGenerator } from "./arcGenerator.js"
import { arcExists, connect, NodeId, type GraphNode } from "./graph.js"

type Node<U> = U & GraphNode

type CallbackGenerated = {
  id: NodeId
}

export const graphBuilder = (
  generateArc: ArcGenerator
) => <T, U extends CallbackGenerated>(
  point: T[],
  createNodeCallback: (node: T) => U,
  getPointCallback: (node: T) => Position2D,
) => {
  const items: [Node<U>, Position2D][] = 
    point
      .map<[T, Position2D]>(n => [n, getPointCallback(n)])
      .map(([n, p]) => [{arcs: [], ...createNodeCallback(n)}, p])

  for (const [item, position] of items) {
    const nearest = findNearestPoint(
      position,
      items.map(([item, p]) => [() => p, () => item]),
      2,
    ).filter(({item: pair}) => !arcExists(item, pair))

    if (nearest.length > 0) {
      for (const { item: nearestItem, distance } of nearest) {
        connect(item, nearestItem, generateArc(item, nearestItem, distance))
      }
    }
  }

  return items.map(([item]) => item)
}
