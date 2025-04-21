export type GraphNode = {
  id: string
  arcs: Arc[]
}

export type Arc = {
  cost: number,
  a: WeakRef<GraphNode>
  b: WeakRef<GraphNode>,
}

export const generateNode = (id: string): GraphNode => ({
  id: id,
  arcs: [],
})

export const generateArc = (a: GraphNode, b: GraphNode, cost: number): Arc => ({
  cost: cost,
  a: new WeakRef(a),
  b: new WeakRef(b),
})

export const connect = (a: GraphNode, b: GraphNode, arc: Arc): void => {
  a.arcs.push(arc)
  b.arcs.push(arc)
}

export const disconnect = (a: GraphNode, b: GraphNode): void => {
  const arcsToRemove = a.arcs.filter(arc => {
    const nodeA = arc.a.deref()
    const nodeB = arc.b.deref()
    return (nodeA === a && nodeB === b) || (nodeA === b && nodeB === a)
  })

  a.arcs = a.arcs.filter(arc => !arcsToRemove.includes(arc))
  b.arcs = b.arcs.filter(arc => !arcsToRemove.includes(arc))
}

export const removeNode = (node: GraphNode): void => {
  const connectedNodes: GraphNode[] = []
  
  for (const arc of node.arcs) {
    const nodeA = arc.a.deref()
    const nodeB = arc.b.deref()
    const connectedNode = nodeA === node ? nodeB : nodeA
    if (connectedNode && !connectedNodes.includes(connectedNode)) {
      connectedNodes.push(connectedNode)
    }
  }
  
  connectedNodes.forEach(connectedNode => disconnect(node, connectedNode))
}

export const to = <T extends GraphNode>(fromNode: T, arc: Arc): T | null => {
  const nodeA = arc.a?.deref()
  const nodeB = arc.b.deref()

  if (fromNode !== nodeA && nodeB === fromNode) return nodeA as T
  if (fromNode !== nodeB && nodeA === fromNode) return nodeB as T

  return null
}

export const arcExists = (a: GraphNode, b: GraphNode): boolean => {
  return a.arcs.some(arc => {
    const nodeA = arc.a.deref()
    const nodeB = arc.b.deref()
    return (nodeA === a && nodeB === b) || (nodeA === b && nodeB === a)
  })
}

export const mergeNodes = <T extends GraphNode>(...nodes: T[]): T => {
  const mergedNode = {...nodes[0], arcs: []}
  const arcMap = new Map<GraphNode, { totalCost: number, count: number }>()
  
  for (const node of nodes) {
    for (const arc of node.arcs) {
      const nodeA = arc.a.deref() as T
      const nodeB = arc.b.deref() as T
      
      if (nodes.includes(nodeA) && nodes.includes(nodeB)) continue
      
      const otherNode = nodes.includes(nodeA) ? nodeB : nodeA
      
      if (!otherNode) continue
      
      if (!arcMap.has(otherNode)) {
        arcMap.set(otherNode, { totalCost: arc.cost, count: 1 })
      } else {
        const current = arcMap.get(otherNode)!
        current.totalCost += arc.cost
        current.count++
      }
    }
  }
  
  for (const [otherNode, { totalCost, count }] of arcMap.entries()) {
    const averageCost = totalCost / count
    const newArc = generateArc(mergedNode, otherNode, averageCost)
    connect(mergedNode, otherNode, newArc)
  }
  
  return mergedNode
}

export const mergeDuplicateNodes = <T extends GraphNode>(targetNodes: T[]): T[] => {
  const duplicatedNodes = new Set()

  Map.groupBy(targetNodes, n => n.id).values().forEach(nodes => {
    if (nodes.length > 1) {
      const mergedNode = mergeNodes(...nodes)
      targetNodes.push(mergedNode)
      nodes.forEach(node => {
        removeNode(node)
        duplicatedNodes.add(node)
      })
    }
  })

  return targetNodes.filter(node => !duplicatedNodes.has(node))
}

export const findShortestPath = <T extends GraphNode>(
  startNode: T,
  endNode: T
): T[] => {
  const visited = new Set<string>()

  const distances = new Map<string, number>()
  distances.set(startNode.id, 0)

  const previous = new Map<string, T>()

  const queue: [T, number][] = [[startNode, 0]]

  while (queue.length > 0) {
    queue.sort((a, b) => a[1] - b[1])
    const [currentNode, currentCost] = queue.shift()!

    if (visited.has(currentNode.id)) {
      continue
    }

    if (currentNode.id === endNode.id) {
      break
    }

    visited.add(currentNode.id)

    for (const arc of currentNode.arcs) {
      const nodeA = arc.a.deref()
      const nodeB = arc.b.deref()

      if (!nodeA || !nodeB) continue

      const nextNode = nodeA.id === currentNode.id ? nodeB : nodeA

      if (visited.has(nextNode.id)) continue

      const newCost = currentCost + arc.cost
      const existingCost = distances.get(nextNode.id) ?? Infinity

      if (newCost < existingCost) {
        distances.set(nextNode.id, newCost)
        previous.set(nextNode.id, currentNode as T)
        queue.push([nextNode as T, newCost])
      }
    }
  }

  if (!previous.has(endNode.id) && startNode.id !== endNode.id) {
    return []
  }

  const path: T[] = [endNode]
  let current = endNode

  while (current.id !== startNode.id) {
    const prevNode = previous.get(current.id)
    if (!prevNode) break

    path.unshift(prevNode)
    current = prevNode
  }

  if (path[0].id !== startNode.id) {
    return []
  }

  return path
}
