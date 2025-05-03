import type { Arc } from "./arc"
import type { GraphNode } from "./graph"

export type ArcGenerator<I> = (aNode: GraphNode<I>, bNode: GraphNode<I>, cost: number) => Arc<I>
