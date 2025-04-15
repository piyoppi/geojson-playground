import type { PathChain, PathDirection, VisitFn } from "./pathchain"

type WalkOption = {
  firstStepFootprints: boolean
}

type Current = {
  pathChain: PathChain,
  pathDirection: PathDirection
}

type CallbackResult = {
  stopBranch?: boolean
}

type CallbackFn = (current: Current, branchIdChain: BranchId[]) => Promise<void | CallbackResult>

export const pathChainWalk = async (start: VisitFn, callback: CallbackFn, option: WalkOption) => {
  await _walk([start], callback, [generateBranchId()])
}

export type BranchId = string & { readonly __brand: unique symbol }
const BranchId = (branchId: string): BranchId => branchId as BranchId
const generateBranchId = () => BranchId(Math.floor(Math.random() * 10000000000000).toString())

const _walk = async (visits: VisitFn[], callback: CallbackFn, branchId: BranchId[]) => {
  while(true) {
    if (visits.length === 0) break

    const res = visits[0]()
    const result = await callback({pathChain: res.pathChain, pathDirection: res.pathDirection}, visits.length > 1 ? [...branchId, generateBranchId()] : branchId)

    if (result?.stopBranch) {
      break
    }

    for (const visit of visits.slice(1)) {
      const res = visit()
      const newBranchNum = [...branchId, generateBranchId()]
      await callback({pathChain: res.pathChain, pathDirection: res.pathDirection}, newBranchNum)

      await _walk(res.next(), callback, newBranchNum)
    }

    visits = res.next()
  }
}
