import type { Arc } from './arc/index.js'
import { buildWeakRefArcDeserializer } from './arc/weakRefArc.js'
import { type GraphNode, nodeIdToString, NodeId, setArc, createNode, stringToNodeId } from './graph.js'

export type SerializedGraphNode<T> = {
  id: string
  item: T
}

export type SerializedArc = {
  aNodeId: string,
  bNodeId: string,
  arcCost: string
} & Record<string, unknown>

export type SerializedGraph<T> = {
  nodes: SerializedGraphNode<T>[],
  arcs: SerializedArc[]
}

export type ArcDeserializer<I> = (
  serialized: SerializedArc,
  resolvedCallback: (arc: Arc<I>, node: GraphNode<I>) => void,
) => Promise<Arc<I> | undefined>

export const serialize = async <I, T>(
  nodes: GraphNode<I>[],
  serializeItem: (item: I) => T
): Promise<SerializedGraph<T>> => {
  const serializedArcs: SerializedArc[] = []
  const serializedNodes: SerializedGraphNode<T>[] = []
  const processedArcs = new Set<Arc<I>>()

  for (const node of nodes) {
    for (const arc of node.arcs) {
      if (!processedArcs.has(arc)) {
        const serializedArc = await serializeArc(arc)
        if (serializedArc) {
          serializedArcs.push(serializedArc)
          processedArcs.add(arc)
        }
      }
    }

    serializedNodes.push({
      id: node.id,
      item: serializeItem(node.item)
    })
  }

  return {
    nodes: serializedNodes,
    arcs: serializedArcs
  }
}

type DeserializeArcContext<I> = {
  getResolvedNode: (id: NodeId) => GraphNode<I> | undefined
}

export type GraphDeserializer<I> = ReturnType<typeof buildGraphDeserializer<I>>
export const buildGraphDeserializer = <I>(
  buildArcDeserializer: (ctx: DeserializeArcContext<I>) => ArcDeserializer<I>
) => async <T>(
  serialized: SerializedGraph<T>,
  deserialieItem: (serializedItem: T) => I
): Promise<GraphNode<I>[]> => {
  const resolvedNodeMap = new Map<string, GraphNode<I>>()
  const getResolvedNode = (nodeId: NodeId) => resolvedNodeMap.get(nodeId)
  for (const serializedNode of serialized.nodes) {
    const stringId = nodeIdToString(serializedNode.id)
    const item = deserialieItem(serializedNode.item)
    resolvedNodeMap.set(stringId, createNode(stringToNodeId(stringId), item))
  }

  const weakRefArcDeserializer = buildWeakRefArcDeserializer(getResolvedNode)
  const arcResolvedHandler = <IH>(arc: Arc<IH>, node: GraphNode<IH>) => setArc(node, arc)
  const deserializeArc = buildArcDeserializer({ getResolvedNode })

  for (const serializedArc of serialized.arcs) {
    const arc =
      (await deserializeArc(serializedArc, arcResolvedHandler)) ||
      (await weakRefArcDeserializer(serializedArc, arcResolvedHandler))

    if (!arc) {
      throw new Error(`Arc deserialization failed for nodes`)
    }
  }

  return Array.from(resolvedNodeMap.values())
}

const serializeArc = async <I>(arc: Arc<I>): Promise<SerializedArc | undefined> => {
  const [nodeA, nodeB] = await Promise.all([arc.a(), arc.b()])

  if (!nodeA || !nodeB) {
    return undefined
  }

  return {
    ...arc,
    aNodeId: nodeIdToString(nodeA.id),
    bNodeId: nodeIdToString(nodeB.id),
    arcCost: arc.cost.toString()
  }
}
