import { RouteMarker } from "./routeMarker"
import type { ReactNode } from "react"

type PropTypes = {
  type: 'station' | 'busstop' | 'between' | 'walk' | 'none',
  children: ReactNode
}

export function StationListItem({ type, children }: PropTypes) {
  return (
    <div className="grid grid-cols-[30px_1fr] gap-1">
      <RouteMarker type={type} />
      <button className="pt-2 pb-2" type="button">{ children }</button>
    </div>
  )
}
