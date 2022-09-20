/**
 * primitive schemas
 */
export const primitiveSchema: string = `
array Uint8 [byte; 1];
array Uint16 [byte; 2];
array Uint32 [byte; 4];
array Uint64 [byte; 8];
array Uint128 [byte; 16];
array Uint256 [byte; 32];
array Uint512 [byte; 64];

array Byte32 [byte; 32];

vector Bytes <byte>;
option BytesOpt (Bytes); 

vector BytesVec <Bytes>;
vector Byte32Vec <Byte32>;
`
