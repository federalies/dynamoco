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
    const convertToJS = aws_sdk_1.DynamoDB.Converter.unmarshall;
    const testValTypedForDynamo = { M: { A: { M: { a: { N: '1' }, b: { N: '2' } } } } };
    const testFromDyanmo = [
        { input: { top: testValTypedForDynamo } },
        { input: { top: { M: { k1: testValTypedForDynamo, k2: testValTypedForDynamo } } } },
        { input: { top: { M: { k2: testValTypedForDynamo, m1: { M: { k1: testValTypedForDynamo } } } } } }
    ];
    const allGroups = async () => {
        const [test, groupTest] = index_test_1.testMaker(__filename);
        return [
            groupTest('From Dynamo to JS', test('1a.From Dynamo Buffer Example', index_1.fromDynamo({ B: Buffer.from('Buf') }), Buffer.from('Buf')), test('2a.From Dynamo Basic String', index_1.fromDynamo({ S: 'ten' }), 'ten'), test('3a.Error Throw for Bad Dynamo Data Elements (int:Number)', index_test_1.isErrorThrown(() => index_1.fromDynamo({ N: 'SomeBadInput' })), true), test('3b.Error Throw for Bad Dynamo Data Elements (int:Number)', index_test_1.isErrorThrown(() => index_1.fromDynamo({ N: 'SomeBadInput' })), true), test('4a.From Dynamo Basic Int:Number.1', index_1.fromDynamo({ N: '1' }), 1), test('5a.From Dynamo Basic Float:Number.2', index_1.fromDynamo({ N: '10.0' }), 10), test('6a.From Dynamo Basic Float:Number.2', index_1.fromDynamo({ N: '10.5' }), 10.5), test('7a.From Dynamo Basic Float:Number.4', index_1.fromDynamo({ BS: [Buffer.from('10.0')] }), [Buffer.from('10.0')]), test('8a.From Dynamo Basic Int:Number.3', index_1.fromDynamo({ SS: ['1'] }), ['1']), test('9a.From Dynamo List', index_1.fromDynamo({ L: [{ N: '1' }, { S: 'two' }, { NULL: true }, { BOOL: false }] }), [1, 'two', null, false]), test('10a.From Dynamo Basic Int:Number.3', index_1.fromDynamo({ NS: ['1', '20.0', '3.14'] }), [1, 20, 3.14]), test('11. fromDynamo is equiv to built in converter', index_1.fromDynamo(testFromDyanmo[0].input), convertToJS(testFromDyanmo[0].input)), test('12. fromDynamo is equiv to built in converter', index_1.fromDynamo(testFromDyanmo[1].input), convertToJS(testFromDyanmo[1].input)), test('13. fromDynamo is equiv to built in converter', index_1.fromDynamo(testFromDyanmo[2].input), convertToJS(testFromDyanmo[2].input))),
            groupTest('Js To Dynamo', test('Infer Dynamo Types ', index_1._giveDynamoTypesToValues({ A: true }), { A: { BOOL: true } }), test('Infer Dynamo Types ', index_1._giveDynamoTypesToValues({ b: Buffer.from('A Buffer Test') }), { b: { B: Buffer.from('A Buffer Test') } }), test('Infer Dynamo Types ', index_1._giveDynamoTypesToValues({ n: null }), { n: { NULL: true } }), test('Infer Dynamo Types ', index_1._giveDynamoTypesToValues({ l: ['one', true, 3] }), { l: { L: [{ S: 'one' }, { BOOL: true }, { N: 3 }] } }), test('Infer Dynamo Types ', index_1._giveDynamoTypesToValues({ ss: ['one', 'two', 'three'] }), { ss: { SS: ['one', 'two', 'three'] } }), test('Infer Dynamo Types ', index_1._giveDynamoTypesToValues({ ns: [1, 2, 3] }), { ns: { NS: [1, 2, 3] } }), test('Infer Dynamo Types ', index_1._giveDynamoTypesToValues({ bs: [Buffer.from('Hello'), Buffer.from('World')] }), { bs: { BS: [Buffer.from('Hello'), Buffer.from('World')] } })),
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
