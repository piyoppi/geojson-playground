import type { Arc, GraphNode } from "./graph.ts"

export const walk = <T extends GraphNode>(node: T, callback: (current: T, from: T) => void) => {
  const visited = new WeakSet<Arc>

  _walkDepthFirst(node, callback, visited)
}

const toNode = <T extends GraphNode>(fromNode: T, arc: Arc): T | null => {
  const from = arc.from?.deref()

  if (fromNode !== from && from) return from as T

  const to = arc.to.deref()

  if (fromNode !== to && to) return to as T

  return null
}

const _walkDepthFirst = <T extends GraphNode>(node: T, callback: (current: T, from: T) => void, visited: WeakSet<Arc>) => {
  let currentNode = node

  const visit = (arc: Arc, from: T) => {
    const to = toNode(currentNode, arc)
    if (!to || visited.has(arc)) return null

    callback(to, from)
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
      ? toNode(currentNode, firstArcWithTarget)
      : null

    const remainingArcs = firstVisited
      ? currentNode.arcs.filter(arc => arc !== firstArcWithTarget)
      : []

    if (!firstVisited) break

    for (let i = 1; i < remainingArcs.length; i++) {
      const arc = remainingArcs[i];
      const to = visit(arc, currentNode)

      if (to) _walkDepthFirst(to, callback, visited)
    }

    currentNode = firstVisited
  }
}
