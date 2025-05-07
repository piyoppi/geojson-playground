import type { GraphNode } from "../graph.js"

export interface Arc<T> {
  cost: number
  a: () => Promise<GraphNode<T> | undefined>
  b: () => Promise<GraphNode<T> | undefined>
}

export type ArcGenerator<I> = (aNode: GraphNode<I>, bNode: GraphNode<I>, cost: number) => Arc<I>
