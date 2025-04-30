import type { ArcGenerator } from "./arcGenerator"
import type { GraphNode } from "./graph"

export interface Arc {
  cost: number
  a: () => Promise<GraphNode | undefined>
  b: () => Promise<GraphNode | undefined>
}

export const buildWeakRefArc: ArcGenerator<GraphNode> = (a, b, cost) => {
  const aRef = new WeakRef(a)
  const bRef = new WeakRef(b)

  return {
    a: () => Promise.resolve(aRef.deref()),
    b: () => Promise.resolve(bRef.deref()),
    cost
  }
}
