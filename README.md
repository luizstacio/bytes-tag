## Bytecode Tag

This is a simple utility library to generate bytecode tags that can be append to the end of bytecode to easily indentify.

The Spec consists of a header that indicates for the application how many bytes the tag has, and where the checksum is located.
The checksum is calculated using CRC 16, this is good enough for the use case as we want to ensure a high confidence but not strictly removing the possibility of collisions.
The bytes are encoded as follows:

| Bytes           | Description          |
| --------------- | -------------------- |
| 2               | Checksum crc16xmodem |
| Bytes[ByteSize] | Data size            |
| 1               | Tag type             |

For finding the length of the bytes we use a enum that returns the appropriate size for the tag type.

| Tag Type | Byte Size |
| -------- | --------- |
| 0        | 14        |
| 1        | 8         |

The tag type is a single byte that is used to identify the type of tag.

With this Spec we can easily identify the type of tag and the data size and execute the appropriate logic on the application level.

As example the tag type `BYTE_SIZE` is used to identify what is the important size of the bytecode the preceeds the tag for a hashing algorithm to be run on top of it.

```ts
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
```
seee [test.ts](./test.ts) for more examples.


## Running locally

### Install dependencies
```
bun install
```

### Run tests
```
bun test
```