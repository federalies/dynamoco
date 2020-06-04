(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.reservedWords = (fs, path, decompressSync) => {
        const compressedBuff = fs.readFileSync(path.resolve('./src/reserved.txt.br'));
        const bufOpen = decompressSync(compressedBuff);
        const words = bufOpen.toString().split('\n');
        return words.reduce((p, w) => (Object.assign(Object.assign({}, p), { [w]: true })), {});
    };
});
