import type { Position2D } from "../geojson.js"
import { toId, idToString, stringToId, type Id } from "../utils/Id.js"

export type RouteId = Id & { readonly __brand: unique symbol }
export const RouteId = (routeId: Id): RouteId => routeId as RouteId 
export const routeIdToString = (id: RouteId) => idToString(id)
const stringToRouteId = (str: string) => RouteId(stringToId(str))

export type StationId = Id & { readonly __brand: unique symbol }
export const StationId = (stationId: Id): StationId => stationId as StationId 
export const stationIdToString = (id: StationId) => idToString(id)
const stringToStationId = (str: string) => StationId(stringToId(str))

export type CompanyId = Id & { readonly __brand: unique symbol }
export const CompanyId = (companyId: Id): CompanyId => companyId as CompanyId
export const companyIdToString = (id: CompanyId) => idToString(id)
const stringToCompanyId = (str: string) => CompanyId(stringToId(str))

export const toRouteId = async (str: string) => RouteId(await toId(str))
export const toStationId = async (str: string) => StationId(await toId(str))
export const toCompanyId = async (str: string) => CompanyId(await toId(str))

export type Route<S extends Station> = {
  id: RouteId,
  name: string,
  companyId: CompanyId,
  stations: S[]
}

export type SerializedRoute<S extends SerializedStation> = {
  id: string,
  name: string,
  companyId: string,
  stations: S[]
}

export type Station = {
  id: StationId,
  name: string,
  routeId: RouteId,
  position: Position2D,
  groupId?: string
}

export type SerializedStation = {
  id: string,
  name: string,
  position: Position2D,
  groupId?: string
}

export type Company = {
  id: CompanyId,
  name: string
}

export type SerializedCompany = {
  id: string,
  name: string
}

export const serializeRoute = <S extends Station, SS extends SerializedStation>(
  route: Route<S>,
  serializeStation: (station: S) => SS
) => ({
  id: routeIdToString(route.id),
  name: route.name,
  companyId: companyIdToString(route.companyId),
  stations: route.stations.map(s => serializeStation(s))
})

export const deserializeRoute = <S extends SerializedStation, SS extends Station>(
  route: SerializedRoute<S>,
  deserializeStation: (station: S, routeId: RouteId) => SS
) => {
  const id = stringToRouteId(route.id)
  const companyId = stringToCompanyId(route.companyId)
  return {
    ...route,
    id,
    companyId,
    stations: route.stations.map(s => deserializeStation(s, id))
  }
}

export const serializeStation = (station: Station) => ({
  id: stationIdToString(station.id),
  name: station.name,
  position: station.position,
  ...(() => station.groupId ? { groupId: station.groupId } : {})()
})

export const deserializeStation = (station: SerializedStation, routeId: RouteId) => ({
  ...station,
  id: stringToStationId(station.id),
  routeId
})

export const serializeCompany = (company: Company) => ({
  id: stringToCompanyId(company.id),
  name: company.name
})

export const deserializeCompany = (company: SerializedCompany) => ({
  id: stringToCompanyId(company.id),
  name: company.name
})
