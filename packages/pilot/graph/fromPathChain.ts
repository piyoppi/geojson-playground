import type { Position2D } from "../geometry.js"
import { findPointInPathChain, IsolatedPathChain, PathDirection, VisitFn, VisitFnGenerator, type PathChain, type PointInPathchain } from "../pathchain.js"
import { BranchId, pathChainWalk } from "../walk.js"
import { Path, pathLength } from "../path.js"
import { connect, generateArc, NodeId, type GraphNode } from "./graph.js"

type NodeOnPath = {
  position: Position2D,
}

type CallbackGenerated = {
  id: NodeId
}

type Node<U> = U & GraphNode

type CallbackFn<T, U extends CallbackGenerated> = (node: T, found: PointInPathchain) => Promise<U>

type GroupIdCallbackFn<T, G> = (node: T) => G

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
) => async (pathChains: IsolatedPathChain, from: VisitFnGenerator): Promise<Map<G, (Node<U>)[]>> => {
  const pointInPathchains: [T, PointInPathchain][] = point
    .map<[T, PointInPathchain | null]>(n => [n, findPointInPathChain(pathChains)(n.position)])
    .flatMap<[T, PointInPathchain]>(([n, p]) => n && p ? [[n, p]] : [])

  const start = await findFirstPath(from(), pointInPathchains.map(([_, p]) => p))

  if (!start) return new Map()

  return mapping(start(), createNodeCallback, groupIdCallback, pointInPathchains, options)
}

const distance = (allPaths: [Path, PathDirection][], fromPointInPathchain: PointInPathchain, toPointInPathchain?: PointInPathchain) => {
  const paths = allPaths.slice(
    ...[
      ...(() => toPointInPathchain ? [allPaths.findIndex(([p]) => toPointInPathchain.pathchain.deref()?.path === p)] : [])(),
      allPaths.findIndex(([p]) => fromPointInPathchain.pathchain.deref()?.path === p),
    ].sort()
  )
  const tailLength = toPointInPathchain ? (() => {
    const [path, direction] = paths.at(0) ?? [undefined, undefined]
    return direction === 'forward' ?
      pathLength(path) - toPointInPathchain.pointInPath.distance() :
      toPointInPathchain.pointInPath.distance()
  })() : pathLength(paths[0][0] ?? [])

  const headLength = (() => {
    const [path, direction] = paths.at(-1) ?? [undefined, undefined]
    return direction === 'forward' ?
      pathLength(path) - fromPointInPathchain.pointInPath.distance() :
      fromPointInPathchain.pointInPath.distance()
  })()

  // |<---------------------- Paths ---------------------->|
  // |                                                     |
  // |      Path0       Path1   Path2          Path3       |
  // |<--------------->|<--->|<-------->|<---------------->|
  // |                 :     :          :                  |
  // |     A (from)    :     :          :           B (to) |
  // *-----x-----------*-----*----------*-----------x------*
  //       |<-headLen->|<---- len ----->|<-tailLen->|
  //
  return paths.slice(1, -1).map(([path]) => pathLength(path)).reduce((acc, length) => acc + length, 0) + headLength + tailLength
}

const distanceBetweenNodes = <U extends CallbackGenerated>(ctx: MappingContext<U>, [to, from] = [0, 1]) => {
  const contexts = [ctx, ...findPreviousContexts(ctx)]
  const founds = contexts.map(c => c.founds.toReversed()).flat()
  const [_fromNode, fromPointInPathchain] = founds[from] ?? [undefined, undefined]
  const [_toNode, toPointInPathchain] = to >= 0 ? founds[to] : [undefined, undefined]

  if (!fromPointInPathchain) return 0

  return distance(contexts.map(c => c.paths).flat(), fromPointInPathchain, toPointInPathchain)
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
      const arc = generateArc(previousNode, currentNode, distanceBetweenNodes(context))
      connect(previousNode, currentNode, arc)
    }
    nodes.set(currentNode.id, currentNode)
  }
}

const findFirstPath = async (
  from: VisitFn,
  pointInPathchains: PointInPathchain[],
) => {
  const result = await pathChainWalk(from, async (current) => {
    const result = pointInPathchains
      .filter((pointInPathChain) => {
        const currentPointPathChain = pointInPathChain.pathchain.deref()
        return currentPointPathChain === current.pathChain
      }).at(0)

    if (result) {
      return { stopBranch: true, returned: current.pathChain.from }
    }
  })

  return result.at(0) ?? null
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

      const distance = distanceBetweenNodes(currentContext, [-1, 0])

      if (options?.maxDistance && distance > options?.maxDistance) {
        return { stopBranch: true }
      }
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
