import type { Arc } from "./arc/index.js"
import type { GraphNode } from "./graph.js"

type WalkCallback<I> = (current: GraphNode<I>, from: GraphNode<I>, arc: Arc<I>) => void

export const walk = <I>(node: GraphNode<I>, callback: WalkCallback<I>) => {
  const visited = new WeakSet<Arc<I>>

  _walkDepthFirst(node, callback, visited)
}

const toNode = async <I>(fromNode: GraphNode<I>, arc: Arc<I>): Promise<GraphNode<I> | null> => {
  const [from, to] = await Promise.all([arc.a(), arc.b()])

  if (fromNode !== from && from) return from
  if (fromNode !== to && to) return to

  return null
}

const _walkDepthFirst = async <I>(node: GraphNode<I>, callback: WalkCallback<I>, visited: WeakSet<Arc<I>>) => {
  let currentNode = node

  const visit = async (arc: Arc<I>, from: GraphNode<I>) => {
    const to = await toNode(currentNode, arc)
    if (!to || visited.has(arc)) return null

    callback(to, from, arc)
    visited.add(arc)

    return to
  }

  while(true) {
    if (currentNode.arcs.length === 0) break

    const firstArcWithTarget = currentNode.arcs.find(arc => {
      const to = visit(arc, currentNode)
      return to !== null
    })

    const firstVisited = firstArcWithTarget
      ? await toNode(currentNode, firstArcWithTarget)
      : null

    const remainingArcs = firstVisited
      ? currentNode.arcs.filter(arc => arc !== firstArcWithTarget)
      : []

    if (!firstVisited) break

    for (let i = 0; i < remainingArcs.length; i++) {
      const arc = remainingArcs[i];
      const to = await visit(arc, currentNode)

      if (to) _walkDepthFirst(to, callback, visited)
    }

    currentNode = firstVisited
  }
}
