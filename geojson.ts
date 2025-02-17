export type FeatureCollection<G extends Geometry, P extends Record<string, unknown>> = {
  type: 'FeatureCollection'
  features: Feature<G, P>
}

export type Feature<G extends Geometry, P extends Record<string, unknown>> = {
  type: 'Feature'
  geometry: G
  properties: P
}

export type Position2D = [number, number]
export type Position3D = [number, number, number]

export type Geometry = LineString2D | Point | Polygon

export type LineString2D = {
  type: 'LineString',
  coordinates: Position2D[]
}

export type Point = {
  type: 'Point',
  coordinates: Position2D | Position3D
}

export type Polygon = {
  type: 'Polygon',
  coordinates: Position2D[] | Position3D[]
}
