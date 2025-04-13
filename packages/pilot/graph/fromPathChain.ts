import type { Position2D } from "../geometry"
import { findPointInPathChain, IsolatedPathChain, PathDirection, VisitFn, type PathChain, type PointInPathchain } from "../pathchain"
import { BranchId, pathChainWalk } from "../walk"
import { Path, pathLength } from "../path"
import { connect, generateArc, type GraphNode } from "./graph"

type NodeOnPath = {
  position: Position2D,
}

type CallbackGenerated = {
  id: NodeId
}

type Node<U> = U & GraphNode

type CallbackFn<T, U extends CallbackGenerated> = (node: T, found: PointInPathchain) => Promise<U>

type GroupIdCallbackFn<T, G> = (node: T) => G

type NodeId = string

export type BranchIdChainSerialized = string & { readonly __brand: unique symbol }
const BranchIdChainSerialized = (branchIdChain: BranchId[]): BranchIdChainSerialized => branchIdChain.join('-') as BranchIdChainSerialized

type MappingContext<U extends CallbackGenerated> = {
  previousContext?: MappingContext<U>
  paths: [Path, PathDirection][]
  founds: [Node<U>, PointInPathchain][]
  branchId: BranchId
}

export type MappingOption = {
  currentPathchainChanged?: (pathchain: PathChain) => Promise<void>
  maxDistance?: number
}

export const fromPathChain = <T extends NodeOnPath, U extends CallbackGenerated, G>(
  point: T[],
  createNodeCallback: CallbackFn<T, U>,
  groupIdCallback: GroupIdCallbackFn<T, G>,
  options?: MappingOption
) => (pathChains: IsolatedPathChain, from: VisitFn): Promise<Map<G, (Node<U>)[]>> => {
  const pointInPathchains: [T, PointInPathchain][] = point
    .map<[T, PointInPathchain | null]>(n => [n, findPointInPathChain(pathChains)(n.position)])
    .flatMap<[T, PointInPathchain]>(([n, p]) => n && p ? [[n, p]] : [])

  return mapping(from, createNodeCallback, groupIdCallback, pointInPathchains, options)
}

const distance = (paths: [Path, PathDirection][], fromPointInPathchain: PointInPathchain, toPointInPathchain: PointInPathchain) => {
  const tailLength = (() => {
    const [headPath, headPathDirection] = paths.at(0) ?? [undefined, undefined]
    return headPathDirection === 'forward' ?
      pathLength(headPath) - toPointInPathchain.pointInPath.distance() :
      toPointInPathchain.pointInPath.distance()
  })()

  const headLength = (() => {
    const [tailPath, tailPathDirection] = paths.at(-1) ?? [undefined, undefined]
    return tailPathDirection === 'forward' ?
      pathLength(tailPath) - fromPointInPathchain.pointInPath.distance() :
      fromPointInPathchain.pointInPath.distance()
  })()

  // |<---------------------- Path ----------------------->|
  // |                                                     |
  // |     A (from)                                 B (to) |
  // *-----x-----------*-----*----------*-----------x------*
  //       |<-headLen->|<---- len ----->|<-tailLen->|
  //
  return paths.slice(1, -1).map(([path]) => pathLength(path)).reduce((acc, length) => acc + length, 0) + headLength + tailLength
}

const distanceBetweenPreviousNodes = <U extends CallbackGenerated>(ctx: MappingContext<U>) => {
  const contexts = [ctx, ...findPreviousContexts(ctx)]
  const [[_fromNode, toPointInPathchain], [_toNode, fromPointInPathchain]] = contexts.map(c => c.founds.toReversed()).flat()

  const allPaths = contexts.map(c => c.paths).flat()
  const paths = allPaths.slice(
    ...[
      allPaths.findIndex(([p]) => toPointInPathchain.pathchain.deref()?.path === p),
      allPaths.findIndex(([p]) => fromPointInPathchain.pathchain.deref()?.path === p),
    ].sort()
  )

  return distance(paths, fromPointInPathchain, toPointInPathchain)
}

const findPreviousContexts = <U extends CallbackGenerated>(ctx: MappingContext<U>) => {
  const previousContexts: MappingContext<U>[] = []
  let current: MappingContext<U> | undefined = ctx.previousContext
  while (current) {
    previousContexts.push(current)
    if (current.founds.length > 0) {
      return previousContexts
    }
    current = current.previousContext
  }

  return []
}

const previousFound = <U extends CallbackGenerated>(ctx: MappingContext<U>) => {
  let current: MappingContext<U> | undefined = ctx
  while (current) {
    const found = current.founds.at(-1)
    if (found) return found
    current = current.previousContext
  }

  return [undefined, undefined] as const
}

