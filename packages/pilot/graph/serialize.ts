import { buildWeakRefArcDeserializer, type Arc } from './arc.js'
import { type GraphNode, nodeIdToString, NodeId, setArc } from './graph.js'

export type SerializedGraphNode = {
  id: string
} & Record<string, string | number | boolean | string[] | number[] | boolean[]>

export type SerializedArc = {
  aNodeId: string,
  bNodeId: string,
  arcCost: string
}

export type ArcDeserializer<I> = (
  serialized: SerializedArc,
  resolvedNode: (arc: Arc<I>, node: GraphNode<I>) => void,
) => Arc<I> | undefined

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

export type GraphDeserializer<I> = ReturnType<typeof buildGraphDeserializer<I>>
export const buildGraphDeserializer = <I>(
  buildDeserializeArc?: (getter: (id: NodeId) => GraphNode<I> | undefined) => ArcDeserializer<I>
) => <InputItems extends {id: NodeId}>(
  items: InputItems[],
  serialized: { arcs: SerializedArc[] },
  graphGenerator: (node: InputItems, id: string) => GraphNode<I>
): GraphNode<I>[] => {
  const nodeMap = new Map<string, GraphNode<I>>()
  
  for (const item of items) {
    const stringId = nodeIdToString(item.id)
    nodeMap.set(stringId, graphGenerator(item, stringId))
  }
  
  const weakRefArcDeserializer = buildWeakRefArcDeserializer(id => nodeMap.get(id))
  const arcResolvedHandler = <IH>(arc: Arc<IH>, node: GraphNode<IH>) => setArc(node, arc)
  const deserializeArc = buildDeserializeArc && buildDeserializeArc(id => nodeMap.get(id))

  for (const serializedArc of serialized.arcs) {
    const arc = (deserializeArc && deserializeArc(serializedArc, arcResolvedHandler)) ||
      weakRefArcDeserializer(serializedArc, arcResolvedHandler)

    if (!arc) {
      throw new Error(`Arc deserialization failed for nodes`)
    }
  }
  
  return Array.from(nodeMap.values())
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
