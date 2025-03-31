import type { Position2D } from "../geometry"
import { findPointInPathChain, VisitFn, type PathChain, type PointInPathchain } from "../pathchain"
import { pathChainWalk } from "../walk"
import { pathLength } from "../path"
import { connect, generateArc, generateNode, type GraphNode } from "./graph"

type NodeOnPath = {
  position: Position2D,
}

type CallbackFn<T, U> = (node: T, found: PointInPathchain) => U

export const fromPathChain = <T extends NodeOnPath, U>(
  nodes: T[],
  createNodeCallback: CallbackFn<T, U>
) => (pathChains: PathChain[], from: VisitFn): (U & GraphNode)[] => {
  const pointInPathchains: [T, PointInPathchain][] = nodes
    .map<[T, PointInPathchain | null]>(n => [n, findPointInPathChain(pathChains)(n.position)])
    .flatMap<[T, PointInPathchain]>(([n, p]) => n && p ? [[n, p]] : [])

  return mapping(from, createNodeCallback, pointInPathchains)
}

const distanceKey = (branchIds: string[]) => branchIds.join('-')

type MappingContext<T extends NodeOnPath, U> = {
  nodeChainInBranch: Map<string, GraphNode[]>
  distances: Map<string, number>
  nodes: (U & GraphNode)[]
  createNodeCallback: CallbackFn<T, U>
}

const createMappingContext = <T extends NodeOnPath, U>(createNodeCallback: CallbackFn<T, U>): MappingContext<T, U> => ({
  nodeChainInBranch: new Map(),
  distances: new Map(),
  nodes: [],
  createNodeCallback
})

const buildBranchNodeChain = <T extends NodeOnPath, U>(
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
      const newNode = {...generateNode(), ...context.createNodeCallback(node, pointInPathChain)}

      lastDistance = pointInPathChain.pointInPath.distance()
      context.nodeChainInBranch.get(branchId)?.push(newNode)

      if (previousNode) {
        const arc = generateArc(previousNode, newNode, distance + lastDistance)
        connect(previousNode, newNode, arc)
      }

      previousNode = newNode
      context.nodes.push(newNode)
    })

  return lastDistance
}

const mapping = <T extends NodeOnPath, U>(
  from: VisitFn,
  createNodeCallback: CallbackFn<T, U>,
  pointInPathchains: [T, PointInPathchain][]
) => {
  const context = createMappingContext(createNodeCallback)

  pathChainWalk(from, (pathchain, branchIds) => {
    const branchId = branchIds.at(-1)
    if (branchId === undefined) return

    const previousBranchNum = branchIds.findLast(id => context.nodeChainInBranch.get(id)?.length ?? 0 > 0)

    if (!context.nodeChainInBranch.has(branchId)) {
      context.nodeChainInBranch.set(branchId, [])
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

  return context.nodes
}
