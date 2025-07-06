import { describe, it } from 'node:test'
import assert from 'node:assert'
import { buildCostGenerator } from './costGenerator.js'
import { createNode, connect } from '@piyoppi/sansaku-pilot/graph/graph'
import { toId } from '@piyoppi/sansaku-pilot/utils/Id'
import type { BusStopNodeItem, RailroadStationNodeItem } from '@piyoppi/sansaku-pilot/traffic/graph/trafficGraph'
import { StationId, toRouteId, toStationId } from '@piyoppi/sansaku-pilot/traffic/transportation'
import { buildWeakRefArc } from '@piyoppi/sansaku-pilot/graph/arc/weakRefArc'

describe('buildCostGenerator', () => {
  describe('bus stop transfer cost', () => {
    it('should not add transfer cost when staying on the same route', async () => {
      const routeA = await toRouteId('route-A')
      const routeB = await toRouteId('route-B')

      const stop1: BusStopNodeItem = {
        type: 'BusStop',
        busStopIds: [await toStationId('stop1')],
        routeIds: [routeA, routeB]
      }

      const stop2: BusStopNodeItem = {
        type: 'BusStop',
        busStopIds: [await toStationId('stop2')],
        routeIds: [routeA]
      }

      const stop3: BusStopNodeItem = {
        type: 'BusStop',
        busStopIds: [await toStationId('stop3')],
        routeIds: [routeA]
      }

      const node1 = createNode(await toId('node1'), stop1)
      const node2 = createNode(await toId('node2'), stop2)
      const node3 = createNode(await toId('node3'), stop3)

      connect(node1, node2, buildWeakRefArc(node1, node2, 100))
      const arc23 = buildWeakRefArc(node2, node3, 100)
      connect(node2, node3, arc23)

      const startNode: RailroadStationNodeItem = {
        type: 'RailroadStation',
        stationId: await toStationId('start')
      }
      const start = createNode(await toId('start'), startNode)

      const costGenerator = buildCostGenerator(
        start,
        () => undefined,
        { busRouteWeight: 2, busTransferWeight: 1000 }
      )

      const cost = await costGenerator(arc23, node2, node3)
      assert.strictEqual(cost, 200) // 100 * 2 (bus weight), no transfer cost
    })

    it('should add transfer cost when changing routes', async () => {
      const routeA = await toRouteId('route-A')
      const routeB = await toRouteId('route-B')
      const routeC = await toRouteId('route-C')

      const stop1: BusStopNodeItem = {
        type: 'BusStop',
        busStopIds: [await toStationId('stop1')],
        routeIds: [routeA]
      }

      const stop2: BusStopNodeItem = {
        type: 'BusStop',
        busStopIds: [await toStationId('stop2')],
        routeIds: [routeA, routeB]
      }

      const stop3: BusStopNodeItem = {
        type: 'BusStop',
        busStopIds: [await toStationId('stop3')],
        routeIds: [routeB, routeC]
      }

      const node1 = createNode(await toId('node1'), stop1)
      const node2 = createNode(await toId('node2'), stop2)
      const node3 = createNode(await toId('node3'), stop3)

      connect(node1, node2, buildWeakRefArc(node1, node2, 100))
      const arc23 = buildWeakRefArc(node2, node3, 100)
      connect(node2, node3, arc23)

      const startNode: RailroadStationNodeItem = {
        type: 'RailroadStation',
        stationId: await toStationId('start')
      }
      const start = createNode(await toId('start'), startNode)

      const costGenerator = buildCostGenerator(
        start,
        () => undefined,
        { busRouteWeight: 2, busTransferWeight: 1000 }
      )

      const cost = await costGenerator(arc23, node2, node3)
      assert.strictEqual(cost, 1200) // 100 * 2 + 1000 (transfer cost)
    })

    it('should correctly identify current route from adjacent stops', async () => {
      const routeA = await toRouteId('route-A')
      const routeB = await toRouteId('route-B')
      const routeC = await toRouteId('route-C')

      const stop1: BusStopNodeItem = {
        type: 'BusStop',
        busStopIds: [await toStationId('stop1')],
        routeIds: [routeA, routeB]
      }

      const stop2: BusStopNodeItem = {
        type: 'BusStop',
        busStopIds: [await toStationId('stop2')],
        routeIds: [routeA, routeB, routeC]
      }

      const stop3: BusStopNodeItem = {
        type: 'BusStop',
        busStopIds: [await toStationId('stop3')],
        routeIds: [routeB, routeC]
      }

      const stop4: BusStopNodeItem = {
        type: 'BusStop',
        busStopIds: [await toStationId('stop4')],
        routeIds: [routeC]
      }

      const node1 = createNode(await toId('node1'), stop1)
      const node2 = createNode(await toId('node2'), stop2)
      const node3 = createNode(await toId('node3'), stop3)
      const node4 = createNode(await toId('node4'), stop4)

      connect(node1, node2, buildWeakRefArc(node1, node2, 100))
      connect(node2, node3, buildWeakRefArc(node2, node3, 100))
      const arc24 = buildWeakRefArc(node2, node4, 100)
      connect(node2, node4, arc24)

      const startNode: RailroadStationNodeItem = {
        type: 'RailroadStation',
        stationId: await toStationId('start')
      }
      const start = createNode(await toId('start'), startNode)

      const costGenerator = buildCostGenerator(
        start,
        () => undefined,
        { busRouteWeight: 2, busTransferWeight: 1000 }
      )

      const cost = await costGenerator(arc24, node2, node4)
      assert.strictEqual(cost, 1200) // Transfer needed since route A/B not in stop4
    })
  })

  describe('railroad station cost', () => {
    it('should return 0 for same group stations when one is start', async () => {
      const station1: RailroadStationNodeItem = {
        type: 'RailroadStation',
        stationId: await toStationId('station1')
      }

      const station2: RailroadStationNodeItem = {
        type: 'RailroadStation',
        stationId: await toStationId('station2')
      }

      const node1 = createNode(await toId('node1'), station1)
      const node2 = createNode(await toId('node2'), station2)

      const arc12 = buildWeakRefArc(node1, node2, 100)
      connect(node1, node2, arc12)

      const getGroupId = (_id: StationId) => 'group1'
      const costGenerator = buildCostGenerator(node1, getGroupId)

      const cost = await costGenerator(arc12, node1, node2)
      assert.strictEqual(cost, 0)
    })

    it('should return normal cost for different group stations', async () => {
      const station1: RailroadStationNodeItem = {
        type: 'RailroadStation',
        stationId: await toStationId('station1')
      }

      const station2: RailroadStationNodeItem = {
        type: 'RailroadStation',
        stationId: await toStationId('station2')
      }

      const node1 = createNode(await toId('node1'), station1)
      const node2 = createNode(await toId('node2'), station2)

      const arc12 = buildWeakRefArc(node1, node2, 100)
      connect(node1, node2, arc12)

      const getGroupId = (id: StationId) => {
        if (id === station1.stationId) return 'group1'
        if (id === station2.stationId) return 'group2'
        return undefined
      }
      const costGenerator = buildCostGenerator(node1, getGroupId)

      const cost = await costGenerator(arc12, node1, node2)
      assert.strictEqual(cost, 100)
    })
  })
})
