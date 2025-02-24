import { Arc, GraphNode } from "./graph";

const toNode = <T extends GraphNode>(fromNode: T, arc: Arc): T | null => {
  const from = arc.from?.deref()

  if (fromNode !== from && from) return from as T

  const to = arc.to.deref()

  if (fromNode !== to && to) return to as T

  return null
}

export const walk = <T extends GraphNode>(node: T, callback: (current: T, from: T, forkedCount: number) => void, forkedCount: number = 0) => {
  let currentNode = node

  const visit = (arc: Arc, from: T) => {
    const to = toNode(currentNode, arc)
    if (!to) return null

    callback(to, from, forkedCount)

    return to
  }

  while(true) {
    if (currentNode.arcs.length === 0) break

    const [visitedNode, remainingArcs] = currentNode.arcs.reduce(([visited, remain]: [T | null, Arc[]], arc): [T | null, Arc[]] => {
      if (visited) {
        remain.push(arc)
        return [visited, remain]
      }

      const to = visit(arc, currentNode)

      return to ? [to, [arc]] : [null, []]
    }, [null, []])

    if (!visitedNode) break

    remainingArcs.slice(1).map(arc => {
      const to = visit(arc, currentNode)

      if (to) {
        walk(to, callback, forkedCount + 1)
      }

      return !!to
    })

    currentNode = visitedNode
  }
}
