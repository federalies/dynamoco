(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../src/index", "./index.test"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const index_1 = require("../src/index");
    const index_test_1 = require("./index.test");
    const allGroups = async () => {
        const [test, groupTest] = index_test_1.testMaker(__filename);
        return [
            groupTest('From Dynamo to JS', test('1a.From Dynamo Buffer Example', index_1._inferJsValues({ B: Buffer.from('Buf') }), Buffer.from('Buf')), test('1b.From Dynamo Buffer Example', index_1.___inferJsValues({ B: Buffer.from('Buf') }), Buffer.from('Buf')), test('2a.From Dynamo Basic String', index_1._inferJsValues({ S: 'ten' }), 'ten'), test('2b.From Dynamo Basic String', index_1.___inferJsValues({ S: 'ten' }), 'ten'), test('3b.Error Throw for Bad Dynamo Data Elements (int:Number)', index_test_1.isErrorThrown(() => index_1.___inferJsValues({ N: 'SomeBadInput' })), true), test('4a.From Dynamo Basic Int:Number.1', index_1._inferJsValues({ N: '1' }), 1), test('5a.From Dynamo Basic Float:Number.2', index_1._inferJsValues({ N: '10.0' }), 10), test('6a.From Dynamo Basic Float:Number.2', index_1._inferJsValues({ N: '10.5' }), 10.5), test('4b.From Dynamo Basic Int:Number.1', index_1.___inferJsValues({ N: '1' }), 1), test('5b.From Dynamo Basic Float:Number.2', index_1.___inferJsValues({ N: '10.0' }), 10), test('6b.From Dynamo Basic Float:Number.2', index_1.___inferJsValues({ N: '10.5' }), 10.5), test('7a.From Dynamo Basic Float:Number.4', index_1._inferJsValues({ BS: [Buffer.from('10.0')] }), [Buffer.from('10.0')]), test('7b.From Dynamo Basic Float:Number.4', index_1.___inferJsValues({ BS: [Buffer.from('10.0')] }), [Buffer.from('10.0')]), test('8a.From Dynamo Basic Int:Number.3', index_1._inferJsValues({ SS: ['1'] }), ['1']), test('8b.From Dynamo Basic Float:Number.4', index_1.___inferJsValues({ SS: ['10.0'] }), ['10.0']), test('9a.From Dynamo List', index_1._inferJsValues({ L: [{ N: '1' }, { S: 'two' }, { NULL: true }, { BOOL: false }] }), [1, 'two', null, false]), test('9b.From Dynamo List', index_1.___inferJsValues({ L: [{ N: '1' }, { S: 'two' }, { NULL: true }, { BOOL: false }] }), [1, 'two', null, false]), test('10a.From Dynamo Basic Int:Number.3', index_1._inferJsValues({ NS: ['1', '20.0', '3.14'] }), [1, 20, 3.14]), test('10b.From Dynamo Basic Int:Number.3', index_1.___inferJsValues({ NS: ['1', '20.0', '3.14'] }), [1, 20, 3.14])),
            groupTest('Js To Dynamo', test('a1.Number To Dynamo', index_1._inferDynamoValueTypes(1), { N: '1' }), test('a2.Number To Dynamo', index_1.__inferDynamoValueTypes(1), { N: '1' }), test('b1.String To Dynamo', index_1._inferDynamoValueTypes('1'), { S: '1' }), test('b2.String To Dynamo', index_1.__inferDynamoValueTypes('1'), { S: '1' }), test('c1.Buffer To Dynamo', index_1._inferDynamoValueTypes(Buffer.from('Buf1')), { B: Buffer.from('Buf1') }), test('c2.Buffer To Dynamo', index_1.__inferDynamoValueTypes(Buffer.from('Buf1')), { B: Buffer.from('Buf1') }), test('d1.String Set To Dynamo', index_1._inferDynamoValueTypes(['', '', '']), { SS: ['', '', ''] }), test('d2.String Set To Dynamo', index_1.__inferDynamoValueTypes(['', '', '']), { SS: ['', '', ''] }), test('e1.Buffer Set To Dynamo', index_1._inferDynamoValueTypes([Buffer.from('Buf1'), Buffer.from('Buf1')]), { BS: [Buffer.from('Buf1'), Buffer.from('Buf1')] }), test('e2.Buffer Set To Dynamo', index_1.__inferDynamoValueTypes([Buffer.from('Buf1'), Buffer.from('Buf1')]), { BS: [Buffer.from('Buf1'), Buffer.from('Buf1')] }), test('f1.Number Set To Dynamo', index_1._inferDynamoValueTypes([1, 2, 3]), { NS: ['1', '2', '3'] }), test('f2.Number Set To Dynamo', index_1.__inferDynamoValueTypes([1, 2, 3]), { NS: ['1', '2', '3'] }), test('g1.List To Dynamo', index_1._inferDynamoValueTypes([1, true, '3', Buffer.from('Buf1'), null]), { L: [{ N: '1' }, { BOOL: true }, { S: '3' }, { B: Buffer.from('Buf1') }, { NULL: true }] }), test('g2.List To Dynamo', index_1.__inferDynamoValueTypes([1, true, '3', Buffer.from('Buf1'), null]), { L: [{ N: '1' }, { BOOL: true }, { S: '3' }, { B: Buffer.from('Buf1') }, { NULL: true }] }), test('h1.Example Map To Dynamo Type', index_1._inferDynamoValueTypes({ map: { nestedMap: { key: 'value' } } }), { map: { M: { nestedMap: { M: { key: { S: 'value' } } } } } }), test('i1.Map To Dynamo', index_1._inferDynamoValueTypes({ A: { a: { i: 1, ii: 2 }, b: { iii: 3 } }, B: { iv: 4 } }), { A: { M: { a: { M: { i: { N: '1' }, ii: { N: '2' } } }, b: { M: { iii: { N: '3' } } } } }, B: { M: { iv: { N: '4' } } } })),
            groupTest('Parsing Numbers', test('Parse Number.1', index_1.parseNumberOrThrow('1'), 1), test('Parse Number.2', index_1.parseNumberOrThrow('2.2'), 2.2), test('Parse Number.3', index_test_1.isErrorThrown(() => index_1.parseNumberOrThrow('Not A Number')), true))
        ];
    };
    exports.default = allGroups;
    (async () => {
        if (!module.parent) {
            await allGroups();
        }
    })();
});
