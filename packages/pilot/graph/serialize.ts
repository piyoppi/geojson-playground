import { GraphNode, Arc, generateArc, connect } from './graph.js'

export type SerializedGraphNode = {
  id: string
} & Record<string, unknown>

export type SerializedArc = {
  aNodeId: string,
  bNodeId: string,
  arcCost: string
}

export const serialize = <G extends GraphNode>(nodes: G[]): { nodes: (SerializedGraphNode & Omit<G, 'arcs'>)[], arcs: SerializedArc[] } => {
  const serializedNodes: (SerializedGraphNode & Omit<G, 'arcs'>)[] = []
  const serializedArcs: SerializedArc[] = []
  const processedArcs = new Set<Arc>()
  
  for (const node of nodes) {
    serializedNodes.push(serializeGraphNode(node))
    
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
    nodes: serializedNodes,
    arcs: serializedArcs
  }
}

const serializeGraphNode = <G extends GraphNode>(node: G): SerializedGraphNode & Omit<G, 'arcs'> => {
  const copied = { ...node, arcs: undefined }

  return copied
}

const serializeArc = (arc: Arc): SerializedArc | undefined => {
  const nodeA = arc.a.deref()
  const nodeB = arc.b.deref()
  
  if (!nodeA || !nodeB) {
    return undefined
  }
  
  return {
    aNodeId: nodeA.id,
    bNodeId: nodeB.id,
    arcCost: arc.cost.toString()
  }
}

export const deserialize = <N extends SerializedGraphNode>(serialized: { nodes: N[], arcs: SerializedArc[] }): (GraphNode & N)[] => {
  const nodeMap = new Map<string, GraphNode & N>()
  
  for (const serializedNode of serialized.nodes) {
    nodeMap.set(serializedNode.id, {
      ...serializedNode,
      arcs: []
    })
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
