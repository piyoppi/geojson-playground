export type Id = string

export const idToString = (id: Id) => id

export const stringToId = (str: string): Id => str

const bytesToBase64String = (arr: ArrayBuffer) => 
  btoa(Array.from(new Uint8Array(arr)).map(byte => String.fromCharCode(byte)).join(''))

export const toId = async (str: string): Promise<Id> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)

  const fullHash = await crypto.subtle.digest('SHA-1', data)
  const shorterHash = new Uint8Array(fullHash).slice(0, 6)

  return bytesToBase64String(shorterHash.buffer)
}
