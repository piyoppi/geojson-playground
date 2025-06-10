import { connect, type NodeId, type GraphNode } from "../graph.js"
import { pathChainWalk, type BranchId } from "../../geometry/path/walk.js"
import {
  findPointOnPathChain,
  distanceBetweenVisitedPointOnPathChain,
  type IsolatedPathChain,
  type VisitFn,
  type VisitFnGenerator,
  type PathChain,
  type PointOnPathchain,
  PathChainVisited
} from "../../geometry/path/pathchain.js"
import type { Position2D } from "../../geometry/index.js"
import type { ArcGenerator } from "../arc/index.js"

type Point = { position: Position2D }
type CreateNodeCallbackFn<T, I> = (item: T, found: PointOnPathchain) => Promise<[NodeId, I]>
type CreateJunctionCallbackFn<J> = (position: Position2D) => Promise<[NodeId, J]>
type GroupIdCallbackFn<T, G> = (node: T) => G
type MappingContext<I, J> = {
  previousContext?: MappingContext<I, J>
  visitedPaths: PathChainVisited[]
  founds: [GraphNode<I | J>, PointOnPathchain][]
  branchId: BranchId
}
type BranchIdChainSerialized = string & { readonly __brand: unique symbol }
const BranchIdChainSerialized = (branchIdChain: BranchId[]): BranchIdChainSerialized => branchIdChain.join('-') as BranchIdChainSerialized

/**
 * Options for controlling the path chain mapping process.
 * @property {(pathchain: PathChain) => Promise<void>} currentPathchainChanged - Callback when the current pathchain changes
 */
