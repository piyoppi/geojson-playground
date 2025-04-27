import { type GraphNode, type Arc, generateArc, connect, nodeIdToString, hexStringToNodeId, NodeId } from './graph.js'

export type SerializedGraphNode = {
  id: string
} & Record<string, string | number | boolean | string[] | number[] | boolean[]>

export type SerializedArc = {
  aNodeId: string,
  bNodeId: string,
  arcCost: string
}

export const serialize = <G extends GraphNode>(
  nodes: G[]
): { arcs: SerializedArc[] } => {
  const serializedArcs: SerializedArc[] = []
  const processedArcs = new Set<Arc>()
  
  for (const node of nodes) {
    
    for (const arc of node.arcs) {
      if (!processedArcs.has(arc)) {
        const serializedArc = serializeArc(arc)
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

export const deserialize = <InputItems extends {id: NodeId}, G extends GraphNode>(
  items: InputItems[],
  serialized: { arcs: SerializedArc[] },
  graphGenerator: (node: InputItems, id: string) => G
): G[] => {
  const nodeMap = new Map<string, G>()
  
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

const serializeArc = (arc: Arc): SerializedArc | undefined => {
  const nodeA = arc.a.deref()
  const nodeB = arc.b.deref()
  
  if (!nodeA || !nodeB) {
    return undefined
  }
  
  return {
    aNodeId: nodeIdToString(nodeA.id),
    bNodeId: nodeIdToString(nodeB.id),
    arcCost: arc.cost.toString()
  }
}
