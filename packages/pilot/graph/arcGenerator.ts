import type { Arc } from "./arc.js"
import type { GraphNode } from "./graph.js"

export type ArcGenerator<I> = (aNode: GraphNode<I>, bNode: GraphNode<I>, cost: number) => Arc<I>
