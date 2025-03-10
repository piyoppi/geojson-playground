import type { Position2D } from "../geometry.ts"
import { type PathChain, type PointInPathchain } from "../pathchain.ts"
import { pathChainWalk } from "../walk.ts"
import { pathLength } from "../path.ts"
import { generateArc, generateNode, type GraphNode } from "./graph.ts"

type NodeOnPath = {
  position: Position2D,
}

type CallbackFn<T, U> = (node: T, found: PointInPathchain) => U

export const fromPathChain = <T extends NodeOnPath, U>(
  nodes: T[],
  callback: CallbackFn<T, U>
) => (pathchain: PathChain): (U & GraphNode) | null => {
  const pointInPathchains: [T, PointInPathchain][] = nodes
    .map<[T, PointInPathchain | null]>(n => [n, pathchain.findPointInPathChain()(n.position)])
    .flatMap<[T, PointInPathchain]>(([n, p]) => n && p ? [[n, p]] : [])

  return mapping(pathchain, callback, pointInPathchains)
}

const distanceKey = (branchIds: string[]) => branchIds.join('-')

type MappingContext<T extends NodeOnPath, U> = {
  nodeChainInBranch: Map<string, GraphNode[]>
  distances: Map<string, number>
  firstNode: (U & GraphNode) | null
  callback: CallbackFn<T, U>
}

const createMappingContext = <T extends NodeOnPath, U>(callback: CallbackFn<T, U>): MappingContext<T, U> => ({
  nodeChainInBranch: new Map(),
  distances: new Map(),
  firstNode: null,
  callback
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
      const newNode = {...generateNode(), ...context.callback(node, pointInPathChain)}

      lastDistance = pointInPathChain.pointInPath.distance()
      context.nodeChainInBranch.get(branchId)?.push(newNode)

      if (!context.firstNode) {
        context.firstNode = newNode
      }

      if (previousNode) {
        const arc = generateArc(previousNode, newNode, distance + lastDistance)
        previousNode.arcs.push(arc)
        newNode.arcs.push(arc)
      }

      previousNode = newNode
    })

  return lastDistance
}

const mapping = <T extends NodeOnPath, U>(
  pathchain: PathChain,
  callback: CallbackFn<T, U>,
  pointInPathchains: [T, PointInPathchain][]
) => {
  const context = createMappingContext(callback)

  pathChainWalk(pathchain.from(), (pathchain, branchIds) => {
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

  return context.firstNode
}
