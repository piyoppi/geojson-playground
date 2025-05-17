import { Hono } from 'hono'
import { createKeywordHandler } from './handlers/getStationSummaryGroups'
import oas from '@piyoppi/sansaku-api-spec/openapi.json'
import { paths } from '@piyoppi/sansaku-api-spec/openapi.d.ts'
import { cors } from 'hono/cors'
import { buildQueryValidator } from './validators/queryValidator'
import { OpenAPIV3_1 } from 'openapi-types'
import { createHandlerFromFile } from '@piyoppi/sansaku-viewmodel'
import { createGetTransferHandler } from './handlers/getTransfer'

type Paths = paths & {
  [key: string]: never
}

export const createApp = (
  app: Hono,
  databaseFileName: string,
  inputGraphDir: string
) => {
  const queryValidator = buildQueryValidator<Paths>(oas as OpenAPIV3_1.Document)

  const database = createHandlerFromFile(databaseFileName)

  const getStationSummaryGroupsFromKeywordHandler = createKeywordHandler(database)
  const getTransferHandler = createGetTransferHandler(database, inputGraphDir)

  app.use('*', cors())

  app.get(
    '/stations',
    queryValidator('/stations', 'get'),
    (c) => {
      const params = c.req.valid('query')

      return c.json(
        getStationSummaryGroupsFromKeywordHandler(params.name)
      )
    }
  )

  app.get(
    '/transfer',
    queryValidator('/transfer', 'get'),
    async (c) => {
      const params = c.req.valid('query')

      return c.json(
        await getTransferHandler(params.from, params.to)
      )
    }
  )

  return app
}

