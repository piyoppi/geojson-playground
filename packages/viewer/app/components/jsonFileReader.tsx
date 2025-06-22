import { useRef, useState } from "react"
import { Button } from "./ui/button"

type JsonFileSelectorProps = {
  onFileLoaded: (data: any) => void
}

export function JsonFileReader ({ onFileLoaded }: JsonFileSelectorProps) {
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
          onFileLoaded(parsedData);
        } catch (err) {
          console.error("Error parsing JSON file:", err);
          setError('Invalid JSON file. Please select a valid JSON file.');
        }
      }
      reader.readAsText(file)
    }
  };

  return (
    <div>
      <input type="file" accept=".json" onChange={handleFileChange} ref={fileInputRef} style={{ display: 'none' }} />
      <Button onClick={() => fileInputRef.current?.click()}>ファイルを選択</Button>
      {error && <div style={{ color: 'red', marginTop: '8px' }}>{error}</div>}
    </div>
  )
}
