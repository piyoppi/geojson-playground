import { bytesToHexString, hexStringToBytes } from "../utils/Id.js"

export type RouteId = Uint8Array & { readonly __brand: unique symbol }
export const RouteId = (routeId: Uint8Array): RouteId => routeId as RouteId 
export const routeIdToString = (id: RouteId) => bytesToHexString(id)
export const hexStringToRouteId = (str: string) => RouteId(hexStringToBytes(str))

export type StationId = Uint8Array & { readonly __brand: unique symbol }
export const StationId = (stationId: Uint8Array): StationId => stationId as StationId 
export const stationIdToString = (id: StationId) => bytesToHexString(id)
export const hexStringToStationId = (str: string) => StationId(hexStringToBytes(str))

const toId = async (str: string) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  return await crypto.subtle.digest('SHA-1', data)
}

export const toRouteId = async (str: string) => RouteId(new Uint8Array(await toId(str)))
export const toStationId = async (str: string) => StationId(new Uint8Array(await toId(str)))

export type Route<S extends Station> = {
  id: RouteId,
  name: string,
  company: string,
  stations: S[]
}

export type SerializedRoute<S extends SerializedStation> = {
  id: string,
  name: string,
  company: string,
  stations: S[]
}

export type Station = {
  id: StationId,
  name: string,
  routeId: RouteId,
}

export type SerializedStation = {
  id: string,
  name: string,
  routeId: string
}

export const serializeRoute = <S extends Station, SS extends SerializedStation>(
  route: Route<S>,
  serializeStation: (station: S) => SS
) => ({
  ...route,
  id: routeIdToString(route.id),
  stations: route.stations.map(s => serializeStation(s))
})

export const serializeStation = (station: Station) => ({
  ...station,
  id: stationIdToString(station.id),
  routeId: routeIdToString(station.routeId)
})

export const deserializeRoute = <S extends SerializedStation, SS extends Station>(
  route: SerializedRoute<S>,
  deserializeStation: (station: S) => SS
) => ({
  ...route,
  id: hexStringToRouteId(route.id),
  stations: route.stations.map(s => deserializeStation(s))
})

export const deserializeStation = (station: SerializedStation) => ({
  ...station,
  id: hexStringToStationId(station.id),
  routeId: hexStringToRouteId(station.routeId)
})
