import {
  serializeRoute,
  serializeStation,
  deserializeRoute,
  deserializeStation,
  type Route,
  type SerializedRoute,
  type SerializedStation,
  type Station as TransportationStation
} from "./transportation.js"

export type BusRoute = Route<BusStop> & { kind: 'bus' }
export type BusStop = TransportationStation
export type SerializedBusStop = SerializedStation
export type SerializedBusRoute = SerializedRoute<SerializedBusStop>

export const serializedBusRoute = (busRoute: BusRoute): SerializedBusRoute => 
  serializeRoute(busRoute, s => serializeStation(s))

export const deserializeBusRoute = (busRoute: SerializedBusRoute): BusRoute => {
  if (busRoute.kind !== 'bus') {
    throw new Error(`Invalid bus route kind: ${busRoute.kind}`)
  }

  return deserializeRoute(busRoute, (s, id) => deserializeStation(s, id)) as BusRoute
}
