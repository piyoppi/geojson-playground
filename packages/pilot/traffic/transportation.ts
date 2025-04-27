import { Position2D } from "../geojson.js"
import { bytesToBase64String, base64ToString } from "../utils/Id.js"

export type RouteId = Uint8Array & { readonly __brand: unique symbol }
export const RouteId = (routeId: Uint8Array): RouteId => routeId as RouteId 
export const routeIdToString = (id: RouteId) => bytesToBase64String(id)
const hexStringToRouteId = (str: string) => RouteId(base64ToString(str))

export type StationId = Uint8Array & { readonly __brand: unique symbol }
export const StationId = (stationId: Uint8Array): StationId => stationId as StationId 
export const stationIdToString = (id: StationId) => bytesToBase64String(id)
const hexStringToStationId = (str: string) => StationId(base64ToString(str))

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
  position: Position2D
}

export type SerializedStation = {
  id: string,
  name: string,
  position: Position2D
}

export const serializeRoute = <S extends Station, SS extends SerializedStation>(
  route: Route<S>,
  serializeStation: (station: S) => SS
) => ({
  id: routeIdToString(route.id),
  stations: route.stations.map(s => serializeStation(s))
})

export const serializeStation = (station: Station) => ({
  id: stationIdToString(station.id),
  name: station.name,
  position: station.position
})

export const deserializeRoute = <S extends SerializedStation, SS extends Station>(
  route: SerializedRoute<S>,
  deserializeStation: (station: S, routeId: RouteId) => SS
) => {
  const id = hexStringToRouteId(route.id)
  return {
    ...route,
    id,
    stations: route.stations.map(s => deserializeStation(s, id))
  }
}

export const deserializeStation = (station: SerializedStation, routeId: RouteId) => ({
  ...station,
  id: hexStringToStationId(station.id),
  routeId
})
