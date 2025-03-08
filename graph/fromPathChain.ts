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
  const nodeChainInBranch = new Map<number, GraphNode[]>()
  const distances = new Map<number, number>()

  pathChainWalk(pathchain.from(), (pathchain, branchNums) => {
    const branchNum = branchNums.at(-1)
    if (branchNum === undefined) return

    const previousBranchNum = branchNums.find(n => nodeChainInBranch.get(n)?.length ?? 0 > 0)

    let distance = distances.get(branchNum) ?? 0
    const newDistance = distance + pathLength(pathchain.path)
    distances.set(branchNum, newDistance)

    if (!nodeChainInBranch.has(branchNum)) {
      nodeChainInBranch.set(branchNum, [])
    }
    const nodeChain = nodeChainInBranch.get(branchNum)

    for (const [node, pointInPathChain] of pointInPathchains) {
      const currentPointPathChain = pointInPathChain.pathchain.deref()
      if (!currentPointPathChain) continue

      if (currentPointPathChain === pathchain) {
        const newNode = {...generateNode(), ...callback(node, pointInPathChain)}

        const previousNode = nodeChainInBranch.get(branchNum)?.at(-1) || (previousBranchNum ? nodeChainInBranch.get(previousBranchNum)?.at(-1) : null)
        console.log(previousNode, branchNum, previousBranchNum)

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
