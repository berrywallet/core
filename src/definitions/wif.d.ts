declare module 'wif' {

    type WIF = {
        version: number;
        privateKey: Buffer;
        compressed: boolean;
    };

    function decode(privateKey: string, version?: number): WIF;
    function decodeRaw(buffer: Buffer, version?: number): WIF;

    function encode(version: number, privateKey: Buffer, compressed: boolean): string;
    function encode(wif: WIF): string;
    function encodeRaw(version: number, privateKey: Buffer, compressed: boolean): string;
}
