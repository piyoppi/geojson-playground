import { NextFn, PathChain } from "./pathchain"

type CallbackFn<T> = (pathchain: PathChain, state: T) => T

export const walk = <T>(next: NextFn, callback: CallbackFn<T>, state: T) => {
  let currentState = state

  while(true) {
    const visits = next()
    if (visits.length === 0) break

    const res = visits[0]()
    currentState = callback(res.path, currentState)

    for (const visit of visits.slice(1)) {
      const res = visit()
      const newState = callback(res.path, currentState)
      walk(res.next, callback, newState)
    }

    next = res.next
  }
}
