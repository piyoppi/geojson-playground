import { connect, type NodeId, type GraphNode } from "./graph.js"
import { pathLength, type Path } from "../path.js"
import { pathChainWalk, type BranchId } from "../walk.js"
import {
  findPointInPathChain,
  type IsolatedPathChain,
  type PathDirection,
  type VisitFn,
  type VisitFnGenerator,
  type PathChain,
  type PointInPathchain
} from "../pathchain.js"
import type { Position2D } from "../geometry"
import type { ArcGenerator } from "./arcGenerator"

type NodeOnPath = {
  position: Position2D,
}

type CreateNodeCallbackFn<T, I> = (item: T, found: PointInPathchain) => Promise<[NodeId, I]>

type GroupIdCallbackFn<T, G> = (node: T) => G

type MappingContext<I> = {
  previousContext?: MappingContext<I>
  paths: [Path, PathDirection][]
  founds: [GraphNode<I>, PointInPathchain][]
  branchId: BranchId
}

type BranchIdChainSerialized = string & { readonly __brand: unique symbol }
const BranchIdChainSerialized = (branchIdChain: BranchId[]): BranchIdChainSerialized => branchIdChain.join('-') as BranchIdChainSerialized

/**
 * Options for controlling the path chain mapping process.
 * @property {(pathchain: PathChain) => Promise<void>} currentPathchainChanged - Callback when the current pathchain changes
 * @property {number} maxDistance - Maximum distance to traverse before stopping a branch
 */
export type MappingOption = {
  currentPathchainChanged?: (pathchain: PathChain) => Promise<void>
  maxDistance?: number
}

/**
 * Creates a graph from a path chain by mapping points to nodes on paths.
 * 
 * @template T - Type of node with position data
 * @template U - Type of node with generated ID
 * @template G - Type of group identifier
 * 
 * @param point - Array of points to map onto the path chain
 * @param createNodeCallback - Function to create a node from a point and its position in the path chain
 * @param groupIdCallback - Function to determine the group ID for a node
 * @param [options] - Optional mapping configuration
 * 
 * @returns A function that accepts a path chain and visit generator, and returns a map of groups to nodes
 */
export const buildGraphBuilder = <I>(
  arcGenerator: ArcGenerator<I>,
  options?: MappingOption
) => async <T extends NodeOnPath, G>(
  point: T[],
  pathChains: IsolatedPathChain,
  from: VisitFnGenerator,
  createNodeCallback: CreateNodeCallbackFn<T, I>,
  groupIdCallback: GroupIdCallbackFn<T, G>,
): Promise<Map<G, GraphNode<I>[]>> => {
  const pointInPathchains: [T, PointInPathchain][] = point
    .map<[T, PointInPathchain | null]>(n => [n, findPointInPathChain(pathChains)(n.position)])
    .flatMap<[T, PointInPathchain]>(([n, p]) => n && p ? [[n, p]] : [])

  const start = await findFirstPath(from(), pointInPathchains.map(([_, p]) => p))

  if (!start) return new Map()

  return mapping(start(), createNodeCallback, groupIdCallback, pointInPathchains, arcGenerator, options)
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

const distanceBetweenNodes = <N>(ctx: MappingContext<N>, [to, from] = [0, 1]) => {
  const contexts = [ctx, ...findPreviousContexts(ctx)]
  const founds = contexts.map(c => c.founds.toReversed()).flat()
  const [_fromNode, fromPointInPathchain] = founds[from] ?? [undefined, undefined]
  const [_toNode, toPointInPathchain] = to >= 0 ? founds[to] : [undefined, undefined]

  if (!fromPointInPathchain) return 0

  return distance(contexts.map(c => c.paths).flat(), fromPointInPathchain, toPointInPathchain)
}

const findPreviousContexts = <N>(ctx: MappingContext<N>) => {
  const previousContexts: MappingContext<N>[] = []
  let current: MappingContext<N> | undefined = ctx.previousContext
  while (current) {
    previousContexts.push(current)
    if (current.founds.length > 0) {
      return previousContexts
    }
    current = current.previousContext
  }

  return []
}

const previousFound = <N>(ctx: MappingContext<N>) => {
  let current: MappingContext<N> | undefined = ctx
  while (current) {
    const found = current.founds.at(-1)
    if (found) return found
    current = current.previousContext
  }

  return [undefined, undefined] as const
}

const createMappingContext = <N>(branchId: BranchId): MappingContext<N> => ({
  founds: [],
  paths: [],
  branchId,
})

const findPreviousContextFromBranchIdChain = <N>(
  contextByBranchIdChain: Map<BranchIdChainSerialized, MappingContext<N>>,
  branchIdChain: BranchId[]
): MappingContext<N> | undefined => {
  for (let i = branchIdChain.length - 1; i > 0; i--) {
    const prevContext = contextByBranchIdChain.get(BranchIdChainSerialized(branchIdChain.slice(0, i)))
    if (prevContext) return prevContext
  }
}

const branchNodeChainBuilder = <I>(
  generateArc: ArcGenerator<I>
) => async <T extends NodeOnPath>(
  context: MappingContext<I>,
  nodes: Map<NodeId, GraphNode<I>>,
  createNodeCallback: CreateNodeCallbackFn<T, I>,
  found: [T, PointInPathchain][],
  pathDirection: PathDirection
) => {
  const foundOrderByPosition = [...found].sort(([_na, a], [_nb, b]) => a.pointInPath.distance() - b.pointInPath.distance())
  if (pathDirection === 'backward') foundOrderByPosition.reverse()

  for (const [node, pointInPathChain] of foundOrderByPosition) {
    const [id, nodeAttributes] = await createNodeCallback(node, pointInPathChain)
    const existingNode = nodes.get(id)
    const currentNode: GraphNode<I> = existingNode ?
      existingNode :
      {id, arcs: [], item: nodeAttributes}
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

const mapping = async <T extends NodeOnPath, I, G>(
  from: VisitFn,
  createNodeCallback: CreateNodeCallbackFn<T, I>,
  groupIdCallback: GroupIdCallbackFn<T, G>,
  pointInPathchains: [T, PointInPathchain][],
  arcGenerator: ArcGenerator<I>,
  options?: MappingOption
): Promise<Map<G, GraphNode<I>[]>> => {
  const contextsByGroup = new Map<G, Map<BranchIdChainSerialized, MappingContext<I>>>()
  const nodesByGroup = new Map<G, Map<NodeId, GraphNode<I>>>()
  const groupIds = new Set(pointInPathchains.map(([p]) => groupIdCallback(p)))
  const buildBranchNodeChain = branchNodeChainBuilder(arcGenerator)

  await pathChainWalk(from, async (current, branchIdChain) => {
    const currentBranchId = branchIdChain.at(-1)
    if (!currentBranchId) return
    if (options?.currentPathchainChanged) await options.currentPathchainChanged(current.pathChain)

    for (const groupId of groupIds) {
      const contextByBranchIdChain = contextsByGroup.get(groupId) ?? new Map<BranchIdChainSerialized, MappingContext<I>>()
      const currentContext: MappingContext<I> = contextByBranchIdChain.get(BranchIdChainSerialized(branchIdChain)) ?? {
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
