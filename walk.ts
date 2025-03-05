import type { PathChain, VisitFn } from "./pathchain.ts"

type CallbackFn = (pathchain: PathChain, branchNums: number[]) => void

export const pathChainWalk = (start: VisitFn, callback: CallbackFn) => {
  _walk([start], callback, [generateBranchNum()])
}

const generateBranchNum = () => Math.floor(Math.random() * 10000000000000)

const _walk = (visits: VisitFn[], callback: CallbackFn, branchNums: number[]) => {
  while(true) {
    if (visits.length === 0) break

    const res = visits[0]()
    callback(res.path, visits.length > 1 ? [...branchNums, generateBranchNum()] : branchNums)

    for (const visit of visits.slice(1)) {
      const res = visit()
      const newBranchNum = [...branchNums, generateBranchNum()]
      callback(res.path, newBranchNum)

      _walk(res.next(), callback, newBranchNum)
    }

    visits = res.next()
  }
}
