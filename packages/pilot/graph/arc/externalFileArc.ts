import type { ArcGenerator } from "../arcGenerator"
import type { GraphNode, NodeId } from "../graph"

export type NodeRepositoryGetter = (id: NodeId) => Promise<GraphNode | undefined>

export const buildRepositoryArc = <N extends GraphNode>(
  getFromRepository: NodeRepositoryGetter,
): ArcGenerator<N> => (a, b, cost) => {
  const getter = async (id: NodeId) => {
    const fromRepo = await getFromRepository(id)

    if (!fromRepo) {
      throw new Error(`Node is not found (id: ${id})`)
    }

    return fromRepo
  }

  return {
    a: () => getter(a.id),
    b: () => getter(b.id),
    cost
  }
}
