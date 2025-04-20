export type RouteId = string & { readonly __brand: unique symbol }
export const RouteId = (routeId: string): RouteId => routeId as RouteId 
