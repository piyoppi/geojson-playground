import type { GraphNode, NodeId } from "./graph.js"
import { ArcDeserializer, SerializedArc } from "./serialize.js"

export interface Arc<T> {
  cost: number
  a: () => Promise<GraphNode<T> | undefined>
  b: () => Promise<GraphNode<T> | undefined>
}

export const buildWeakRefArc = <I>(
  a: GraphNode<I>, 
  b: GraphNode<I>, 
  cost: number
): Arc<I> => {
  const aRef = new WeakRef(a)
  const bRef = new WeakRef(b)

  return {
    a: () => Promise.resolve(aRef.deref()),
    b: () => Promise.resolve(bRef.deref()),
    cost
  }
}

export const buildWeakRefArcDeserializer = <I>(
  nodeGetter: (id: NodeId) => GraphNode<I> | undefined,
): ArcDeserializer<I> => (
  serializedArc,
  resolved
) => {
  const nodeA = nodeGetter(serializedArc.aNodeId)
  const nodeB = nodeGetter(serializedArc.bNodeId)

  if (!nodeA || !nodeB) {
    return undefined
  }

  const arc = buildWeakRefArc(nodeA, nodeB, Number(serializedArc.arcCost))

  resolved(arc, nodeA)
  resolved(arc, nodeB)

  return arc
}
