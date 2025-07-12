import { idToString, type Id } from "../utils/Id.js"
import type { Arc, ArcGenerator } from "./arc/index.js"

export type NodeId = Id
export const isEqualNodeId = (aNodeId: NodeId, bNodeId: NodeId): boolean => aNodeId === bNodeId
export const nodeIdToString = (id: NodeId) => idToString(id)
export const stringToNodeId = (str: string) => str

export interface GraphNode<T> {
  id: NodeId
  item: T
  arcs: Arc<T>[]
}
export const createNode = <T>(id: NodeId, item: T, arcs: Arc<T>[] = []): GraphNode<T> => ({
  id, item, arcs
})

export const connect = <T>(a: GraphNode<T>, b: GraphNode<T>, arc: Arc<T>): void => {
  setArc(a, arc)
  setArc(b, arc)
}

export const setArc = <T>(node: GraphNode<T>, arc: Arc<T>): void => {
  node.arcs.push(arc)
}

export const buildConnector = <T>(generator: ArcGenerator<T>) => (a: GraphNode<T>, b: GraphNode<T>, cost: number): void => {
  const arc = generator(a, b, cost)
  connect(a, b, arc)
}

export const disconnect = async <T>(a: GraphNode<T>, b: GraphNode<T>) => {
  const removalArcs: Arc<T>[] = []

  for (const arc of a.arcs) {
    const [nodeA, nodeB] = await Promise.all([arc.a(), arc.b()])
    if ((nodeA === a && nodeB === b) || (nodeA === b && nodeB === a)) {
      removalArcs.push(arc)
    }
  }

  a.arcs = a.arcs.filter(arc => !removalArcs.includes(arc))
  b.arcs = b.arcs.filter(arc => !removalArcs.includes(arc))
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

  for (const connectedNode of connectedNodes) {
    await disconnect(node, connectedNode)
  }
}

export const to = async <T>(fromNode: GraphNode<T>, arc: Arc<T>): Promise<GraphNode<T> | null> => {
  const [nodeA, nodeB] = await Promise.all([arc.a(), arc.b()])

  if (nodeA && fromNode !== nodeA && nodeB === fromNode) return nodeA
  if (nodeB && fromNode !== nodeB && nodeA === fromNode) return nodeB

  return null
}

export const findConnectingArc = async <T>(
  nodeA: GraphNode<T>,
  nodeB: GraphNode<T>
): Promise<Arc<T> | undefined> => {
  for (const arc of nodeA.arcs) {
    const [arcNodeA, arcNodeB] = await Promise.all([arc.a(), arc.b()])
    if ((arcNodeA === nodeA && arcNodeB === nodeB) || (arcNodeA === nodeB && arcNodeB === nodeA)) {
      return arc
    }
  }

  return undefined
}

export const arcExists = async <T>(a: GraphNode<T>, b: GraphNode<T>): Promise<boolean> => {
  const arc = await findConnectingArc(a, b)
  return arc !== undefined
}

export const buildNodeMerger = <IG>(
  generateArc: ArcGenerator<IG>
) => async <I extends IG>(
  ...nodes: GraphNode<I>[]
): Promise<GraphNode<I>> => {
  // TODO: Check nodes length
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
  mergeNodes: ReturnType<typeof buildNodeMerger<IG>>,
  getGroupKey: (n: GraphNode<IG>) => string | undefined = (n) => n.id,
) => async <I extends IG>(
  targetNodes: GraphNode<I>[],
  mergedNodeHook: (merged: GraphNode<IG>, targetNodes: GraphNode<IG>[]) => void = () => {}
): Promise<GraphNode<I>[]> => {
  const duplicatedNodes = new Set()
  const mergedNodes: GraphNode<I>[]= []
  const nodesToRemove: GraphNode<I>[] = []

  const groups = Map.groupBy(targetNodes, n => getGroupKey(n))

  for (const [k, nodes] of groups.entries()) {
    if (!k || nodes.length < 2) continue

    const mergedNode = await mergeNodes(...nodes)
    mergedNodeHook(mergedNode, nodes)
    mergedNodes.push(mergedNode)

    for (const node of nodes) {
      nodesToRemove.push(node)
      duplicatedNodes.add(node)
    }
  }

  for (const node of nodesToRemove) {
    await removeNode(node)
  }

  return [
    ...mergedNodes,
    ...targetNodes.filter(node => !duplicatedNodes.has(node))
  ]
}

export type FindShortestPathOptions<I> = {
  getCost?: (arc: Arc<I>, a: GraphNode<I>, b: GraphNode<I>) => number | Promise<number>
  maxCost?: number
  maxSteps?: number
}

export const findShortestPath = async <I>(
  startNode: GraphNode<I>,
  endNode: GraphNode<I>,
  options: FindShortestPathOptions<I> = {}
): Promise<GraphNode<I>[]> => {
  const { getCost = (arc) => arc.cost, maxCost, maxSteps } = options

  if (startNode.id === endNode.id) {
    return [startNode]
  }

  const costFixed = new Set<NodeId>()

  const distances = new Map<NodeId, number>()
  distances.set(startNode.id, 0)

  const steps = new Map<NodeId, number>()
  steps.set(startNode.id, 0)

  const previous = new Map<NodeId, GraphNode<I>>()

  const queue: [GraphNode<I>, number, number][] = [[startNode, 0, 0]]

  while (queue.length > 0) {
    // FIXME: Using Priority Queue
    queue.sort((a, b) => a[1] - b[1])
    const [currentNode, currentCost, currentSteps] = queue.shift()!

    if (costFixed.has(currentNode.id)) {
      continue
    }

    if (currentNode.id === endNode.id) {
      break
    }

    costFixed.add(currentNode.id)

    for (const arc of currentNode.arcs) {
      const nextNode = await to(currentNode, arc)
      if (!nextNode || costFixed.has(nextNode.id)) continue

      const newCost = currentCost + await getCost(arc, currentNode, nextNode)
      const newSteps = currentSteps + 1

      if (maxCost !== undefined && newCost > maxCost) {
        continue
      }

      if (maxSteps !== undefined && newSteps > maxSteps) {
        continue
      }

      const existingCost = distances.get(nextNode.id) ?? Infinity

      if (newCost < existingCost) {
        distances.set(nextNode.id, newCost)
        steps.set(nextNode.id, newSteps)
        previous.set(nextNode.id, currentNode)
        queue.push([nextNode, newCost, newSteps])
      }
    }
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
