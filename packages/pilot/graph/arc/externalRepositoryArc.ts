import type { ArcGenerator } from "../arcGenerator"
import type { GraphNode, NodeId } from "../graph"

export type PartitionedRepository<I> = {
  register: (node: GraphNode<I>, partitionKey: string) => Promise<void>,
  get: (id: NodeId, partitionKey: string) => Promise<GraphNode<I> | undefined>
}

export type NodeRepositoryGetter<I> = (id: NodeId, partitionKey: string) => Promise<I | undefined>

export const buildRepositoryArcGenerator = <I>(
  getFromRepository: NodeRepositoryGetter<GraphNode<I>>,
  partitionKeyGetter: (node: GraphNode<I>) => string
): ArcGenerator<I> => (a, b, cost) => {
  const getter = async (id: NodeId, partitionKey: string) => {
    const fromRepo = await getFromRepository(id, partitionKey)

    if (!fromRepo) {
      throw new Error(`Node is not found (id: ${id})`)
    }

    return fromRepo
  }

  return {
    a: () => getter(a.id, partitionKeyGetter(a)),
    b: () => getter(b.id, partitionKeyGetter(b)),
    cost
  }
}

export const buildRepository = <I>(
  fetchNodes: (partitionKey: string) => Promise<GraphNode<I>[]>,
  storeNodes: (partitionKey: string, nodes: GraphNode<I>[]) => Promise<void>
) => {
  const repositoryByPartition = new Map<string, Map<NodeId, GraphNode<I>>>

  const getPartitionByRepository = (partitionKey: string) => repositoryByPartition.get(partitionKey) || (() => {
    const partition = new Map<NodeId, GraphNode<I>>()
    repositoryByPartition.set(partitionKey, partition)

    return partition
  })()

  return {
    register(node: GraphNode<I>, partitionKey: string) {
      getPartitionByRepository(partitionKey).set(node.id, node)
      return Promise.resolve()
    },
    get: async (id: NodeId, partitionKey: string) => {
      const inMemoryItem = repositoryByPartition.get(partitionKey)?.get(id)

      if (inMemoryItem) return inMemoryItem

      const nodes = await fetchNodes(partitionKey)

      const repository = getPartitionByRepository(partitionKey)

      for (const node of nodes) {
        repository.set(node.id, node)
      }

      return repository.get(id)
    },
    store: async () => {
      for (const [partitionKey, repository] of repositoryByPartition.entries()) {
        storeNodes(partitionKey, repository.values().toArray())
      }
    }
  }
}
