type PropTypes = {
  type: 'station' | 'busstop' | 'between' | 'walk' | 'none'
}

export function RouteMarker({ type }: PropTypes) {
  return (
    <div className="flex justify-center items-center relative">
      <div className="absolute h-full w-1/2 bg-gray-300"></div>
      <div className="absolute">
        {
          type === 'between' ? <div className="w-2 h-2 rounded-full bg-white"></div> :
          type === 'station' ? <div className="w-6 h-6 rounded-full border-4 border-blue-900 bg-white"></div> :
          <></>
        }
      </div>
    </div>
  )
}
