import { Hono } from 'hono'
import { createKeywordHandler } from './handlers/getStationSummaries'

export const createApp = (
  databaseFileName: string
) => {
  const app = new Hono()

  const getStationSummariesFromKeywordHandler = createKeywordHandler(databaseFileName)

  app.get('/stations', (c) => {
    const name = c.req.query('name')

    if (!name) {
      throw new Error('')
    }

    return c.json(
      getStationSummariesFromKeywordHandler(name)
    )
  })

  return app
}