const createMappingContext = <U extends CallbackGenerated>(branchId: BranchId): MappingContext<U> => ({
  founds: [],
  paths: [],
  branchId,
})

const findPreviousContextFromBranchIdChain = <U extends CallbackGenerated>(
  contextByBranchIdChain: Map<BranchIdChainSerialized, MappingContext<U>>,
  branchIdChain: BranchId[]
): MappingContext<U> | undefined => {
  for (let i = branchIdChain.length - 1; i > 0; i--) {
    const prevContext = contextByBranchIdChain.get(BranchIdChainSerialized(branchIdChain.slice(0, i)))
    if (prevContext) return prevContext
  }
}

const buildBranchNodeChain = async <T extends NodeOnPath, U extends CallbackGenerated>(
  context: MappingContext<U>,
  nodes: Map<NodeId, Node<U>>,
  createNodeCallback: CallbackFn<T, U>,
  found: [T, PointInPathchain][],
  pathDirection: PathDirection
) => {
  const foundOrderByPosition = [...found].sort(([_na, a], [_nb, b]) => a.pointInPath.distance() - b.pointInPath.distance())
  if (pathDirection === 'backward') foundOrderByPosition.reverse()

  for (const [node, pointInPathChain] of foundOrderByPosition) {
    const nodeAttributes = await createNodeCallback(node, pointInPathChain)
    const existingNode = nodes.get(nodeAttributes.id)
    const currentNode = existingNode ?
      existingNode :
      {arcs: [], ...nodeAttributes}
    const [previousNode] = previousFound(context)

    context.founds.push([currentNode, pointInPathChain])

    if (previousNode) {
      const arc = generateArc(previousNode, currentNode, distanceBetweenPreviousNodes(context))
      connect(previousNode, currentNode, arc)
    }
    nodes.set(currentNode.id, currentNode)
  }
}

const mapping = async <T extends NodeOnPath, U extends CallbackGenerated, G>(
  from: VisitFn,
  createNodeCallback: CallbackFn<T, U>,
  groupIdCallback: GroupIdCallbackFn<T, G>,
  pointInPathchains: [T, PointInPathchain][],
  options?: MappingOption
): Promise<Map<G, Node<U>[]>> => {
  const contextsByGroup = new Map<G, Map<BranchIdChainSerialized, MappingContext<U>>>()
  const nodesByGroup = new Map<G, Map<NodeId, Node<U>>>()
  const groupIds = new Set(pointInPathchains.map(([p]) => groupIdCallback(p)))

  await pathChainWalk(from, async (current, branchIdChain) => {
    const currentBranchId = branchIdChain.at(-1)
    if (!currentBranchId) return
    if (options?.currentPathchainChanged) await options.currentPathchainChanged(current.pathChain)

    for (const groupId of groupIds) {
      const contextByBranchIdChain = contextsByGroup.get(groupId) ?? new Map<BranchIdChainSerialized, MappingContext<U>>()
      const currentContext: MappingContext<U> = contextByBranchIdChain.get(BranchIdChainSerialized(branchIdChain)) ?? {
        ...createMappingContext(currentBranchId),
        ...(() => {
          const previousContext = findPreviousContextFromBranchIdChain(contextByBranchIdChain, branchIdChain)
          return previousContext ? { previousContext } : {}
        })()
      }

      currentContext.paths.push([current.pathChain.path, current.pathDirection])

      contextByBranchIdChain.set(BranchIdChainSerialized(branchIdChain), currentContext)
      contextsByGroup.set(groupId, contextByBranchIdChain)
    }

    await Promise.all(
      Map.groupBy(
        pointInPathchains
          .filter(([_, pointInPathChain]) => {
            const currentPointPathChain = pointInPathChain.pathchain.deref()
            return currentPointPathChain === current.pathChain
          }),
        ([p]) => groupIdCallback(p)
      ).entries().map(([groupId, found]) => {
        const nodes = nodesByGroup.get(groupId) ?? nodesByGroup.set(groupId, new Map()).get(groupId)!
        const currentContext = contextsByGroup.get(groupId)?.get(BranchIdChainSerialized(branchIdChain))
        if (currentContext) {
          return buildBranchNodeChain(currentContext, nodes, createNodeCallback, found, current.pathDirection)
        }
      })
    )
  })

  return new Map(nodesByGroup.entries().map(([groupId, nodes]) => {
    return [groupId, Array.from(nodes.values())]
  }))
}
