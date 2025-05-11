import { serve } from '@hono/node-server'
import { createApp } from '@piyoppi/sansaku-api'
import { cors } from 'hono/cors'

const databaseFileName = process.env.DATABASE_FILE
const corsOrigin = process.env.CORS_ORIGIN

if (!databaseFileName) {
  throw new Error('DATABASE_FILE is not set.')
}

const app = createApp(
  databaseFileName
)

if (corsOrigin) {
  console.log(`Enable CORS Header ${corsOrigin}`)
  app.use(
    '/*',
    cors({
      origin: corsOrigin,
      allowMethods: ['POST', 'GET', 'OPTIONS']
    })
  )
}

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
