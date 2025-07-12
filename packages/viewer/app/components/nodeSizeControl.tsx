import { useCallback } from 'react'

type PropTypes = {
  nodeSize: number
  onNodeSizeChange: (size: number) => void
}

export function NodeSizeControl({ nodeSize, onNodeSizeChange }: PropTypes) {
  const handleSliderChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    onNodeSizeChange(Number(event.target.value))
  }, [onNodeSizeChange])

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-gray-900">ノードサイズ</h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 min-w-[1.5rem] text-center">0.1</span>
          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.1"
            value={nodeSize}
            onChange={handleSliderChange}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <span className="text-xs text-gray-500 min-w-[1.5rem] text-center">2.0</span>
        </div>
        <div className="text-xs text-gray-600 text-center bg-gray-50 rounded px-2 py-1">
          現在のサイズ: {nodeSize.toFixed(1)}
        </div>
      </div>
    </div>
  )
}