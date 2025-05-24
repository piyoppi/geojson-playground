import type { StationResponse } from "~/types";
import { StationListItem } from "./stationListItem";

type PropTypes = {
  stations: StationResponse[]
  start?: boolean
  end?: boolean
}

export function RailroadItem({ stations, start, end }: PropTypes) {
  const from = stations.at(0)
  const to = stations.at(-1)
  const between = stations.slice(1, -2)

  return (
    <ol>
      {
        from &&
        <li className="bg-gray-100 rounded-sm pl-3">
          <StationListItem type={start ? 'stationStart' : 'station'}>
            <p>{from.routeName}</p>
            <p>{from.name}</p>
          </StationListItem>
        </li>
      }
      <li>
        <details>
          <summary className="block cursor-pointer">
            <div className="pl-3 text-gray-400">
              <StationListItem type="none">途中駅</StationListItem>
            </div>
          </summary>
          <ol>
            {between.map((item) => (
              <li className="pl-3" key={item.id}>
                <StationListItem type="between">{item.name}</StationListItem>
              </li>
            ))}
          </ol>
        </details>
      </li>
      {
        to &&
        <li className="bg-gray-100 rounded-sm pl-3">
          <StationListItem type={end ? 'stationEnd' : 'station'}>
            <p>{to.routeName}</p>
            <p>{to.name}</p>
          </StationListItem>
        </li>
      }
    </ol>
  )
}
