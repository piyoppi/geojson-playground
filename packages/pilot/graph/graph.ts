import { idToString, type Id } from "../utils/Id.js"
import type { Arc } from "./arc.js"
import type { ArcGenerator } from "./arcGenerator.js"

export type NodeId = Id
export const isEqualNodeId = (aNodeId: NodeId, bNodeId: NodeId): boolean => aNodeId === bNodeId
export const nodeIdToString = (id: NodeId) => idToString(id)

export interface GraphNode<T> {
  id: NodeId
  item: T
  arcs: Arc<T>[]
}

export const connect = <T>(a: GraphNode<T>, b: GraphNode<T>, arc: Arc<T>): void => {
  setArc(a, arc)
  setArc(b, arc)
}

export const setArc = <T>(node: GraphNode<T>, arc: Arc<T>): void => {
  node.arcs.push(arc)
}

export const disconnect = async <T>(a: GraphNode<T>, b: GraphNode<T>) => {
  const arcsToRemove = a.arcs.filter(async arc => {
    const [nodeA, nodeB] = await Promise.all([arc.a(), arc.b()])
    return (nodeA === a && nodeB === b) || (nodeA === b && nodeB === a)
  })

  a.arcs = a.arcs.filter(arc => !arcsToRemove.includes(arc))
  b.arcs = b.arcs.filter(arc => !arcsToRemove.includes(arc))
}

export const removeNode = async (node: GraphNode<unknown>) => {
  const connectedNodes: GraphNode<unknown>[] = []
  
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

export const to = async <T>(fromNode: GraphNode<T>, arc: Arc<T>): Promise<GraphNode<T> | null> => {
  const [nodeA, nodeB] = await Promise.all([arc.a(), arc.b()])

  if (nodeA && fromNode !== nodeA && nodeB === fromNode) return nodeA
  if (nodeB && fromNode !== nodeB && nodeA === fromNode) return nodeB

  return null
}

export const arcExists = async <T>(a: GraphNode<T>, b: GraphNode<T>): Promise<boolean> => {
  return Promise.all(
    a.arcs.map(async arc => {
      const [nodeA, nodeB] = await Promise.all([arc.a(), arc.b()])

      return (nodeA === a && nodeB === b) || (nodeA === b && nodeB === a)
    })
  ).then(results => results.some(result => result))
}

export const buildNodeMerger = <IG>(
  generateArc: ArcGenerator<IG>
) => async <I extends IG>(
  ...nodes: GraphNode<I>[]
): Promise<GraphNode<I>> => {
  const mergedNode = {...nodes[0], arcs: []}
  const arcMap = new Map<GraphNode<I>, { totalCost: number, count: number }>()
  
  for (const node of nodes) {
    for (const arc of node.arcs) {
      const nodeA = await arc.a()
      const nodeB = await arc.b()
      
      if (!nodeA || !nodeB) continue
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

export type DuplicateNodesMarger<IG> = ReturnType<typeof buildDuplicateNodesMarger<IG>>
export const buildDuplicateNodesMarger = <IG>(
  mergeNodes: ReturnType<typeof buildNodeMerger<IG>>
) => async <I extends IG>(targetNodes: GraphNode<I>[]): Promise<GraphNode<I>[]> => {
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

export const findShortestPath = async <I>(
  startNode: GraphNode<I>,
  endNode: GraphNode<I>
): Promise<GraphNode<I>[]> => {
  const visited = new Set<NodeId>()

  const distances = new Map<NodeId, number>()
  distances.set(startNode.id, 0)

  const previous = new Map<NodeId, GraphNode<I>>()

  const queue: [GraphNode<I>, number][] = [[startNode, 0]]

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
        previous.set(nextNode.id, currentNode)
        queue.push([nextNode, newCost])
      }
    }
  }

  if (!previous.has(endNode.id) && startNode.id !== endNode.id) {
    return []
  }

  const path: GraphNode<I>[] = [endNode]
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
