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
  const from = arc.a?.deref()

  if (fromNode !== from && from) return from as T

  const to = arc.b.deref()

  if (fromNode !== to && to) return to as T

  return null
}
