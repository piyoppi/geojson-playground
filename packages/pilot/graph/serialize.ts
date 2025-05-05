import type { Arc } from './arc.js'
import { ArcGenerator } from './arcGenerator.js'
import { type GraphNode, connect, nodeIdToString, NodeId } from './graph.js'

export type SerializedGraphNode = {
  id: string
} & Record<string, string | number | boolean | string[] | number[] | boolean[]>

export type SerializedArc = {
  aNodeId: string,
  bNodeId: string,
  arcCost: string
}

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
  generateArc: ArcGenerator<I>
) => <InputItems extends {id: NodeId}, IG extends I>(
  items: InputItems[],
  serialized: { arcs: SerializedArc[] },
  graphGenerator: (node: InputItems, id: string) => GraphNode<IG>
): GraphNode<IG>[] => {
  const nodeMap = new Map<string, GraphNode<IG>>()
  
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
    
    const arcCost = Number(serializedArc.arcCost)

    if (isNaN(arcCost)) {
      continue
    }
    
    const arc = generateArc(nodeA, nodeB, arcCost)
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
