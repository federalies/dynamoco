(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "zlib"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const zlib_1 = require("zlib");
    exports.reservedWords = (fs, path) => {
        const fBuff = fs.readFileSync(path.resolve('./src/reserved.txt.br'));
        const bufOpen = zlib_1.brotliDecompressSync(fBuff);
        const words = bufOpen.toString().split('\n');
        return words.reduce((p, w) => (Object.assign(Object.assign({}, p), { [w]: true })), {});
    };
});
