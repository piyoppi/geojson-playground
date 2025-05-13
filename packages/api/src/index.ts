import { Hono } from 'hono'
import { createKeywordHandler } from './handlers/getStationSummaries'
import oas from '@piyoppi/sansaku-api-spec/openapi.json'
import { paths } from '@piyoppi/sansaku-api-spec/openapi.d.ts'
import { cors } from 'hono/cors'
import { buildQueryValidator } from './validators/queryValidator'
import { OpenAPIV3_1 } from 'openapi-types'

type Paths = paths & {
  [key: string]: never
}

export const createApp = (
  app: Hono,
  databaseFileName: string
) => {
  const queryValidator = buildQueryValidator<Paths>(oas as OpenAPIV3_1.Document)

  const getStationSummariesFromKeywordHandler = createKeywordHandler(databaseFileName)

  app.use('*', cors())

  app.get(
    '/stations',
    queryValidator('/stations', 'get'),
    (c) => {
      const params = c.req.valid('query')

      return c.json(
        getStationSummariesFromKeywordHandler(params.name)
      )
    }
  )

  return app
}

