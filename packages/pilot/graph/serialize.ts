import { type GraphNode, type Arc, generateArc, connect, nodeIdToString, hexStringToNodeId } from './graph.js'

export type SerializedGraphNode = {
  id: string
} & Record<string, string | number | boolean | string[] | number[] | boolean[]>

export type SerializedArc = {
  aNodeId: string,
  bNodeId: string,
  arcCost: string
}

const serializeGraphNode = <G extends GraphNode, S>(node: G): S => {
  const copied = { ...node, id: nodeIdToString(node.id), arcs: undefined }

  return copied
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

export const serialize = <G extends GraphNode, S extends Record<string, string | number | boolean | string[] | number[] | boolean[]>>(
  nodes: G[],
  serializeNode: (node: G) => GraphNode
): { nodes: S[], arcs: SerializedArc[] } => {
  const serializedNodes: S[] = []
  const serializedArcs: SerializedArc[] = []
  const processedArcs = new Set<Arc>()
  
  for (const node of nodes) {
    serializedNodes.push(serializeGraphNode(serializeNode(node)))
    
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

export const deserialize = <N extends SerializedGraphNode, G>(
  serialized: { nodes: N[], arcs: SerializedArc[] },
  deserializeNode: (serializeNode: N) => G
): (GraphNode & G)[] => {
  const nodeMap = new Map<string, GraphNode & G>()
  
  for (const serializedNode of serialized.nodes) {
    nodeMap.set(serializedNode.id, {
      ...deserializeNode(serializedNode),
      id: hexStringToNodeId(serializedNode.id),
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
