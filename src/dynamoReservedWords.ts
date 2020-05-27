
export const reservedWords = (fs:fsLike, path: pathLike, decompressSync: IbrotliDecompressSync) => {
  const compressedBuff = fs.readFileSync(path.resolve('./src/reserved.txt.br'))
  // const compressedBuff = fetch('https://github.com/federalies/dynamoco/blob/master/utils/reserved.txt.br?raw=true') //=  but this is a promise
  const bufOpen = decompressSync(compressedBuff)
  const words = bufOpen.toString().split('\n')
  return words.reduce((p, w) => ({ ...p, [w]: true }), {})
}

interface fsLike{
    readFileSync: (
        path: string | Buffer | URL | number,
        options?: { encoding?: null; flag?: string; } | null) => Buffer
}

interface pathLike{
    resolve(...pathSegments: string[]): string;
}

interface BrotliOptions {
  /**
   * @default constants.BROTLI_OPERATION_PROCESS
   */
  flush?: number;
  /**
   * @default constants.BROTLI_OPERATION_FINISH
   */
  finishFlush?: number;
  /**
   * @default 16*1024
   */
  chunkSize?: number;
  params?: {
      /**
       * Each key is a `constants.BROTLI_*` constant.
       */
      [key: number]: boolean | number;
  };
}
type IbrotliDecompressSync = (buf: string | ArrayBuffer | Buffer, options?: BrotliOptions) => Buffer
