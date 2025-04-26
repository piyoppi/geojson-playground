export const bytesToBase64String = (arr: Uint8Array) => 
  btoa(Array.from(arr).map(byte => String.fromCharCode(byte)).join(''))

export const base64ToString = (str: string) => {
  const binaryString = atob(str)
  const bytes = new Uint8Array(binaryString.length)

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  return bytes
}

