import { distance, findNearestPoint, type Position2D } from "../../geometry/index.js"
import { arcExists, connect, createNode, type GraphNode, type NodeId } from "../graph.js"
import type { Arc, ArcGenerator } from "../arc/index.js"

type CallbackGenerated<I> = [NodeId, I]

// export const buildGraphBuilder = <I>(
//   generateArc: ArcGenerator<I>
// ) => async <T>(
//   point: T[],
//   createNodeCallback: (node: T) => CallbackGenerated<I>,
//   getPointCallback: (node: T) => Position2D,
// ): Promise<GraphNode<I>[]> => {
//   const items: [GraphNode<I>, Position2D][] =
//     point
//       .map(n => [getPointCallback(n), createNodeCallback(n)] as const)
//       .map(([p, [id, item]]) => [{id, item, arcs: []}, p])
//
//   for (const [item, position] of items) {
//     const nearest = findNearestPoint(
//       position,
//       items.map(([item, p]) => [() => p, () => item]),
//       2,
//     ).filter(async ({item: pair}) => !(await arcExists(item, pair)))
//
//     if (nearest.length > 0) {
//       for (const { item: nearestItem, distance } of nearest) {
//         connect(item, nearestItem, generateArc(item, nearestItem, distance))
//       }
//     }
//   }
//
//   return items.map(([item]) => item)
// }


export const buildGraphBuilder = <I>(
  generateArc: ArcGenerator<I>
) => async <T>(
  items: T[],
  createNodeItemCallback: (node: T) => CallbackGenerated<I>,
  getPointCallback: (node: T) => Position2D,
): Promise<GraphNode<I>[]> => {
  const nodeDistancePairs = items
    .map(item => [...createNodeItemCallback(item), getPointCallback(item)] as const)
    .map(([nodeId, item, pos]) => [
      createNode(nodeId, item),
      pos
    ] as const)
    .map(([node, pos], idx, items) => [
      node,
      items.toSpliced(idx, 1).map(([pairNodeItem, pairPos]) => [pairNodeItem, distance(pos, pairPos)] as const)
    ] as const)

  // Kruskal's Algorithm
  const arcs = nodeDistancePairs
    .flatMap(([node, distancePairs]) => distancePairs.map(([pair, distance]) => [node, pair, distance] as const))
    .sort(([_n1, _p1, d1], [_n2, _p2, d2]) => d2 - d1)
  const connected = unionFind()
  while (arcs.length > 0) {
    const [a, b, distance] = arcs.pop()!
    if (connected.union(a, b)) {
      connect(a, b, generateArc(a, b, distance))
    }
  }

  return nodeDistancePairs.map(([n]) => n)
}

const unionFind = <T>() => {
  const parents = new Map<T, T>()
  const ranks = new Map<T, number>()

  const createOnce = (item: T) => {
    if (parents.has(item)) return

    parents.set(item, item)
    ranks.set(item, 0)
  }

  const isRoot = (item: T) => parents.get(item) === item

  const find = (item: T) => {
    const parentSet: T[] = [item]
    let failed = false

    while(isRoot(item)) {
      const parent = parents.get(item)
      if (!parent) {
        failed = true
        break
      }
      parentSet.push(parent)
    }

    if (failed) return undefined

    for (let i = 0; i < parentSet.length; i++) {
      parents.set(parentSet[i], parentSet[i + 1])
    }

    return parents.get(item)
  }

  const union = (item1: T, item2: T) => {
    createOnce(item1)
    createOnce(item2)

    const rootItem1 = find(item1)
    const rootItem2 = find(item2)

    if (rootItem1 === rootItem2) return false

    const rank1 = ranks.get(item1) || 0
    const rank2 = ranks.get(item2) || 0

    if (rank1 > rank2) {
      parents.set(item2, item1)
    } else if (rank1 < rank2) {
      parents.set(item1, item2)
    } else {
      parents.set(item1, item2)
      ranks.set(item2, rank2 + 1)
    }

    return true
  }

  const same = (item1: T, item2: T) => find(item1) === find(item2)

  return {
    find,
    union,
    same
  }
}
