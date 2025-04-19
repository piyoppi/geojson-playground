import { useRef, useState } from "react"
import { deserialize } from "@piyoppi/sansaku-pilot/traffic/serialize"
import type { TrafficGraphNode } from "@piyoppi/sansaku-pilot/traffic/trafficGraph"

type JsonFileSelectorProps = {
  onFileLoaded: (data: TrafficGraphNode[]) => void
}

export function JsonFileSelector ({ onFileLoaded }: JsonFileSelectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setError(null)
    
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const parsedData = JSON.parse(event.target?.result as string);
          const nodes = deserialize(parsedData)
          onFileLoaded(nodes);
        } catch (err) {
          setError('Invalid JSON file. Please select a valid JSON file.');
        }
      }
      reader.readAsText(file)
    }
  };

  return (
    <div>
      <input type="file" accept=".json" onChange={handleFileChange} ref={fileInputRef} style={{ display: 'none' }} />
      <button onClick={() => fileInputRef.current?.click()}>ファイルを選択</button>
      {error && <div style={{ color: 'red', marginTop: '8px' }}>{error}</div>}
    </div>
  )
}
