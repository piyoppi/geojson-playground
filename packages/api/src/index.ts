import { Hono } from 'hono'
import { createKeywordHandler } from './handlers/getStationSummaries'
import { validator } from 'hono/validator'
import { OpenAPIV3_1 } from 'openapi-types'
import Ajv from 'ajv'
import type { Env, MiddlewareHandler } from 'hono'
import oas from '@piyoppi/sansaku-api-spec/openapi.json'
import { paths } from '@piyoppi/sansaku-api-spec/openapi.d.ts'
import { cors } from 'hono/cors'

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

const queryValidator = <
  T extends Record<string, string>
>(
  schema: OpenAPIV3_1.ParameterObject[]
): MiddlewareHandler<
  Env,
  string,
  {
    in: { query: T }
    out: { query: T }
  }
> => {
  const ajv = new Ajv()

  const targetSchemas = schema.filter((item) => item.in === 'query')
  
  const properties = targetSchemas
    .reduce((acc, item) => {
      const schema = item.schema
      if (schema && 'type' in schema) {
        acc[item.name] = schema
      }
      return acc
    }, {} as Record<string, OpenAPIV3_1.SchemaObject>)

  const paramsSchema = {
    type: 'object',
    properties: {
      ...properties,
    },
    required: targetSchemas.filter(s => s.required).map(s => s.name)
  }

  const validate = ajv.compile(paramsSchema)
  
  return validator('query', (value, c) => {
    const valid = validate(value)
  
    if (!valid) {
      return c.text('Invalid parameters', 400)
    }

    return value
  })
}
