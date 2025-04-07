import type { Position2D } from "../geometry"
import { findPointInPathChain, IsolatedPathChain, PathDirection, VisitFn, type PathChain, type PointInPathchain } from "../pathchain"
import { BranchId, pathChainWalk } from "../walk"
import { pathLength } from "../path"
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
  currentNode?: Node<U>
  beforeContext?: MappingContext<U>
  currentDistance: number
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

const findPreviousNode = <U extends CallbackGenerated>(ctx: MappingContext<U>) => {
  let current: MappingContext<U> | undefined = ctx
  let distance = 0
  while (current) {
    if (current.currentNode) {
      return {
        node: current.currentNode,
        distance: current.currentDistance + distance
      }
    }
    current = current.beforeContext
    distance += current?.currentDistance ?? 0
  }
}

const createMappingContext = <U extends CallbackGenerated>(): MappingContext<U> => ({
  currentDistance: 0
})

const findPreviousContext = <U extends CallbackGenerated>(
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
  const foundOrderByPosition = found.sort(([_na, a], [_nb, b]) => a.pointInPath.distance() - b.pointInPath.distance())

  if (pathDirection === 'backward') foundOrderByPosition.reverse()

  for (const [node, pointInPathChain] of foundOrderByPosition) {
    const nodeAttributes = await createNodeCallback(node, pointInPathChain)
    const previousNode = findPreviousNode(context)
    const existingNode = nodes.get(nodeAttributes.id)
    const currentNode = existingNode ?
      existingNode :
      {arcs: [], ...nodeAttributes}

    if (previousNode) {
      const arc = generateArc(previousNode.node, currentNode, previousNode.distance)
      connect(previousNode.node, currentNode, arc)
    }

    context.currentNode = currentNode
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
  const groupIds = pointInPathchains.map(([p]) => groupIdCallback(p))

  await pathChainWalk(from, async (current, branchIdChain) => {
    if (options?.currentPathchainChanged) await options.currentPathchainChanged(current.pathChain)

    const currentPathLength = pathLength(current.pathChain.path)

    for (const groupId of groupIds) {
      const contextByBranchIdChain = contextsByGroup.get(groupId) ?? new Map<BranchIdChainSerialized, MappingContext<U>>()
      const currentContext: MappingContext<U> = contextByBranchIdChain.get(BranchIdChainSerialized(branchIdChain)) ?? {
        ...createMappingContext(),
        ...(() => {
          const previousContext = findPreviousContext(contextByBranchIdChain, branchIdChain)
          return previousContext ? {
            beforeContext: previousContext
          } : {}
        })()
      }

      currentContext.currentDistance += currentPathLength

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
        const nodes = nodesByGroup.get(groupId) ?? new Map()
        const currentContext = contextsByGroup.get(groupId)?.get(BranchIdChainSerialized(branchIdChain))
        if (currentContext) {
          buildBranchNodeChain(currentContext, nodes, createNodeCallback, found, current.pathDirection)
        }
        nodesByGroup.set(groupId, nodes)
      })
    )
  })

  return new Map(nodesByGroup.entries().map(([groupId, nodes]) => {
    return [groupId, Array.from(nodes.values())]
  }))
}
