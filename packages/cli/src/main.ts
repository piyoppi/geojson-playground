#!/usr/bin/env node

import { defineCommand, runMain } from 'citty'
import { execute as executeRailroadGraph } from './commands/railroad/graph.js'
import { execute as executeBusGraph } from './commands/bus/graph.js'

const main = defineCommand({
  meta: {
    name: "sansaku-cli",
    version: "1.0.0",
    description: "Sansaku CLI",
  },
  subCommands: {
    railroad: {
      meta: {
        name: "railroad",
        description: "Railroad command",
      },
      subCommands: {
        graph: {
          meta: {
            name: "Generate a railroad diagram"
          },
          args: {
            railroads: {
              type: "input",
              description: "Input railroad GeoJSON file",
              required: true,
            },
            stations: {
              type: "input",
              description: "Input station GeoJSON file",
              required: true,
            },
            output: {
              type: "input",
              description: "Output file path",
              required: true,
            },
          },
          run({ args }) {
            executeRailroadGraph(args.railroads, args.stations, args.output)
          }
        },
      },
    },
    bus: {
      meta: {
        name: "bus",
        description: "Bus command",
      },
      subCommands: {
        graph: {
          meta: {
            name: "Generate a bus diagram"
          },
          args: {
            input: {
              type: "input",
              description: "Input string to generate diagram",
              required: true,
            },
            output: {
              type: "input",
              description: "Output file path",
              required: true,
            },
          },
          run({ args }) {
            executeBusGraph(args.input, args.output)
          }
        },
      },
    }
  },
});

runMain(main)
