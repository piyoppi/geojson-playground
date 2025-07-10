import { distance, type Position2D } from "../../geometry/index.js"
import { connect, createNode, type GraphNode, type NodeId } from "../graph.js"
import type { ArcGenerator } from "../arc/index.js"

type CallbackGenerated<I> = [NodeId, I]

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

  const compress = (item: T) => {
    const path: T[] = []
    let currentItem = item

    while(currentItem !== undefined && !isRoot(currentItem)) {
      path.push(currentItem)
      const parent = parents.get(currentItem)
      if (!parent) return undefined
      currentItem = parent
    }

    const root = currentItem

    for (const node of path) {
      parents.set(node, root)
    }

    return root
  }

  const find = (item: T) => {
    const root = compress(item)
    if (!root) return undefined

    return root
  }

  const union = (item1: T, item2: T) => {
    createOnce(item1)
    createOnce(item2)

    const rootItem1 = find(item1)
    const rootItem2 = find(item2)

    if (!rootItem1 || !rootItem2) return false
    if (rootItem1 === rootItem2) return false

    const rank1 = ranks.get(rootItem1) || 0
    const rank2 = ranks.get(rootItem2) || 0

    if (rank1 > rank2) {
      parents.set(rootItem2, rootItem1)
    } else if (rank1 < rank2) {
      parents.set(rootItem1, rootItem2)
    } else {
      parents.set(rootItem1, rootItem2)
      ranks.set(rootItem2, rank2 + 1)
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
