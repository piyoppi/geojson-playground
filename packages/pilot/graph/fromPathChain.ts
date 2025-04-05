import type { Position2D } from "../geometry"
import { findPointInPathChain, PathDirection, VisitFn, type PathChain, type PointInPathchain } from "../pathchain"
import { pathChainWalk } from "../walk"
import { pathLength } from "../path"
import { connect, generateArc, type GraphNode } from "./graph"

type NodeOnPath = {
  position: Position2D,
}
type CallbackGenerated = {
  id: NodeId
}
type CallbackFn<T, U extends CallbackGenerated> = (node: T, found: PointInPathchain) => Promise<[GroupId, U]>
type GroupId = string
type NodeId = string
type BranchId = string
type DistanceKey = ReturnType<typeof distanceKey>

type MappingContext<T extends NodeOnPath, U extends CallbackGenerated> = {
  nodeChainInBranch: Map<BranchId, Map<GroupId, GraphNode[]>>
  distances: Map<DistanceKey, number>
  nodes: Map<GroupId, Map<NodeId, U & GraphNode>>
  createNodeCallback: CallbackFn<T, U>
}

export type MappingOption = {
  currentPathchainChanged?: (pathchain: PathChain) => Promise<void>
}

export const fromPathChain = <T extends NodeOnPath, U extends CallbackGenerated>(
  point: T[],
  createNodeCallback: CallbackFn<T, U>,
  options?: MappingOption
) => (pathChains: PathChain[], from: VisitFn): Promise<Map<GroupId, (U & GraphNode)[]>> => {
  const pointInPathchains: [T, PointInPathchain][] = point
    .map<[T, PointInPathchain | null]>(n => [n, findPointInPathChain(pathChains)(n.position)])
    .flatMap<[T, PointInPathchain]>(([n, p]) => n && p ? [[n, p]] : [])

  return mapping(from, createNodeCallback, pointInPathchains, options)
}

const distanceKey = (branchIds: BranchId[]) => branchIds.join('-')

const createMappingContext = <T extends NodeOnPath, U extends CallbackGenerated>(createNodeCallback: CallbackFn<T, U>): MappingContext<T, U> => ({
  nodeChainInBranch: new Map(),
  distances: new Map(),
  nodes: new Map(),
  createNodeCallback
})

const buildBranchNodeChain = async <T extends NodeOnPath, U extends CallbackGenerated>(
  context: MappingContext<T, U>,
  found: [T, PointInPathchain][],
  branchId: BranchId,
  previousBranchId: BranchId | undefined,
  distance: number,
  pathDirection: PathDirection
) => {
  let lastDistance = 0

  const foundOrderByPosition = found.sort(([_na, a], [_nb, b]) => a.pointInPath.distance() - b.pointInPath.distance())

  if (pathDirection === 'backward') foundOrderByPosition.reverse()

  for (const [node, pointInPathChain] of foundOrderByPosition) {
    const [groupId, nodeAttributes] = await context.createNodeCallback(node, pointInPathChain)
    let previousNode = context.nodeChainInBranch.get(branchId)?.get(groupId)?.at(-1) || 
      (previousBranchId ? context.nodeChainInBranch.get(previousBranchId)?.get(groupId)?.at(-1) : null)
    const currentGroup = context.nodes.get(groupId) || new Map()
    const existingNode = currentGroup.get(nodeAttributes.id)
    const currentNode = existingNode ?
      existingNode :
      {arcs: [], ...nodeAttributes}

    lastDistance = pointInPathChain.pointInPath.distance()

    if (!context.nodeChainInBranch.get(branchId)?.has(groupId)) {
      context.nodeChainInBranch.get(branchId)?.set(groupId, [])
    }

    context.nodeChainInBranch.get(branchId)?.get(groupId)?.push(currentNode)

    if (previousNode) {
      const arc = generateArc(previousNode, currentNode, distance + lastDistance)
      connect(previousNode, currentNode, arc)
    }

    previousNode = currentNode
    currentGroup.set(currentNode.id, currentNode)
    context.nodes.set(groupId, currentGroup)
  }

  return lastDistance
}

const mapping = async <T extends NodeOnPath, U extends CallbackGenerated>(
  from: VisitFn,
  createNodeCallback: CallbackFn<T, U>,
  pointInPathchains: [T, PointInPathchain][],
  options?: MappingOption
) => {
  const context = createMappingContext(createNodeCallback)

  await pathChainWalk(from, async (current, branchIds) => {
    const branchId = branchIds.at(-1)
    if (branchId === undefined) return

    const previousBranchId = branchIds.findLast(id => context.nodeChainInBranch.get(id)?.size ?? 0 > 0)

    if (!context.nodeChainInBranch.has(branchId)) {
      context.nodeChainInBranch.set(branchId, new Map())
    }

    if (options?.currentPathchainChanged) {
      await options.currentPathchainChanged(current.pathChain)
    }

    const found = pointInPathchains.filter(([_, pointInPathChain]) => {
      const currentPointPathChain = pointInPathChain.pathchain.deref()
      return currentPointPathChain === current.pathChain
    })

    const distance = context.distances.get(distanceKey(branchIds))
      ?? context.distances.get(distanceKey(branchIds.slice(0, -1)))
      ?? 0

    if (found.length > 0) {
      const lastDistance = await buildBranchNodeChain(context, found, branchId, previousBranchId, distance, current.pathDirection)
      context.distances.set(distanceKey(branchIds), pathLength(current.pathChain.path) - lastDistance)
    } else {
      context.distances.set(distanceKey(branchIds), distance + pathLength(current.pathChain.path))
    }
  })

  return new Map(context.nodes.entries().map(([k, v]) => [k, v.values().toArray()]))
}
