export type RouteId = string & { readonly __brand: unique symbol }
export const RouteId = (routeId: string): RouteId => routeId as RouteId 

export type Route<S extends Station> = {
  id: RouteId,
  name: string,
  company: string,
  stations: S[]
}

export type Station = {
  id: string,
  name: string,
  routeId: RouteId,
}
