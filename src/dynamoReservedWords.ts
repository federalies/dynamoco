import { brotliDecompressSync } from 'zlib'

export const reservedWords = (fs:fsLike, path: pathLike)=>{
    const fBuff = fs.readFileSync(path.resolve('./src/reserved.txt.br'))
    const bufOpen = brotliDecompressSync(fBuff)
    const words = bufOpen.toString().split('\n')
    return words.reduce((p,w) => ({...p, [w]:true}) ,{})
}

interface fsLike{
    readFileSync: (
        path: string | Buffer | URL | number, 
        options?: { encoding?: null; flag?: string; } | null) => Buffer
}

interface pathLike{
    resolve(...pathSegments: string[]): string;
}