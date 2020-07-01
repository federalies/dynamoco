import { DynamoDB } from 'aws-sdk';
import { fromDynamo, parseNumberOrThrow } from '../src/index';
import { testMaker, isErrorThrown } from './index.test';
const convertToJS = DynamoDB.Converter.unmarshall;
const testValTypedForDynamo = { M: { A: { M: { a: { N: '1' }, b: { N: '2' } } } } };
const testFromDyanmo = [
    { input: { top: testValTypedForDynamo } },
    { input: { top: { M: { k1: testValTypedForDynamo, k2: testValTypedForDynamo } } } },
    { input: { top: { M: { k2: testValTypedForDynamo, m1: { M: { k1: testValTypedForDynamo } } } } } }
];
const allGroups = async () => {
    const [test, groupTest] = testMaker(__filename);
    return [
        groupTest('From Dynamo to JS', test('1a.From Dynamo Buffer Example', fromDynamo({ B: Buffer.from('Buf') }), Buffer.from('Buf')), test('2a.From Dynamo Basic String', fromDynamo({ S: 'ten' }), 'ten'), test('3a.Error Throw for Bad Dynamo Data Elements (int:Number)', isErrorThrown(() => fromDynamo({ N: 'SomeBadInput' })), true), test('3b.Error Throw for Bad Dynamo Data Elements (int:Number)', isErrorThrown(() => fromDynamo({ N: 'SomeBadInput' })), true), test('4a.From Dynamo Basic Int:Number.1', fromDynamo({ N: '1' }), 1), test('5a.From Dynamo Basic Float:Number.2', fromDynamo({ N: '10.0' }), 10), test('6a.From Dynamo Basic Float:Number.2', fromDynamo({ N: '10.5' }), 10.5), test('7a.From Dynamo Basic Float:Number.4', fromDynamo({ BS: [Buffer.from('10.0')] }), [Buffer.from('10.0')]), test('8a.From Dynamo Basic Int:Number.3', fromDynamo({ SS: ['1'] }), ['1']), test('9a.From Dynamo List', fromDynamo({ L: [{ N: '1' }, { S: 'two' }, { NULL: true }, { BOOL: false }] }), [1, 'two', null, false]), test('10a.From Dynamo Basic Int:Number.3', fromDynamo({ NS: ['1', '20.0', '3.14'] }), [1, 20, 3.14]), test('11. fromDynamo is equiv to built in converter', fromDynamo(testFromDyanmo[0].input), convertToJS(testFromDyanmo[0].input)), test('12. fromDynamo is equiv to built in converter', fromDynamo(testFromDyanmo[1].input), convertToJS(testFromDyanmo[1].input)), test('13. fromDynamo is equiv to built in converter', fromDynamo(testFromDyanmo[2].input), convertToJS(testFromDyanmo[2].input))),
        groupTest('Parsing Numbers', test('Parse Number.1', parseNumberOrThrow('1'), 1), test('Parse Number.2', parseNumberOrThrow('2.2'), 2.2), test('Parse Number.3', isErrorThrown(() => parseNumberOrThrow('Not A Number')), true))
    ];
};
export default allGroups;
(async () => {
    if (!module.parent) {
        await allGroups();
    }
})();
