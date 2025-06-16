import type { Arc } from './arc/index.js'
import { buildWeakRefArcDeserializer } from './arc/weakRefArc.js'
import { type GraphNode, nodeIdToString, NodeId, setArc } from './graph.js'

export type SerializedGraphNode = {
  id: string
} & Record<string, string | number | boolean | string[] | number[] | boolean[]>

export type SerializedArc = {
  aNodeId: string,
  bNodeId: string,
  arcCost: string
} & Record<string, unknown>

export type ArcDeserializer<I> = (
  serialized: SerializedArc,
  resolvedCallback: (arc: Arc<I>, node: GraphNode<I>) => void,
) => Promise<Arc<I> | undefined>

export const serialize = async <I>(
  nodes: GraphNode<I>[]
): Promise<{ arcs: SerializedArc[] }> => {
  const serializedArcs: SerializedArc[] = []
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
  }
  
  return {
    arcs: serializedArcs
  }
}

type DeserializeGraphContext<I> = {
  getResolvedNode: (id: NodeId) => GraphNode<I> | undefined
}

export type GraphDeserializer<I> = ReturnType<typeof buildGraphDeserializer<I>>
export const buildGraphDeserializer = <I>(
  buildDeserializeArc: (ctx: DeserializeGraphContext<I>) => ArcDeserializer<I>
) => async <InputItems extends {id: NodeId}>(
  items: InputItems[],
  serialized: { arcs: SerializedArc[] },
  generateNode: (item: InputItems, id: string) => GraphNode<I>
): Promise<GraphNode<I>[]> => {
  const resolvedNodeMap = new Map<string, GraphNode<I>>()
  const getResolvedNode = (nodeId: NodeId) => resolvedNodeMap.get(nodeId)
  for (const item of items) {
    const stringId = nodeIdToString(item.id)
    resolvedNodeMap.set(stringId, generateNode(item, stringId))
  }
  
  const weakRefArcDeserializer = buildWeakRefArcDeserializer(getResolvedNode)
  const arcResolvedHandler = <IH>(arc: Arc<IH>, node: GraphNode<IH>) => setArc(node, arc)
  const deserializeArc = buildDeserializeArc({ getResolvedNode })

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
