import type { PathChain, PathDirection, VisitFn } from "./pathchain.js"

type Current = {
  pathChain: PathChain,
  pathDirection: PathDirection
}

type CallbackReturn<R = unknown> = {
  stopBranch?: boolean
  stop?: boolean
  returned?: R
}

type CallbackFn<R> = (current: Current, branchIdChain: BranchId[]) => Promise<void | CallbackReturn<R>>

export const pathChainWalk = async <R>(start: VisitFn, callback: CallbackFn<R>) => {
  return (await _walk([start], callback, [generateBranchId()]))[1]
}

export type BranchId = string & { readonly __brand: unique symbol }
const BranchId = (branchId: string): BranchId => branchId as BranchId
const generateBranchId = () => BranchId(Math.floor(Math.random() * 10000000000000).toString())

const _walk = async <R>(visits: VisitFn[], callback: CallbackFn<R>, branchId: BranchId[]) => {
  const returned: R[]= []
  let stop = false

  const handleResult = (result: CallbackReturn<R> | void) => {
    if (result?.returned) {
      returned.push(result.returned)
    }

    if (result?.stopBranch) {
      return true
    }

    if (result?.stop) {
      stop = true
      return true
    }

    return false
  }

  while(true) {
    if (visits.length === 0) break

    for (const visit of visits.slice(1)) {
      const res = visit()
      const newBranchNum = [...branchId, generateBranchId()]

      const result = await callback({pathChain: res.pathChain, pathDirection: res.pathDirection}, newBranchNum)

      if (handleResult(result)) {
        if (stop) {
          break
        } else {
          continue
        }
      }

      const [stopReturned, resultReturned] = await _walk(res.next(), callback, newBranchNum)
      returned.push(...resultReturned)
      if (stopReturned) {
        stop = true
        break
      }
    }

    if (stop) break

    const res = visits[0]()
    const result = await callback({pathChain: res.pathChain, pathDirection: res.pathDirection}, visits.length > 1 ? [...branchId, generateBranchId()] : branchId)

    if (handleResult(result)) {
      break
    }

    visits = res.next()
  }

  return [stop, returned] as const
}
