import type { Position2D } from "../geometry"
import { findPointInPathChain, VisitFn, type PathChain, type PointInPathchain } from "../pathchain"
import { pathChainWalk } from "../walk"
import { pathLength } from "../path"
import { connect, generateArc, type GraphNode } from "./graph"

type NodeOnPath = {
  position: Position2D,
}

type CallbackGenerated = {id: string}
type CallbackFn<T, U extends CallbackGenerated> = (node: T, found: PointInPathchain) => U

export type MappingOption = {
  currentPathchainChanged?: (pathchain: PathChain) => Promise<void>
}

export const fromPathChain = <T extends NodeOnPath, U extends CallbackGenerated>(
  point: T[],
  createNodeCallback: CallbackFn<T, U>,
  options?: MappingOption
) => (pathChains: PathChain[], from: VisitFn): Promise<(U & GraphNode)[]> => {
  const pointInPathchains: [T, PointInPathchain][] = point
    .map<[T, PointInPathchain | null]>(n => [n, findPointInPathChain(pathChains)(n.position)])
    .flatMap<[T, PointInPathchain]>(([n, p]) => n && p ? [[n, p]] : [])

  return mapping(from, createNodeCallback, pointInPathchains, options)
}

const distanceKey = (branchIds: string[]) => branchIds.join('-')

type MappingContext<T extends NodeOnPath, U extends CallbackGenerated> = {
  nodeChainInBranch: Map<string, GraphNode[]>
  distances: Map<string, number>
  nodes: Map<string, U & GraphNode>
  createNodeCallback: CallbackFn<T, U>
}

const createMappingContext = <T extends NodeOnPath, U extends CallbackGenerated>(createNodeCallback: CallbackFn<T, U>): MappingContext<T, U> => ({
  nodeChainInBranch: new Map(),
  distances: new Map(),
  nodes: new Map(),
  createNodeCallback
})

const buildBranchNodeChain = <T extends NodeOnPath, U extends CallbackGenerated>(
  context: MappingContext<T, U>,
  found: [T, PointInPathchain][],
  branchId: string,
  previousBranchNum: string | undefined,
  distance: number
) => {
  let previousNode = context.nodeChainInBranch.get(branchId)?.at(-1) || 
    (previousBranchNum ? context.nodeChainInBranch.get(previousBranchNum)?.at(-1) : null)
  let lastDistance = 0

  found
    .sort(([_na, a], [_nb, b]) => a.pointInPath.distance() - b.pointInPath.distance())
    .forEach(([node, pointInPathChain]) => {
      const nodeAttributes = context.createNodeCallback(node, pointInPathChain)
      const existingNode = context.nodes.get(nodeAttributes.id)
      const currentNode = existingNode ?
        existingNode :
        {arcs: [], ...nodeAttributes}

      lastDistance = pointInPathChain.pointInPath.distance()
      context.nodeChainInBranch.get(branchId)?.push(currentNode)

      if (previousNode) {
        const arc = generateArc(previousNode, currentNode, distance + lastDistance)
        connect(previousNode, currentNode, arc)
      }

      previousNode = currentNode
      context.nodes.set(currentNode.id, currentNode)
    })

  return lastDistance
}

const mapping = async <T extends NodeOnPath, U extends CallbackGenerated>(
  from: VisitFn,
  createNodeCallback: CallbackFn<T, U>,
  pointInPathchains: [T, PointInPathchain][],
  options?: MappingOption
) => {
  const context = createMappingContext(createNodeCallback)

  await pathChainWalk(from, async (pathchain, branchIds) => {
    const branchId = branchIds.at(-1)
    if (branchId === undefined) return

    const previousBranchNum = branchIds.findLast(id => context.nodeChainInBranch.get(id)?.length ?? 0 > 0)

    if (!context.nodeChainInBranch.has(branchId)) {
      context.nodeChainInBranch.set(branchId, [])
    }

    if (options?.currentPathchainChanged) {
      await options.currentPathchainChanged(pathchain)
    }

    const found = pointInPathchains.filter(([_, pointInPathChain]) => {
      const currentPointPathChain = pointInPathChain.pathchain.deref()
      return currentPointPathChain === pathchain
    })

    const distance = context.distances.get(distanceKey(branchIds))
      ?? context.distances.get(distanceKey(branchIds.slice(0, -1)))
      ?? 0

    if (found.length > 0) {
      const lastDistance = buildBranchNodeChain(context, found, branchId, previousBranchNum, distance)
      context.distances.set(distanceKey(branchIds), pathLength(pathchain.path) - lastDistance)
    } else {
      context.distances.set(distanceKey(branchIds), distance + pathLength(pathchain.path))
    }
  })

  return context.nodes.values().toArray()
}
