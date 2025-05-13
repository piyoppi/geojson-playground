import { validator } from 'hono/validator'
import Ajv from 'ajv'
import type { Env, MiddlewareHandler } from 'hono'
import { OpenAPIV3_1 } from 'openapi-types'

type SchemaType = Record<
  string, 
  {
    [key in 'get' | 'post' | 'put']?: {
      parameters: {
        query?: Record<string, unknown>
      }
    }
  }
>

export const buildQueryValidator = <
  InputOpenAPIParams extends SchemaType
>(
  schema: OpenAPIV3_1.Document
) => <
  Path extends Extract<keyof InputOpenAPIParams, string>,
  Method extends keyof InputOpenAPIParams[Path] & ('get' | 'post' | 'put'),
  QueryParams = InputOpenAPIParams[Path][Method] extends { parameters: { query: infer Q } } ? Q : never
>(path: Path, method: Method): MiddlewareHandler<
  Env,
  string,
  {
    in: { query: QueryParams }
    out: { query: QueryParams }
  }
> => {
  const ajv = new Ajv()

  const targetSchemas = schema.paths?.[path as string]?.[method]?.parameters?.filter((item) => ('in' in item) && item.in === 'query') as OpenAPIV3_1.ParameterObject[]
  
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
  }) as MiddlewareHandler<Env, string, { in: { query: QueryParams }; out: { query: QueryParams } }>
}