export type MappingOption = {
  currentPathchainChanged?: (pathchain: PathChain) => Promise<void>
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
export const buildGraphBuilder = <IG, JG>(
  generateArc: ArcGenerator<IG | JG>,
  options?: MappingOption
) => async <T extends Point, G, I extends IG, J extends JG>(
  points: T[],
  pathChains: IsolatedPathChain,
  getFrom: VisitFnGenerator,
  createNodeCallback: CreateNodeCallbackFn<T, I>,
  createJunctionNodeCallback: CreateJunctionCallbackFn<J>,
  groupIdCallback: GroupIdCallbackFn<T, G>,
): Promise<Map<G, GraphNode<I | J>[]>> => {
  const getPointOnPathChain = findPointOnPathChain(pathChains)
  const pointPathChainPairs = points
    .map(n => [n, getPointOnPathChain(n.position)] as const)
    .flatMap(([n, p]) => n && p ? [{point: n, pointOnPathChain: p}] : [])

  const start = await findFirstPath(getFrom(), pointPathChainPairs.map(({ pointOnPathChain }) => pointOnPathChain))
  if (!start) return new Map()

  const contextsByGroup = new Map<G, Map<BranchIdChainSerialized, MappingContext<I, J>>>()
  const nodesByGroup = new Map<G, Map<NodeId, GraphNode<I | J>>>()
  const groupIds = new Set(pointPathChainPairs.map(({ point }) => groupIdCallback(point)))

  await pathChainWalk(start(), async (current, branchIdChain, isNewBranch) => {
    const currentBranchId = branchIdChain.at(-1)
    if (!currentBranchId) return
    if (options?.currentPathchainChanged) await options.currentPathchainChanged(current.pathChain)

    // Prepare context
    // -----------------------------
    for (const groupId of groupIds) {
      const contextByBranchIdChain = contextsByGroup.get(groupId) ?? new Map<BranchIdChainSerialized, MappingContext<I, J>>()
      const currentContext: MappingContext<I, J> = contextByBranchIdChain.get(BranchIdChainSerialized(branchIdChain)) ??
        {
          founds: [],
          visitedPaths: [],
          branchId: currentBranchId,
          ...(() => {
            const previousContext = findPreviousContextFromBranchIdChain(contextByBranchIdChain, branchIdChain)
            return previousContext ? { previousContext } : {}
          })()
        }

      currentContext.visitedPaths.push(current)

      contextByBranchIdChain.set(BranchIdChainSerialized(branchIdChain), currentContext)
      contextsByGroup.set(groupId, contextByBranchIdChain)
    }

    await Promise.all(
      Map.groupBy(
        pointPathChainPairs.filter(({ pointOnPathChain }) => pointOnPathChain.targetPathChain.deref() === current.pathChain),
        ({ point }) => groupIdCallback(point)
      ).entries().map(async ([groupId, pointPathChainPair]) => {
        const currentContext = contextsByGroup.get(groupId)?.get(BranchIdChainSerialized(branchIdChain))
        if (!currentContext) return

        // Ordered: [start, ..., end]
        // -----------------------------
        const orderedPointPathChainPair = [...pointPathChainPair]
          .sort(({pointOnPathChain: a}, {pointOnPathChain: b}) => a.pointOnPath.distance() - b.pointOnPath.distance())
        if (current.pathDirection === 'backward') orderedPointPathChainPair.reverse()

        let [previousNode] = previousFound(currentContext)
        const nodes = nodesByGroup.get(groupId) ?? nodesByGroup.set(groupId, new Map()).get(groupId)!

        // Create / Connect junction
        // -----------------------------
        if (isNewBranch) {
          const position = current.pathChain.path.at(0)
          const pointOnPathChain = position && getPointOnPathChain(position)
          const previousContext = findPreviousContexts(currentContext)[0]

          if (position && pointOnPathChain && previousContext && previousNode) {
            const [junctionId, junctionAttributes] = await createJunctionNodeCallback(position)
            if (!nodes.has(junctionId)) {
              const junctionNode = {id: junctionId, arcs: [], item: junctionAttributes}
              previousContext.founds.push([junctionNode, pointOnPathChain])

              connect(previousNode, junctionNode, generateArc(previousNode, junctionNode, distanceBetweenNodes(previousContext)))

              nodes.set(junctionId, junctionNode)

              previousNode = junctionNode
            }
          }
        }

        // Connect previous nodes
        // -----------------------------
        for (const {point, pointOnPathChain} of orderedPointPathChainPair) {
          const [id, nodeAttributes] = await createNodeCallback(point, pointOnPathChain)
          const currentNode: GraphNode<I | J> = nodes.get(id) || {id, arcs: [], item: nodeAttributes}

          currentContext.founds.push([currentNode, pointOnPathChain])

          if (previousNode) {
            connect(previousNode, currentNode, generateArc(previousNode, currentNode, distanceBetweenNodes(currentContext)))
          }

          nodes.set(currentNode.id, currentNode)
        }
      })
    )
  })

  return new Map(
    nodesByGroup
      .entries()
      .map(([groupId, nodes]) => [groupId, Array.from(nodes.values())])
  )
}


const distanceBetweenNodes = <I, J>(ctx: MappingContext<I, J>, [to, from] = [0, 1]) => {
  const contexts = [ctx, ...findPreviousContexts(ctx)]
  const founds = contexts.map(c => c.founds.toReversed()).flat()
  const [_fromNode, fromPointInPathchain] = founds[from] ?? [undefined, undefined]
  const [_toNode, toPointInPathchain] = to >= 0 ? founds[to] : [undefined, undefined]

  if (!fromPointInPathchain) return 0

  return distanceBetweenVisitedPointOnPathChain(contexts.map(c => c.visitedPaths).flat().toReversed(), fromPointInPathchain, toPointInPathchain)
}

const findPreviousContexts = <I, J>(ctx: MappingContext<I, J>) => {
  const previousContexts: MappingContext<I, J>[] = []
  let current: MappingContext<I, J> | undefined = ctx.previousContext
  while (current) {
    previousContexts.push(current)
    if (current.founds.length > 0) {
      return previousContexts
    }
    current = current.previousContext
  }

  return []
}

const previousFound = <I, J>(ctx: MappingContext<I, J>) => {
  let current: MappingContext<I, J> | undefined = ctx
  while (current) {
    const found = current.founds.at(-1)
    if (found) return found
    current = current.previousContext
  }

  return [undefined, undefined] as const
}

const findPreviousContextFromBranchIdChain = <I, J>(
  contextByBranchIdChain: Map<BranchIdChainSerialized, MappingContext<I, J>>,
  branchIdChain: BranchId[]
): MappingContext<I, J> | undefined => {
  for (let i = branchIdChain.length - 1; i > 0; i--) {
    const prevContext = contextByBranchIdChain.get(BranchIdChainSerialized(branchIdChain.slice(0, i)))
    if (prevContext) return prevContext
  }
}

const findFirstPath = async (
  from: VisitFn,
  pointInPathchains: PointOnPathchain[],
) => {
  const result = await pathChainWalk(from, async (current) => {
    const result = pointInPathchains
      .filter((pointInPathChain) => {
        const currentPointPathChain = pointInPathChain.targetPathChain.deref()
        return currentPointPathChain === current.pathChain
      }).at(0)

    if (result) {
      return { stopBranch: true, returned: current.pathChain.from }
    }
  })

  return result.at(0) ?? null
}
