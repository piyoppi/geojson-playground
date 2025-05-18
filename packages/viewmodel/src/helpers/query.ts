import { DatabaseHandler } from "../database.js"

export const buildPlaceholder = (arr: unknown[]) => arr.map(() => '?').join(',')

export const transaction = (database: DatabaseHandler, block: () => void) => {
  try {
    database.exec('BEGIN TRANSACTION')

    block()

    database.exec('COMMIT')
  } catch (e) {
    database.exec('ROLLBACK')
    throw e
  }
}
