import { findNearestPoint, Position2D } from "../geometry"
import { arcExists, connect, generateArc, type GraphNode } from "./graph"

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
    console.log(point)
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
    console.log(item, nearest)

    if (nearest.length > 0) {
      for (const { item: nearestItem, distance } of nearest) {
        connect(item, nearestItem, generateArc(item, nearestItem, distance))
      }
    }
  }

  return items.map(([item]) => item)
}

