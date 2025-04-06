export type RouteName = string & { readonly __brand: unique symbol }
export const RouteName = (routeName: string): RouteName => routeName as RouteName 
