import type { Arc } from "./arc"
import type { GraphNode } from "./graph"

type WalkCallback<T extends GraphNode> = (current: T, from: T, arc: Arc) => void

export const walk = <T extends GraphNode>(node: T, callback: WalkCallback<T>) => {
  const visited = new WeakSet<Arc>

  _walkDepthFirst(node, callback, visited)
}

const toNode = async <T extends GraphNode>(fromNode: T, arc: Arc): Promise<T | null> => {
  const [from, to] = await Promise.all([arc.a(), arc.b()])

  if (fromNode !== from && from) return from as T
  if (fromNode !== to && to) return to as T

  return null
}

const _walkDepthFirst = async <T extends GraphNode>(node: T, callback: WalkCallback<T>, visited: WeakSet<Arc>) => {
  let currentNode = node

  const visit = async (arc: Arc, from: T) => {
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
