import { validator } from 'hono/validator'
import Ajv from 'ajv'
import type { Env, MiddlewareHandler } from 'hono'
import { OpenAPIV3_1 } from 'openapi-types'

export const queryValidator = <
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
