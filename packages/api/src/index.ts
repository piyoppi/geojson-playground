import { Hono } from 'hono'
import { type JSONSchemaType } from 'ajv'
import { createKeywordHandler } from './handlers/getStationSummaries'
import { ajvValidator } from '@hono/ajv-validator'
import schema from '@piyoppi/sansaku-api-spec/openapi.json'

export const createApp = (
  databaseFileName: string
) => {
  const app = new Hono()

  const getStationSummariesFromKeywordHandler = createKeywordHandler(databaseFileName)

  const stationsSchema: JSONSchemaType<{name: string}> = schema.paths['/stations/{name}'].get.parameters

  app.get(
    '/stations',
    ajvValidator('json', stationsSchema),
    (c) => {
    const params = c.req.valid('json')

    return c.json(
      getStationSummariesFromKeywordHandler(params.name)
    )
  })

  return app
}
