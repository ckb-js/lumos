import bs58 from "bs58";


export function decodeAddress(address: string): string {
    return '0x' + Buffer.from(bs58.decode(address)).toString('hex', 1, 21);
}


