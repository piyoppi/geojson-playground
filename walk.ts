import type { PathChain, VisitFn } from "./pathchain.ts"

type CallbackFn = (pathchain: PathChain, branchNum: number, previousBranchNum: number | null) => void

export const pathChainWalk = (start: VisitFn, callback: CallbackFn) => {
  _walk([start], callback, generateBranchNum(), null)
}

const generateBranchNum = () => Math.floor(Math.random() * 10000000000000)

const _walk = (visits: VisitFn[], callback: CallbackFn, branchNum: number, previousBranchNum: number | null) => {
  while(true) {
    if (visits.length === 0) break

    if (visits.length > 1) {
      branchNum = generateBranchNum()
    }

    const res = visits[0]()
    callback(res.path, branchNum, previousBranchNum)

    for (const visit of visits.slice(1)) {
      const res = visit()
      const newBranchNum = generateBranchNum()
      callback(res.path, newBranchNum, previousBranchNum)

      _walk(res.next(), callback, newBranchNum, branchNum)
    }

    visits = res.next()
  }
}
