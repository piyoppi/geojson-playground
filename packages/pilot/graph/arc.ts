import type { GraphNode } from "./graph"

export interface Arc<T> {
  cost: number
  a: () => Promise<GraphNode<T> | undefined>
  b: () => Promise<GraphNode<T> | undefined>
}

export const buildWeakRefArc = <T>(
  a: GraphNode<T>, 
  b: GraphNode<T>, 
  cost: number
): Arc<T> => {
  const aRef = new WeakRef(a)
  const bRef = new WeakRef(b)

  return {
    a: () => Promise.resolve(aRef.deref()),
    b: () => Promise.resolve(bRef.deref()),
    cost
  }
}
