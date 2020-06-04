(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "aws-sdk", "../src/index", "./index.test"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const aws_sdk_1 = require("aws-sdk");
    const index_1 = require("../src/index");
    const index_test_1 = require("./index.test");
    const convertToDynamo = aws_sdk_1.DynamoDB.Converter.marshall;
    const convertToJS = aws_sdk_1.DynamoDB.Converter.unmarshall;
    const testVal1 = { A: { a: 1, b: 2 } };
    const testValTypedForDynamo = { M: { A: { M: { a: { N: '1' }, b: { N: '2' } } } } };
    const testToDyanmo = [
        {
            input: { top: testVal1 }
        },
        {
            input: { top: { k1: testVal1, k2: testVal1 } }
        },
        {
            input: { top: { m1: { k1: testVal1 }, k2: testVal1 } }
        }
    ];
    const testFromDyanmo = [
        { input: { top: testValTypedForDynamo } },
        { input: { top: { M: { k1: testValTypedForDynamo, k2: testValTypedForDynamo } } } },
        { input: { top: { M: { k2: testValTypedForDynamo, m1: { M: { k1: testValTypedForDynamo } } } } } }
    ];
    const allGroups = async () => {
        const [test, groupTest] = index_test_1.testMaker(__filename);
        return [
            groupTest('From Dynamo to JS', test('1a.From Dynamo Buffer Example', index_1.fromDynamo({ B: Buffer.from('Buf') }), Buffer.from('Buf')), test('2a.From Dynamo Basic String', index_1.fromDynamo({ S: 'ten' }), 'ten'), test('3a.Error Throw for Bad Dynamo Data Elements (int:Number)', index_test_1.isErrorThrown(() => index_1.fromDynamo({ N: 'SomeBadInput' })), true), test('3b.Error Throw for Bad Dynamo Data Elements (int:Number)', index_test_1.isErrorThrown(() => index_1.fromDynamo({ N: 'SomeBadInput' })), true), test('4a.From Dynamo Basic Int:Number.1', index_1.fromDynamo({ N: '1' }), 1), test('5a.From Dynamo Basic Float:Number.2', index_1.fromDynamo({ N: '10.0' }), 10), test('6a.From Dynamo Basic Float:Number.2', index_1.fromDynamo({ N: '10.5' }), 10.5), test('7a.From Dynamo Basic Float:Number.4', index_1.fromDynamo({ BS: [Buffer.from('10.0')] }), [Buffer.from('10.0')]), test('8a.From Dynamo Basic Int:Number.3', index_1.fromDynamo({ SS: ['1'] }), ['1']), test('9a.From Dynamo List', index_1.fromDynamo({ L: [{ N: '1' }, { S: 'two' }, { NULL: true }, { BOOL: false }] }), [1, 'two', null, false]), test('10a.From Dynamo Basic Int:Number.3', index_1.fromDynamo({ NS: ['1', '20.0', '3.14'] }), [1, 20, 3.14]), test('11. fromDynamo is equiv to built in converter', index_1.fromDynamo(testFromDyanmo[0].input), convertToJS(testFromDyanmo[0].input)), test('12. fromDynamo is equiv to built in converter', index_1.fromDynamo(testFromDyanmo[1].input), convertToJS(testFromDyanmo[1].input)), test('13. fromDynamo is equiv to built in converter', index_1.fromDynamo(testFromDyanmo[2].input), convertToJS(testFromDyanmo[2].input))),
            groupTest('Js To Dynamo', test('a1.Number To Dynamo', index_1.toDynamo(1), { N: '1' }), test('b1.String To Dynamo', index_1.toDynamo('1'), { S: '1' }), test('c1.Buffer To Dynamo', index_1.toDynamo(Buffer.from('Buf1')), { B: Buffer.from('Buf1') }), test('d1.String Set To Dynamo', index_1.toDynamo(['', '', '']), { SS: ['', '', ''] }), test('e1.Buffer Set To Dynamo', index_1.toDynamo([Buffer.from('Buf1'), Buffer.from('Buf1')]), { BS: [Buffer.from('Buf1'), Buffer.from('Buf1')] }), test('e2.Buffer Set To Dynamo', index_1.toDynamo([Buffer.from('Buf1'), Buffer.from('Buf1')]), { BS: [Buffer.from('Buf1'), Buffer.from('Buf1')] }), test('f1.Number Set To Dynamo', index_1.toDynamo([1, 2, 3]), { NS: ['1', '2', '3'] }), test('f2.Number Set To Dynamo', index_1.toDynamo([1, 2, 3]), { NS: ['1', '2', '3'] }), test('g1.List To Dynamo', index_1.toDynamo([1, true, '3', Buffer.from('Buf1'), null]), { L: [{ N: '1' }, { BOOL: true }, { S: '3' }, { B: Buffer.from('Buf1') }, { NULL: true }] }), test('g2.List To Dynamo', index_1.toDynamo([1, true, '3', Buffer.from('Buf1'), null]), { L: [{ N: '1' }, { BOOL: true }, { S: '3' }, { B: Buffer.from('Buf1') }, { NULL: true }] }), test('1. toDynamo is equiv to built in converter', index_1.toDynamo(testToDyanmo[0].input), convertToDynamo(testToDyanmo[0].input)), test('2. toDynamo is equiv to built in converter', index_1.toDynamo(testToDyanmo[1].input), convertToDynamo(testToDyanmo[1].input)), test('3. toDynamo is equiv to built in converter', index_1.toDynamo(testToDyanmo[2].input), convertToDynamo(testToDyanmo[2].input)), test('4. toDynamo throws an Error for odd inbound data types', index_test_1.isErrorThrown(() => index_1.toDynamo(new Error('someStrange input type'))), true), test('5. toDynamo throws an Error for odd inbound data types', index_test_1.isErrorThrown(() => index_1.toDynamo(new Date())), true)),
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