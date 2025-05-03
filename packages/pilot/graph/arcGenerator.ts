import type { Arc } from "./arc"

export type ArcGenerator<T> = (aNode: T, bNode: T, cost: number) => Arc
