import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { createApp } from '@piyoppi/sansaku-api'

const databaseFileName = process.env.DATABASE_FILE

if (!databaseFileName) {
  throw new Error('DATABASE_FILE is not set.')
}

const inputGraphDir = process.env.INPUT_GRAPH_DIR

if (!inputGraphDir) {
  throw new Error('INPUT_GRAPH_DIR is not set.')
}

const app = new Hono()

createApp(
  app,
  databaseFileName,
  inputGraphDir
)

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
