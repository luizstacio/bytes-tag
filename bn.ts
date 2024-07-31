export function bigintToUint8Array(value: bigint): Uint8Array {
  const byteArray = new Uint8Array(8);
  for (let i = 0; i < 8; i++) {
      byteArray[7 - i] = Number((value >> BigInt(i * 8)) & BigInt(0xFF));
  }
  return byteArray;
}

export function uint8ArrayToBigInt(byteArray: Uint8Array | Array<number>): bigint {
  if (byteArray.length !== 8) {
      throw new Error("Uint8Array must be exactly 8 bytes long.");
  }
  let value = BigInt(0);
  for (let i = 0; i < 8; i++) {
      value = (value << BigInt(8)) | BigInt(byteArray[i]);
  }
  return value;
}
