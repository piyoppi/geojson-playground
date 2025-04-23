import type { Position2D } from "../geometry"
import type { Path } from "../path"
import type { Route, Station as TransportationStation } from "./transportation"

export type Railroad = Route<Station> & {
  rails: Path[]
}

export type Station = TransportationStation & {
  groupId: string,
  platform: [Position2D, Position2D],
}
