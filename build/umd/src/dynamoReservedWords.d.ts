/// <reference types="node" />
export declare const reservedWords: (decompressSync: IbrotliDecompressSync) => {};
interface BrotliOptions {
    flush?: number;
    finishFlush?: number;
    chunkSize?: number;
    params?: {
        [key: number]: boolean | number;
    };
}
declare type IbrotliDecompressSync = (buf: string | ArrayBuffer | Buffer, options?: BrotliOptions) => Buffer;
export {};
