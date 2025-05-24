import type { StationResponse } from "~/types";
import { StationListItem } from "./stationListItem";

type PropTypes = {
  stations: StationResponse[]
}

export function RailroadItem({ stations }: PropTypes) {
  const from = stations.at(0)
  const to = stations.at(-1)
  const between = stations.slice(1, -2)
  return (
    <ol className="grid">
      { from && <StationListItem type="station">{from.name}</StationListItem> }
      {between.map((item) => (
        <li className="" key={item.id}>
          <StationListItem type="between">{item.name}</StationListItem>
        </li>
      ))}
      { to && <StationListItem type="station">{to.name}</StationListItem> }
    </ol>
  )
}
