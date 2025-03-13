export type GraphNode = {
  arcs: Arc[]
}

export type Arc = {
  cost: number,
  a: WeakRef<GraphNode>
  b: WeakRef<GraphNode>,
}

export const generateNode = (): GraphNode => ({
  arcs: []
})

export const generateArc = (a: GraphNode, b: GraphNode, cost: number): Arc => ({
  cost: cost,
  a: new WeakRef(a),
  b: new WeakRef(b),
})

export const to = <T extends GraphNode>(fromNode: T, arc: Arc): T | null => {
  const nodeA = arc.a?.deref()
  const nodeB = arc.b.deref()

  if (fromNode !== nodeA && nodeB === fromNode) return nodeA as T
  if (fromNode !== nodeB && nodeA === fromNode) return nodeB as T

  return null
}

export const arcExists = (a: GraphNode, b: GraphNode): boolean => {
  return a.arcs.some(arc => {
    const nodeA = arc.a.deref()
    const nodeB = arc.b.deref()
    return (nodeA === a && nodeB === b) || (nodeA === b && nodeB === a)
  })
}
