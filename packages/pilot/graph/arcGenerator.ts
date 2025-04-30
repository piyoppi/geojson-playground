import type { Arc } from "./arc"
import type { GraphNode } from "./graph"

export type ArcGenerator<T> = (aNode: T, bNode: T, cost: number) => Arc
