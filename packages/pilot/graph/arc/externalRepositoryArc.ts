import type { ArcGenerator } from "../arcGenerator.js"
import type { GraphNode, NodeId } from "../graph.js"
import { ArcDeserializer, SerializedArc } from "../serialize.js"

export type PartitionedRepository<I> = {
  register: (node: GraphNode<I>, partitionKey: string) => Promise<void>,
  get: (id: NodeId, partitionKey: string) => Promise<GraphNode<I> | undefined>
  getInMemory: (id: NodeId, partitionKey: string) => GraphNode<I> | undefined
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
    aPk: partitionKeyGetter(a),
    bPk: partitionKeyGetter(b),
    cost
  }
}

export const buildRepositoryArcDeserializer = <I>(
  repository: PartitionedRepository<I>
): ArcDeserializer<I> => (
  serializedArc,
  resolvedAllCallback
) => {
  if (!('aPk' in serializedArc && 'bPk' in serializedArc)) {
    return undefined
  }

  const aPk = serializedArc.aPk
  const bPk = serializedArc.bPk

  if (typeof aPk !== 'string' || typeof bPk !== 'string') {
    return undefined
  }

  const lazyResolveHandler = (nodeId: NodeId, pk: string, resolvedCallback: (node: GraphNode<I>) => void) => {
    const initial = repository.getInMemory(nodeId, pk)
    let resolved: GraphNode<I> | undefined = undefined
    return async () => {
      if (!resolved) {
        resolved = initial || await repository.get(nodeId, pk)

        if (resolved) {
          resolvedCallback(resolved)
        }
      }

      return resolved
    }
  }

  const dependentHandler = (() => {
    let aResolved: GraphNode<I> | undefined = undefined
    let bResolved: GraphNode<I> | undefined = undefined
    return (node: GraphNode<I>) => {
      if (node.id === serializedArc.aNodeId) {
        aResolved = node
      }

      if (node.id === serializedArc.bNodeId) {
        bResolved = node
      }

      if (aResolved && bResolved) {
        resolvedAllCallback(arc, aResolved, bResolved)
      }
    }
  })()

  const arc = {
    a: lazyResolveHandler(serializedArc.aNodeId, aPk, dependentHandler),
    b: lazyResolveHandler(serializedArc.bNodeId, bPk, dependentHandler),
    aPk,
    bPk,
    cost: Number(serializedArc.arcCost)
  }

  return arc
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
    getInMemory: (id: NodeId, partitionKey: string) => {
      return repositoryByPartition.get(partitionKey)?.get(id)
    },
    store: async () => {
      for (const [partitionKey, repository] of repositoryByPartition.entries()) {
        storeNodes(partitionKey, repository.values().toArray())
      }
    }
  }
}
