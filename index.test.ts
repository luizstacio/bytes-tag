import { expect, test } from "bun:test";
import { createTag, DataType, parseTag } from ".";
import { bigintToUint8Array, uint8ArrayToBigInt } from "./bn";

test("Create tag and parse it", () => {
    const tagData = crypto.getRandomValues(new Uint8Array(14));
    const tagBytes = createTag(DataType.TAG, tagData);
    expect(parseTag(tagBytes)).toEqual({
        type: DataType.TAG,
        data: tagData,
    });
});

test("Create tag with wrong length should fail", () => {
    expect(() => {
        const tagData = crypto.getRandomValues(new Uint8Array(12));
        createTag(DataType.TAG, tagData);
    }).toThrow();
    expect(() => {
        const tagData = crypto.getRandomValues(new Uint8Array(0));
        createTag(DataType.TAG, tagData);
    }).toThrow();
    expect(() => {
        const tagData = crypto.getRandomValues(new Uint8Array(15));
        createTag(DataType.TAG, tagData);
    }).toThrow();
});

test("Parse tag with wrong bytes should invalidate checkshum", () => {
    expect(() => {
        const tagData = crypto.getRandomValues(new Uint8Array(17));
        parseTag(tagData);
    }).toThrow();
    expect(() => {
        const tagData = crypto.getRandomValues(new Uint8Array(14));
        const tagBytes = createTag(DataType.TAG, tagData);
        // Change first data byte
        tagBytes[2] = tagBytes[2] + 1;
        parseTag(tagBytes);
    }).toThrowError(/Invalid checksum/i);
    expect(() => {
        const tagData = crypto.getRandomValues(new Uint8Array(14));
        const tagBytes = createTag(DataType.TAG, tagData);
        parseTag(Uint8Array.from([
            ...tagBytes.slice(0, 2),
            ...tagBytes.slice(2, 10),
            ...tagBytes.slice(-1),
        ]));
    }).toThrowError(/Mismatched data size/i);
});


test("Create BYTE_SIZE and parse it", () => {
    const byteSize = crypto.getRandomValues(new Uint8Array(8));
    const byteSizeBytes = createTag(DataType.BYTE_SIZE, byteSize);
    expect(parseTag(byteSizeBytes)).toEqual({
        type: DataType.BYTE_SIZE,
        data: byteSize,
    });
});

test("Create BYTE_SIZE with wrong length should fail", () => {
    expect(() => {
        const byteSize = crypto.getRandomValues(new Uint8Array(5));
        createTag(DataType.BYTE_SIZE, byteSize);
    }).toThrow();
    expect(() => {
        const byteSize = crypto.getRandomValues(new Uint8Array(1));
        createTag(DataType.BYTE_SIZE, byteSize);
    }).toThrow();
    expect(() => {
        const byteSize = crypto.getRandomValues(new Uint8Array(9));
        createTag(DataType.BYTE_SIZE, byteSize);
    }).toThrow();
});

test("Parse BYTE_SIZE with wrong bytes should invalidate checkshum", () => {
    expect(() => {
        const byteSize = crypto.getRandomValues(new Uint8Array(11));
        parseTag(byteSize);
    }).toThrow();
    expect(() => {
        const byteSize = crypto.getRandomValues(new Uint8Array(8));
        const byteSizeBytes = createTag(DataType.BYTE_SIZE, byteSize);
        // Change first data byte
        byteSizeBytes[2] = byteSizeBytes[2] + 1;
        parseTag(byteSizeBytes);
    }).toThrowError(/Invalid checksum/i);
    expect(() => {
        const byteSize = crypto.getRandomValues(new Uint8Array(8));
        const byteSizeBytes = createTag(DataType.BYTE_SIZE, byteSize);
        parseTag(Uint8Array.from([
            ...byteSizeBytes.slice(0, 2),
            ...byteSizeBytes.slice(2, 9),
            ...byteSizeBytes.slice(-1),
        ]));
        parseTag(byteSizeBytes);
    }).toThrowError(/Mismatched data size/i);
});


test("Recover from random bytes", () => {
    const randomBytes = crypto.getRandomValues(new Uint8Array(200));
    const tagData = crypto.getRandomValues(new Uint8Array(14));
    const tagBytes = createTag(DataType.TAG, tagData);
    const bytes = Uint8Array.from([...randomBytes, ...tagBytes]);
    expect(bytes.length).toBe(200 + 17);
    expect(parseTag(bytes)).toEqual({
        type: DataType.TAG,
        data: tagData,
    });
});

test("Recover from random without tag bytes should fail", () => {
    const randomBytes = crypto.getRandomValues(new Uint8Array(200));
    expect(() => parseTag(randomBytes)).toThrow();
});

test("Recover from random bytes the bytes size to hash", () => {
    function hash(bytes: Uint8Array) {
        const hasher = new Bun.CryptoHasher("sha256");
        hasher.update(bytes);
        return hasher.digest("hex");
    }
    // Create a random bytes
    const randomBytes = crypto.getRandomValues(new Uint8Array(200));
    // Expected indinfication hash should consider the first 100 bytes
    const expectedHash = hash(randomBytes.slice(0, 100));

    // Create a tag with the byte size 100
    const tagBytes = createTag(DataType.BYTE_SIZE, bigintToUint8Array(100n));
    // Concatenate the bytes and the tag
    const bytes = Uint8Array.from([...randomBytes, ...tagBytes]);

    // On the application level it would be possible to get the tag with high confidence that is valid
    const { data } = parseTag(bytes);
    const byteSize = uint8ArrayToBigInt(data);
    // Hash using the bytes size from the tag
    const finalHash = hash(bytes.slice(0, Number(byteSize)))

    expect(finalHash).toBe(expectedHash);
});