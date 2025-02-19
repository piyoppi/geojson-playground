import { NextFn, PathChain } from "./pathchain"

type CallbackFn = (path: PathChain) => void

export const walk = (next: NextFn, callback: CallbackFn) => {
  while(true) {
    const visits = next()
    if (visits.length === 0) break

    const res = visits[0]()
    callback(res.path)

    for (const visit of visits.slice(1)) {
      const res = visit()
      callback(res.path)
      walk(res.next, callback)
    }

    next = res.next
  }
}
