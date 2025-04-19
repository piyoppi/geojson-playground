import { GraphNode, Arc, generateArc, connect } from './graph'

type SerializedGraphNode = {
  nodeId: string
  [key: string]: unknown
}

type SerializedArc = {
  aNodeId: string,
  bNodeId: string,
  arcCost: string
}

export const serializeGraph = <G extends GraphNode>(nodes: G[]): { nodes: SerializedGraphNode[], arcs: SerializedArc[] } => {
  const serializedNodes: SerializedGraphNode[] = []
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

const serializeGraphNode = (node: GraphNode): SerializedGraphNode => {
  return {
    nodeId: node.id,
  }
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

export const deserializeGraph = (serialized: { nodes: SerializedGraphNode[], arcs: SerializedArc[] }): GraphNode[] => {
  const nodeMap = new Map<string, GraphNode>()
  
  for (const serializedNode of serialized.nodes) {
    nodeMap.set(serializedNode.nodeId, {
      id: serializedNode.nodeId,
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
