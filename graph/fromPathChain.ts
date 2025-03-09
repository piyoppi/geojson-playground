import type { Position2D } from "../geometry.ts"
import { type PathChain, type PointInPathchain } from "../pathchain.ts"
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

const distanceKey = (branchIds: string[]) => branchIds.join('-')

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

    if (!nodeChainInBranch.has(branchId)) {
      nodeChainInBranch.set(branchId, [])
    }

    const found: [T, PointInPathchain][] = []

    for (const [node, pointInPathChain] of pointInPathchains) {
      const currentPointPathChain = pointInPathChain.pathchain.deref()
      if (!currentPointPathChain) continue

      if (currentPointPathChain === pathchain) {
        found.push([node, pointInPathChain])
      }
    }

    const distance = distances.get(distanceKey(branchIds))
      ?? distances.get(distanceKey(branchIds.slice(0, -1)))
      ?? 0

    if (found.length > 0) {
      let previousNode = nodeChainInBranch.get(branchId)?.at(-1) || (previousBranchNum ? nodeChainInBranch.get(previousBranchNum)?.at(-1) : null)
      let lastDistance = 0

      found
        .sort(([_na, a], [_nb, b]) => a.pointInPath.distance() - b.pointInPath.distance())
        .forEach(([node, pointInPathChain]) => {
          const newNode = {...generateNode(), ...callback(node, pointInPathChain)}

          lastDistance = pointInPathChain.pointInPath.distance()
          nodeChainInBranch.get(branchId)?.push(newNode)

          if (!firstNode) {
            firstNode = newNode
          }

          if (previousNode) {
            const arc = generateArc(previousNode, newNode, distance + lastDistance)

            previousNode.arcs.push(arc)
            newNode.arcs.push(arc)
          }

          previousNode = newNode
        })

      distances.set(distanceKey(branchIds), pathLength(pathchain.path) - lastDistance)
    } else {
      distances.set(distanceKey(branchIds), distance + pathLength(pathchain.path))
    }
  })

  return firstNode
}
