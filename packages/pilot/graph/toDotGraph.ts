import { StationNode } from "../stationGraph"
import type { GraphNode, Arc } from "./graph"

export const toDotGraph = <T extends StationNode>(nodes: T[]): string => {
  const graphType = 'graph'
  const connector = '--'
  
  const nodeIds = new Map<GraphNode, number>()
  nodes.forEach((node, index) => {
    nodeIds.set(node, index)
  })
  
  let dot = `${graphType} G {\n`
  
  nodes.forEach((node, index) => {
    dot += `  ${index} [label="Node ${node.name}"]\n`
  })
  
  const processedArcs = new Set<Arc>()
  
  nodes.forEach(node => {
    node.arcs.forEach(arc => {
      if (!processedArcs.has(arc)) {
        const nodeA = arc.a.deref() as T
        const nodeB = arc.b.deref() as T
        
        if (nodeA && nodeB && nodeIds.has(nodeA) && nodeIds.has(nodeB)) {
          const idA = nodeIds.get(nodeA)
          const idB = nodeIds.get(nodeB)
          dot += `  ${idA} ${connector} ${idB} [label="${arc.cost}"]\n`
        }
        processedArcs.add(arc)
      }
    })
  })
  
  dot += '}'
  return dot
}
