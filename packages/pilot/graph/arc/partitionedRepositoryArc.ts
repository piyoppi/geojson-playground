import { Arc, ArcGenerator } from "./index.js"
import type { GraphNode, NodeId } from "../graph.js"
import type { ArcDeserializer } from "../serialize.js"

export type PartitionedRepositoryArc<I> = Arc<I> & {
  aPk: string,
  bPk: string
}

export type PartitionedRepository<I> = {
  register: (node: GraphNode<I>, partitionKey: string) => Promise<void>,
  get: (id: NodeId, partitionKey: string) => Promise<GraphNode<I> | undefined>
}

export type PartitionedRepositoryGetter<I> = (id: NodeId, partitionKey: string) => Promise<I | undefined>
export type ResolvedNodeGetter<I> = (id: NodeId) => Promise<I | undefined>

export const buildPartitionedRepositoryArcGenerator = <I>(
  getFromRepository: PartitionedRepositoryGetter<GraphNode<I>>,
  partitionKeyGetter: (node: GraphNode<I>) => string
): ArcGenerator<I> => (a, b, cost) => {
  const lazyResolver = async (id: NodeId, partitionKey: string) => {
    const fromRepo = await getFromRepository(id, partitionKey)

    if (!fromRepo) {
      throw new Error(`Node is not found (id: ${id})`)
    }

    return fromRepo
  }

  return {
    a: () => lazyResolver(a.id, partitionKeyGetter(a)),
    b: () => lazyResolver(b.id, partitionKeyGetter(b)),
    aPk: partitionKeyGetter(a),
    bPk: partitionKeyGetter(b),
    cost
  }
}

export const buildPartitionedRepositoryArcDeserializer = <I>(
  getResolvedNode: ResolvedNodeGetter<GraphNode<I>>,
  getNodeFromRepository: PartitionedRepositoryGetter<GraphNode<I>>
): ArcDeserializer<I> => async (
  serializedArc,
  resolvedCallback,
) => {
  if (!('aPk' in serializedArc && 'bPk' in serializedArc)) {
    return undefined
  }

  const aPk = serializedArc.aPk
  const bPk = serializedArc.bPk

  if (typeof aPk !== 'string' || typeof bPk !== 'string') {
    return undefined
  }

  const lazyResolver = async (nodeId: NodeId, pk: string, resolvedCallback: (node: GraphNode<I>) => void) => {
    const initial = await getResolvedNode(nodeId)
    if (initial) {
      resolvedCallback(initial)
    }

    let resolved: GraphNode<I> | undefined = initial
    return async () => {
      if (!resolved) {
        resolved = await getNodeFromRepository(nodeId, pk)

        if (resolved) {
          resolvedCallback(resolved)
        }
      }

      return resolved
    }
  }

  const arc: PartitionedRepositoryArc<I> = {
    a: () => Promise.resolve(undefined),
    b: () => Promise.resolve(undefined),
    aPk,
    bPk,
    cost: Number(serializedArc.arcCost)
  }

  arc.a = await lazyResolver(serializedArc.aNodeId, aPk, (node) => resolvedCallback(arc, node))
  arc.b = await lazyResolver(serializedArc.bNodeId, bPk, (node) => resolvedCallback(arc, node))

  return arc
}

export const buildPartitionedRepository = <I>(
  fetchPartitionedNodes: (partitionKey: string) => Promise<GraphNode<I>[]>,
  storePartitionedNodes: (partitionKey: string, nodes: GraphNode<I>[]) => Promise<void>
) => {
  const repositoryByPartition = new Map<string, Map<NodeId, GraphNode<I>>>

  const getRepositoryFromPartition = (partitionKey: string) => repositoryByPartition.get(partitionKey) || (() => {
    const partition = new Map<NodeId, GraphNode<I>>()
    repositoryByPartition.set(partitionKey, partition)

    return partition
  })()

  return {
    register(node: GraphNode<I>, partitionKey: string) {
      getRepositoryFromPartition(partitionKey).set(node.id, node)
      return Promise.resolve()
    },
    get: async (id: NodeId, partitionKey: string) => {
      const inMemoryItem = repositoryByPartition.get(partitionKey)?.get(id)

      if (inMemoryItem) return inMemoryItem

      const nodes = await fetchPartitionedNodes(partitionKey)

      const repository = getRepositoryFromPartition(partitionKey)

      for (const node of nodes) {
        repository.set(node.id, node)
      }

      return repository.get(id)
    },
    store: async () => {
      for (const [partitionKey, repository] of repositoryByPartition.entries()) {
        storePartitionedNodes(partitionKey, repository.values().toArray())
      }
    }
  }
}
