export const bytesToBase64String = (arr: ArrayBuffer) => 
  btoa(Array.from(new Uint8Array(arr)).map(byte => String.fromCharCode(byte)).join(''))

export const base64ToString = (str: string): ArrayBuffer => {
  const binaryString = atob(str)
  const bytes = new Uint8Array(binaryString.length)

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  return bytes.buffer
}

export const toId = async (str: string): Promise<ArrayBuffer> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)

  const fullHash = await crypto.subtle.digest('SHA-1', data)
  const shorterHash = new Uint8Array(fullHash).slice(0, 8)

  return shorterHash.buffer
}
