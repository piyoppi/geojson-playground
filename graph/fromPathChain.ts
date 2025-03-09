import type { Position2D } from "../geometry.ts"
import type { PathChain, PointInPathchain } from "../pathchain.ts"
import { pathChainWalk } from "../walk.ts"
import { pathLength } from "../path.ts"
import { generateArc, generateNode, type GraphNode } from "./graph.ts"

type NodeOnPath = {
  position: Position2D,
}

type CallbackFn<T, U> = (node: T, found: PointInPathchain) => U

export const fromPathChain = <T extends NodeOnPath, U>(
  nodes: T[],
  callback: CallbackFn<T, U>
) => (pathchain: PathChain): (U & GraphNode) | null => {
  const pointInPathchains: [T, PointInPathchain][] = nodes
    .map<[T, PointInPathchain | null]>(n => [n, pathchain.findPointInPathChain()(n.position)])
    .flatMap<[T, PointInPathchain]>(([n, p]) => n && p ? [[n, p]] : [])

  return mapping(pathchain, callback, pointInPathchains)
}

const mapping = <T extends NodeOnPath, U>(
  pathchain: PathChain,
  callback: CallbackFn<T, U>,
  pointInPathchains: [T, PointInPathchain][]
) => {
  let firstNode: U & GraphNode | null = null
  const nodeChainInBranch = new Map<string, GraphNode[]>()
  const distances = new Map<string, number>()

  pathChainWalk(pathchain.from(), (pathchain, branchIds) => {
    const branchId = branchIds.at(-1)
    if (branchId === undefined) return

    const previousBranchNum = branchIds.findLast(id => nodeChainInBranch.get(id)?.length ?? 0 > 0)

    let distance = distances.get(branchId) ?? 0
    const newDistance = distance + pathLength(pathchain.path)
    distances.set(branchId, newDistance)

    if (!nodeChainInBranch.has(branchId)) {
      nodeChainInBranch.set(branchId, [])
    }
    const nodeChain = nodeChainInBranch.get(branchId)

    for (const [node, pointInPathChain] of pointInPathchains) {
      const currentPointPathChain = pointInPathChain.pathchain.deref()
      if (!currentPointPathChain) continue

      if (currentPointPathChain === pathchain) {
        const newNode = {...generateNode(), ...callback(node, pointInPathChain)}
        const previousNode = nodeChainInBranch.get(branchId)?.at(-1) || (previousBranchNum ? nodeChainInBranch.get(previousBranchNum)?.at(-1) : null)

        nodeChain?.push(newNode)

        if (!firstNode) {
          firstNode = newNode
        }

        if (previousNode) {
          const arc = generateArc(previousNode, newNode)

          previousNode.arcs.push(arc)
          newNode.arcs.push(arc)
        }
      }
    }
  })

  return firstNode
}
