import { Hono } from 'hono'
import { createKeywordHandler } from './handlers/getStationSummaries'
import { OpenAPIV3_1 } from 'openapi-types'
import oas from '@piyoppi/sansaku-api-spec/openapi.json'
import { paths } from '@piyoppi/sansaku-api-spec/openapi.d.ts'
import { cors } from 'hono/cors'
import { queryValidator } from './validators/queryValidator'

export const createApp = (
  app: Hono,
  databaseFileName: string
) => {
  const getStationSummariesFromKeywordHandler = createKeywordHandler(databaseFileName)

  app.use('*', cors())

  app.get(
    '/stations',
    queryValidator<paths['/stations']['get']['parameters']['query']>(oas.paths['/stations'].get.parameters as OpenAPIV3_1.ParameterObject[]),
    (c) => {
      const params = c.req.valid('query')

      return c.json(
        getStationSummariesFromKeywordHandler(params.name)
      )
    }
  )

  return app
}

