import { Arc, GraphNode } from "./graph"

const toNode = <T extends GraphNode>(fromNode: T, arc: Arc): T | null => {
  const from = arc.from?.deref()

  if (fromNode !== from && from) return from as T

  const to = arc.to.deref()

  if (fromNode !== to && to) return to as T

  return null
}

export const walk = <T extends GraphNode>(node: T, callback: (current: T, from: T) => void) => {
  const visited = new WeakSet<T>

  _walk(node, callback, visited)
}

const _walk = <T extends GraphNode>(node: T, callback: (current: T, from: T) => void, visited: WeakSet<T>) => {
  let currentNode = node

  const visit = (arc: Arc, from: T) => {
    const to = toNode(currentNode, arc)
    if (!to) return null
    if (visited.has(to)) return null

    callback(to, from)
    visited.add(to)

    return to
  }

  while(true) {
    if (currentNode.arcs.length === 0) break

    const [firstVisited, remainingArcs] = currentNode.arcs.reduce(([visited, remain]: [T | null, Arc[]], arc): [T | null, Arc[]] => {
      if (visited) {
        remain.push(arc)
        return [visited, remain]
      }

      const to = visit(arc, currentNode)

      return to ? [to, [arc]] : [null, []]
    }, [null, []])

    if (!firstVisited) break

    remainingArcs.slice(1).map(arc => {
      const to = visit(arc, currentNode)

      if (to) {
        _walk(to, callback, visited)
      }

      return !!to
    })

    currentNode = firstVisited
  }
}
