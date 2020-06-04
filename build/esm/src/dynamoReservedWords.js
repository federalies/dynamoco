export const reservedWords = (fs, path, decompressSync) => {
    const compressedBuff = fs.readFileSync(path.resolve('./src/reserved.txt.br'));
    const bufOpen = decompressSync(compressedBuff);
    const words = bufOpen.toString().split('\n');
    return words.reduce((p, w) => ({ ...p, [w]: true }), {});
};
