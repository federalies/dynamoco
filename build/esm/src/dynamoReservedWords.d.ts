/// <reference types="node" />
export declare const reservedWords: (fs: fsLike, path: pathLike, decompressSync: IbrotliDecompressSync) => {};
interface fsLike {
    readFileSync: (path: string | Buffer | URL | number, options?: {
        encoding?: null;
        flag?: string;
    } | null) => Buffer;
}
interface pathLike {
    resolve(...pathSegments: string[]): string;
}
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
