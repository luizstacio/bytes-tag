import crc from 'crc';

export const CHECKSUM_SIZE = 2;
export const HEADER_SIZE = 1;

export enum DataType {
    TAG = 0,
    BYTE_SIZE = 1,
}

export const DataTypeSize = {
    [DataType.TAG]: 14,
    [DataType.BYTE_SIZE]: 8,
}

export function createHeader(dataType: DataType) {
    if (dataType > 254) {
        throw new Error('Data type must be less than 254');
    }
    return dataType;
}

export function parseHeader(header: number): DataType {
    return header as DataType;
}

export function checksum(data: Array<number> | Uint8Array): Uint8Array {
    const checksum = (crc.crc16xmodem(data as any) & 0xFFFF); // Take the lower 16 bits
    const checksumBytes = new Uint8Array([
        (checksum >> 8) & 0xFF, // High byte
        checksum & 0xFF         // Low byte
    ]);
    return checksumBytes;
}

export function verifyChecksum(data: Array<number> | Uint8Array, check: Array<number> | Uint8Array): boolean {
    const array = checksum(data);
    return array[0] === check[0] && array[1] === check[1];
}

export function createTag(dataType: DataType, data: Uint8Array): Uint8Array {
    const tagBytes: Array<number> = [];

    if (!DataTypeSize[dataType]) {
        throw new Error('Invalid data type');
    } else if (data.length !== DataTypeSize[dataType]) {
        throw new Error(`Tag ${dataType} must have ${DataTypeSize[dataType]} bytes`);
    }
    tagBytes.push(createHeader(dataType));
    // Add data
    tagBytes.unshift(...data);
    // Add checksum
    tagBytes.unshift(...Array.from(checksum(tagBytes)));

    return Uint8Array.from(tagBytes);
}

export function parseTag(bytes: Array<number> | Uint8Array) {
    if (bytes.length < HEADER_SIZE) {
        throw new Error('Bytes cannot be less than header size');
    }
    const dataType = parseHeader(bytes.slice(-HEADER_SIZE)[0]);
    if (!DataTypeSize[dataType]) {
        throw new Error('Invalid data type');
    }
    const tagBytes = bytes.slice(-(CHECKSUM_SIZE + DataTypeSize[dataType] + HEADER_SIZE));
    const checksumBytes = tagBytes.slice(0, 2);
    const tagBytesNoChecksum = tagBytes.slice(2);
    const bytesData = tagBytes.slice(2, -1);

    if (bytesData.length !== DataTypeSize[dataType]) {
        throw new Error(`Mismatched data size ${bytesData.length} and header size ${DataTypeSize[dataType]}`);
    }
    if (!verifyChecksum(tagBytesNoChecksum, checksumBytes)) {
        throw new Error('Invalid checksum');
    }

    return {
        type: dataType,
        data: bytesData,
    };
}
