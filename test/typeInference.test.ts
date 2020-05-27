// import type { DynamoAttrValueType } from '../src/index'
import { DynamoDB } from 'aws-sdk'
import {
  toDynamo,
  fromDynamo,
  parseNumberOrThrow
  // __inferDynamoValueTypes,
  // ___inferJsValues
} from '../src/index'
import { testMaker, isErrorThrown } from './index.test'
// eslint-disable-next-line no-unused-vars

const convertToDynamo = DynamoDB.Converter.marshall
const convertToJS = DynamoDB.Converter.unmarshall

const testVal1 = { A: { a: 1, b: 2 } }
// const converterTypedObj = { A: { M: { a: { N: '1' }, b: { N: '2' } } } }
const testValTypedForDynamo = { M: { A: { M: { a: { N: '1' }, b: { N: '2' } } } } }
const testToDyanmo = [
  {
    input: { top: testVal1 }
    // outputMap: testValTypedForDynamo,
    // outputObj: { top: testValTypedForDynamo }
  },
  {
    input: { top: { k1: testVal1, k2: testVal1 } }
    // outputMap: { M: { k1: testValTypedForDynamo, k2: testValTypedForDynamo } },
    // outputObj: { top: { M: { k1: testValTypedForDynamo, k2: testValTypedForDynamo } } }
  },
  {
    input: { top: { m1: { k1: testVal1 }, k2: testVal1 } }
    // outputMap: { M: { m1: { M: { k1: testValTypedForDynamo } }, k2: testValTypedForDynamo } },
    // outputObj: { top: { M: { m1: { M: { k1: testValTypedForDynamo } }, k2: testValTypedForDynamo } } }
  }
]

const testFromDyanmo = [
  { input: { top: testValTypedForDynamo } },
  { input: { top: { M: { k1: testValTypedForDynamo, k2: testValTypedForDynamo } } } },
  { input: { top: { M: { k2: testValTypedForDynamo, m1: { M: { k1: testValTypedForDynamo } } } } } }
]

// main
const allGroups = async () => {
  const [test, groupTest] = testMaker(__filename)
  return [
    groupTest('From Dynamo to JS',
      test('1a.From Dynamo Buffer Example', fromDynamo({ B: Buffer.from('Buf') }), Buffer.from('Buf')),
      test('2a.From Dynamo Basic String', fromDynamo({ S: 'ten' }), 'ten'),
      // Should Never Happen From Dynamo
      test('3a.Error Throw for Bad Dynamo Data Elements (int:Number)',
        isErrorThrown(() => fromDynamo({ N: 'SomeBadInput' })), true
      ),
      test('3b.Error Throw for Bad Dynamo Data Elements (int:Number)',
        isErrorThrown(() => fromDynamo({ N: 'SomeBadInput' })), true
      ),
      test('4a.From Dynamo Basic Int:Number.1', fromDynamo({ N: '1' }), 1),
      test('5a.From Dynamo Basic Float:Number.2', fromDynamo({ N: '10.0' }), 10),
      test('6a.From Dynamo Basic Float:Number.2', fromDynamo({ N: '10.5' }), 10.5),
      test('7a.From Dynamo Basic Float:Number.4', fromDynamo({ BS: [Buffer.from('10.0')] }), [Buffer.from('10.0')]),
      test('8a.From Dynamo Basic Int:Number.3', fromDynamo({ SS: ['1'] }), ['1']),
      test('9a.From Dynamo List',
        fromDynamo({ L: [{ N: '1' }, { S: 'two' }, { NULL: true }, { BOOL: false }] }),
        [1, 'two', null, false]
      ),
      test('10a.From Dynamo Basic Int:Number.3', fromDynamo({ NS: ['1', '20.0', '3.14'] }), [1, 20, 3.14]),
      test('11. fromDynamo is equiv to built in converter',
        fromDynamo(testFromDyanmo[0].input as any),
        convertToJS(testFromDyanmo[0].input as any)
      ),
      test('12. fromDynamo is equiv to built in converter',
        fromDynamo(testFromDyanmo[1].input as any),
        convertToJS(testFromDyanmo[1].input as any)
      ),
      test('13. fromDynamo is equiv to built in converter',
        fromDynamo(testFromDyanmo[2].input as any),
        convertToJS(testFromDyanmo[2].input as any)
      )
    ),
    groupTest('Js To Dynamo',
      test('a1.Number To Dynamo', toDynamo(1), { N: '1' }),
      test('b1.String To Dynamo', toDynamo('1'), { S: '1' }),
      test('c1.Buffer To Dynamo', toDynamo(Buffer.from('Buf1')), { B: Buffer.from('Buf1') }),
      test('d1.String Set To Dynamo', toDynamo(['', '', '']), { SS: ['', '', ''] }),
      test('e1.Buffer Set To Dynamo',
        toDynamo([Buffer.from('Buf1'), Buffer.from('Buf1')]),
        { BS: [Buffer.from('Buf1'), Buffer.from('Buf1')] }),
      test('e2.Buffer Set To Dynamo',
        toDynamo([Buffer.from('Buf1'), Buffer.from('Buf1')]),
        { BS: [Buffer.from('Buf1'), Buffer.from('Buf1')] }),
      test('f1.Number Set To Dynamo',
        toDynamo([1, 2, 3]),
        { NS: ['1', '2', '3'] }),
      test('f2.Number Set To Dynamo',
        toDynamo([1, 2, 3]),
        { NS: ['1', '2', '3'] }),
      test('g1.List To Dynamo',
        toDynamo([1, true, '3', Buffer.from('Buf1'), null] as any),
        { L: [{ N: '1' }, { BOOL: true }, { S: '3' }, { B: Buffer.from('Buf1') }, { NULL: true }] }),
      test('g2.List To Dynamo',
        toDynamo([1, true, '3', Buffer.from('Buf1'), null] as any),
        { L: [{ N: '1' }, { BOOL: true }, { S: '3' }, { B: Buffer.from('Buf1') }, { NULL: true }] }),
      test('1. toDynamo is equiv to built in converter',
        toDynamo(testToDyanmo[0].input as any),
        convertToDynamo(testToDyanmo[0].input)
      ),
      test('2. toDynamo is equiv to built in converter',
        toDynamo(testToDyanmo[1].input as any),
        convertToDynamo(testToDyanmo[1].input)
      ),
      test('3. toDynamo is equiv to built in converter',
        toDynamo(testToDyanmo[2].input as any),
        convertToDynamo(testToDyanmo[2].input)
      ),
      test('4. toDynamo throws an Error for odd inbound data types',
        isErrorThrown(() => toDynamo(new Error('someStrange input type') as any)),
        true
      ),
      test('5. toDynamo throws an Error for odd inbound data types',
        isErrorThrown(() => toDynamo(new Date() as any)),
        true
      )
    ),
    groupTest('Parsing Numbers',
      test('Parse Number.1', parseNumberOrThrow('1'), 1),
      test('Parse Number.2', parseNumberOrThrow('2.2'), 2.2),
      test('Parse Number.3', isErrorThrown(() => parseNumberOrThrow('Not A Number')), true)
    )
  ]
}
export default allGroups

;(async () => {
  if (!module.parent) {
    await allGroups()
    // const r =
    // console.log(JSON.stringify({ r }, null, 2))
  }
})()
