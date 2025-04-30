import { idToString, type Id } from "../utils/Id.js"
import type { Arc } from "./arc"
import type { ArcGenerator } from "./arcGenerator"

export type NodeId = Id
export const isEqualNodeId = (aNodeId: NodeId, bNodeId: NodeId): boolean => aNodeId === bNodeId
export const nodeIdToString = (id: NodeId) => idToString(id)

export type GraphNode = {
  id: NodeId
  arcs: Arc[]
}

export const generateNode = (id: NodeId): GraphNode => ({
  id: id,
  arcs: [],
})

export const connect = (a: GraphNode, b: GraphNode, arc: Arc): void => {
  a.arcs.push(arc)
  b.arcs.push(arc)
}

export const disconnect = async (a: GraphNode, b: GraphNode) => {
  const arcsToRemove = a.arcs.filter(async arc => {
    const [nodeA, nodeB] = await Promise.all([arc.a(), arc.b()])
    return (nodeA === a && nodeB === b) || (nodeA === b && nodeB === a)
  })

  a.arcs = a.arcs.filter(arc => !arcsToRemove.includes(arc))
  b.arcs = b.arcs.filter(arc => !arcsToRemove.includes(arc))
}

export const removeNode = async (node: GraphNode) => {
  const connectedNodes: GraphNode[] = []
  
  for (const arc of node.arcs) {
    const nodeA = await arc.a()
    const nodeB = await arc.b()
    const connectedNode = nodeA === node ? nodeB : nodeA
    if (connectedNode && !connectedNodes.includes(connectedNode)) {
      connectedNodes.push(connectedNode)
    }
  }
  
  connectedNodes.forEach(connectedNode => disconnect(node, connectedNode))
}

export const to = async <T extends GraphNode>(fromNode: T, arc: Arc): Promise<T | null> => {
  const [nodeA, nodeB] = await Promise.all([arc.a(), arc.b()])

  if (fromNode !== nodeA && nodeB === fromNode) return nodeA as T
  if (fromNode !== nodeB && nodeA === fromNode) return nodeB as T

  return null
}

export const arcExists = async (a: GraphNode, b: GraphNode): Promise<boolean> => {
  return a.arcs.some(async arc => {
    const [nodeA, nodeB] = await Promise.all([arc.a(), arc.b()])

    return (nodeA === a && nodeB === b) || (nodeA === b && nodeB === a)
  })
}

export const buildNodeMerger = (
  generateArc: ArcGenerator
) => async <T extends GraphNode>(
  ...nodes: T[]
): Promise<T> => {
  const mergedNode = {...nodes[0], arcs: []}
  const arcMap = new Map<GraphNode, { totalCost: number, count: number }>()
  
  for (const node of nodes) {
    for (const arc of node.arcs) {
      const nodeA = await arc.a() as T
      const nodeB = await arc.b() as T
      
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

export type DuplicateNodesMarger = ReturnType<typeof buildDuplicateNodesMarger>
export const buildDuplicateNodesMarger = (
  mergeNodes: ReturnType<typeof buildNodeMerger>
) => async <T extends GraphNode>(targetNodes: T[]): Promise<T[]> => {
  const duplicatedNodes = new Set()

  await Promise.all(
    Map.groupBy(targetNodes, n => n.id).values().map(async nodes => {
      if (nodes.length > 1) {
        const mergedNode = await mergeNodes(...nodes)
        targetNodes.push(mergedNode)
        nodes.forEach(node => {
          removeNode(node)
          duplicatedNodes.add(node)
        })
      }
    })
  )

  return targetNodes.filter(node => !duplicatedNodes.has(node))
}

export const findShortestPath = async <T extends GraphNode>(
  startNode: T,
  endNode: T
): Promise<T[]> => {
  const visited = new Set<NodeId>()

  const distances = new Map<NodeId, number>()
  distances.set(startNode.id, 0)

  const previous = new Map<NodeId, T>()

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
      const [nodeA, nodeB] = await Promise.all([arc.a(), arc.b()])

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
