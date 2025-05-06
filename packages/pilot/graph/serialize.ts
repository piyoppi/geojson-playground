import type { Arc } from './arc.js'
import { type GraphNode, connect, nodeIdToString, NodeId } from './graph.js'

export type SerializedGraphNode = {
  id: string
} & Record<string, string | number | boolean | string[] | number[] | boolean[]>

export type SerializedArc = {
  aNodeId: string,
  bNodeId: string,
  arcCost: string
}

export type ArcDeserializer<I> = (serialized: SerializedArc, aNode: GraphNode<I>, bNode: GraphNode<I>) => Arc<I> | undefined

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

export type GraphDeserializer<IG> = ReturnType<typeof buildGraphDeserializer<IG>>
export const buildGraphDeserializer = <IG>(
  deserializeArc: ArcDeserializer<IG>
) => <InputItems extends {id: NodeId}, I extends IG>(
  items: InputItems[],
  serialized: { arcs: SerializedArc[] },
  graphGenerator: (node: InputItems, id: string) => GraphNode<I>
): GraphNode<I>[] => {
  const nodeMap = new Map<string, GraphNode<I>>()
  
  for (const item of items) {
    const stringId = nodeIdToString(item.id)
    nodeMap.set(stringId, graphGenerator(item, stringId))
  }
  
  for (const serializedArc of serialized.arcs) {
    const nodeA = nodeMap.get(serializedArc.aNodeId)
    const nodeB = nodeMap.get(serializedArc.bNodeId)
    
    if (!nodeA || !nodeB) {
      continue
    }
    
    const arc = deserializeArc(serializedArc, nodeA, nodeB)
    if (!arc) {
      throw new Error(`Arc deserialization failed for nodes: ${nodeA.id}, ${nodeB.id}`)
    }

    connect(nodeA, nodeB, arc)
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
