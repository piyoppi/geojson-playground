export const bytesToHexString = (arr: Uint8Array) =>Array.from(arr)
  .map(b => b.toString(16).padStart(2, '0'))
  .join('')

export const hexStringToBytes = (hexString: string) => {
  const normalizedHex = hexString.length % 2 === 0 ? hexString : '0' + hexString;
  
  const bytes = new Uint8Array(normalizedHex.length / 2);
  
  for (let i = 0; i < bytes.length; i++) {
    const hexByte = normalizedHex.substring(i * 2, i * 2 + 2);
    bytes[i] = parseInt(hexByte, 16);
  }
  
  return bytes;
}

