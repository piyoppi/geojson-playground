import type { PathChain, VisitFn } from "./pathchain"

type CallbackFn = (pathchain: PathChain, branchNums: string[]) => void

export const pathChainWalk = (start: VisitFn, callback: CallbackFn) => {
  _walk([start], callback, [generateBranchNum()])
}

const generateBranchNum = () => Math.floor(Math.random() * 10000000000000).toString()

const _walk = (visits: VisitFn[], callback: CallbackFn, branchId: string[]) => {
  while(true) {
    if (visits.length === 0) break

    const res = visits[0]()
    callback(res.pathChain, visits.length > 1 ? [...branchId, generateBranchNum()] : branchId)

    for (const visit of visits.slice(1)) {
      const res = visit()
      const newBranchNum = [...branchId, generateBranchNum()]
      callback(res.pathChain, newBranchNum)

      _walk(res.next(), callback, newBranchNum)
    }

    visits = res.next()
  }
}
