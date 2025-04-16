import { findNearestPoint, Position2D } from "../geometry"
import { connect, generateArc, type GraphNode } from "./graph"

type Node<U> = U & GraphNode

type CallbackGenerated = {
  id: NodeId
}

type NodeId = string

export const fromNeighborsPoints = <T, U extends CallbackGenerated>(
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
    )
    if (nearest.length > 0) {
      const { item: nearestItem, distance } = nearest[0]
      connect(item, nearestItem, generateArc(item, nearestItem, distance))
    }
  }

  return items.map(([item]) => item)
}

