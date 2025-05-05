import { readFileSync, writeFileSync } from 'node:fs'
import { separate } from '@piyoppi/sansaku-pilot/traffic/graph/separate.js'
import { buildRepository } from '@piyoppi/sansaku-pilot/graph/arc/externalRepositoryArc'
import { join as pathJoin } from 'node:path'
import { TrafficGraphFile } from '@piyoppi/sansaku-pilot/traffic/graph/trafficGraphFile'
import { buildDefaultTrafficGraphFromFile } from '@piyoppi/sansaku-pilot/traffic/graph/combined'

export const execute = async (
  inputGraphFilename: string,
  outDir: string,
) => {
  const railroadJson = JSON.parse(readFileSync(inputGraphFilename, "utf-8")) as TrafficGraphFile
  const buildTrafficGraphFromFile = buildDefaultTrafficGraphFromFile()

  const { graph } = buildTrafficGraphFromFile(railroadJson)

  const repository = buildRepository(
    partitionKey => Promise.reject(new Error(`Node is not found (partitionKey: ${partitionKey})`)),
    async (partitionKey, nodes) => {
      writeFileSync(pathJoin(outDir, `${partitionKey}.json`), JSON.stringify(nodes), "utf-8")
    }
  )

  separate(repository, graph)

  await repository.store()
}
