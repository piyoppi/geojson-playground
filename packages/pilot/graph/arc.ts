import type { ArcGenerator } from "./arcGenerator"
import type { GraphNode } from "./graph"

export interface Arc<T> {
  cost: number
  a: () => Promise<GraphNode<T> | undefined>
  b: () => Promise<GraphNode<T> | undefined>
}

export const buildWeakRefArc: ArcGenerator<GraphNode<unknown>> = (a, b, cost) => {
  const aRef = new WeakRef(a)
  const bRef = new WeakRef(b)

  return {
    a: () => Promise.resolve(aRef.deref()),
    b: () => Promise.resolve(bRef.deref()),
    cost
  }
}
