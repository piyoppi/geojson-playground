#!/usr/bin/env node

import { defineCommand, runMain } from 'citty'
import { execute as executeGenerate } from './commands/graph/generate/generate.js'
import { execute as executeSeparate } from './commands/graph/separate.js'
import { execute as executeRailroadShortest } from './commands/graph/shortest.js'
import { execute as executeDatabaseStore } from './commands/database/store.js'

const main = defineCommand({
  meta: {
    name: "sansaku-cli",
    version: "1.0.0",
    description: "Sansaku CLI",
  },
  subCommands: {
    graph: {
      meta: {
        name: "Generate a traffic diagram"
      },
      subCommands: {
        generate: {
          args: {
            railroads: {
              type: "input",
              description: "Input railroad GeoJSON file",
              required: false,
            },
            stations: {
              type: "input",
              description: "Input station GeoJSON file",
              required: false,
            },
            busstops: {
              type: "input",
              description: "Input busstops GeoJSON file",
              required: false,
            },
            output: {
              type: "input",
              description: "Output file path",
              required: true,
            },
          },
          run({ args }) {
            executeGenerate(args.output, args.railroads, args.stations, args.busstops)
          }
        },
        separate: {
          args: {
            graphfile: {
              type: "input",
              description: "Input railroad graph json.",
              required: true
            },
            outdir: {
              type: "string",
              description: "Output directory.",
              required: true
            },
          },
          async run({ args }) {
            const { graphfile, outdir } = args
            await executeSeparate(graphfile, outdir)
          }
        },
        shortest: {
          meta: {
            name: "Find shortest path between stations."
          },
          args: {
            graphfile: {
              type: "input",
              description: "Input railroad graph json.",
              required: true
            },
            from: {
              type: "string",
              description: "from",
              required: true
            },
            to: {
              type: "string",
              description: "to",
              required: true
            }
          },
          run({ args }) {
            const { graphfile, from, to } = args
            executeRailroadShortest(graphfile, from, to)
          }
        }
      },
    },
    database: {
      subCommands: {
        store: {
          args: {
            graphfile: {
              type: "input",
              description: "Input railroad graph json.",
              required: true
            },
            out: {
              type: "string",
              description: "Output directory.",
              required: true
            },
          },
          run({ args }) {
            const { graphfile, outdir } = args
            executeDatabaseStore(graphfile, outdir)
          }
        }
      }
    }
  },
});

runMain(main)
