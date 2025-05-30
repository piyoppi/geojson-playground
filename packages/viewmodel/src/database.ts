import { DatabaseSync } from 'node:sqlite'

export interface DatabaseHandler {
  exec: (sql: string) => void
  prepare: (sql: string) => Statement
  close: () => void
}

interface Statement {
  run: (...items: (string | number)[]) => void
  all: (...items: (string | number)[]) => unknown[]
}

export const createHandlerFromFile = (filename: string): DatabaseHandler => new DatabaseSync(filename)
