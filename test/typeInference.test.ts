import {
  parseNumberOrThrow,
  _inferDynamoValueTypes,
  _inferJsValues
  // __inferDynamoValueTypes,
  // ___inferJsValues
} from '../src/index'
import { testMaker, isErrorThrown } from './index.test'
// eslint-disable-next-line no-unused-vars
import type { DynamoAttrValueType } from '../src/index'

// main
const allGroups = async () => {
  const [test, groupTest] = testMaker(__filename)
  return [
    groupTest('From Dynamo to JS',
      test('1a.From Dynamo Buffer Example', _inferJsValues({ B: Buffer.from('Buf') }), Buffer.from('Buf')),
      // test('1b.From Dynamo Buffer Example', ___inferJsValues({ B: Buffer.from('Buf') }), Buffer.from('Buf')),

      test('2a.From Dynamo Basic String', _inferJsValues({ S: 'ten' }), 'ten'),
      // test('2b.From Dynamo Basic String', ___inferJsValues({ S: 'ten' }), 'ten'),

      // Should Never Happen From Dynamo
      // test('3a.Error Throw for Bad Dynamo Data Elements (int:Number)',
      //   isErrorThrown(() => _inferJsValues({ N: 'SomeBadInput' })), true
      // ),
      // test('3b.Error Throw for Bad Dynamo Data Elements (int:Number)',
      //   isErrorThrown(() => ___inferJsValues({ N: 'SomeBadInput' })), true
      // ),
      test('4a.From Dynamo Basic Int:Number.1', _inferJsValues({ N: '1' }), 1),
      test('5a.From Dynamo Basic Float:Number.2', _inferJsValues({ N: '10.0' }), 10),
      test('6a.From Dynamo Basic Float:Number.2', _inferJsValues({ N: '10.5' }), 10.5),

      // test('4b.From Dynamo Basic Int:Number.1', ___inferJsValues({ N: '1' }), 1),
      // test('5b.From Dynamo Basic Float:Number.2', ___inferJsValues({ N: '10.0' }), 10),
      // test('6b.From Dynamo Basic Float:Number.2', ___inferJsValues({ N: '10.5' }), 10.5),

      test('7a.From Dynamo Basic Float:Number.4', _inferJsValues({ BS: [Buffer.from('10.0')] }), [Buffer.from('10.0')]),
      // test('7b.From Dynamo Basic Float:Number.4', ___inferJsValues({ BS: [Buffer.from('10.0')] }), [Buffer.from('10.0')]),

      test('8a.From Dynamo Basic Int:Number.3', _inferJsValues({ SS: ['1'] }), ['1']),
      // test('8b.From Dynamo Basic Float:Number.4', ___inferJsValues({ SS: ['10.0'] }), ['10.0']),

      test('9a.From Dynamo List',
        _inferJsValues({ L: [{ N: '1' }, { S: 'two' }, { NULL: true }, { BOOL: false }] }),
        [1, 'two', null, false]
      ),
      // test('9b.From Dynamo List',
      //   ___inferJsValues({ L: [{ N: '1' }, { S: 'two' }, { NULL: true }, { BOOL: false }] }),
      //   [1, 'two', null, false]
      // ),

      test('10a.From Dynamo Basic Int:Number.3', _inferJsValues({ NS: ['1', '20.0', '3.14'] }), [1, 20, 3.14])
      // test('10b.From Dynamo Basic Int:Number.3', ___inferJsValues({ NS: ['1', '20.0', '3.14'] }), [1, 20, 3.14])

      // test('10a.From Dynamo Test Map',
      //   _inferJsValues({ map: { M: { nestedMap: { M: { key: { S: 'value' } } } } } } as any),
      //   { map: { nestedMap: { key: 'value' } } }
      // ),
      // test('10b.From Dynamo Test Map',
      //   ___inferJsValues({ map: { M: { nestedMap: { M: { key: { S: 'value' } } } } } } as any),
      //   { map: { nestedMap: { key: 'value' } } }
      // )
    ),
    groupTest('Js To Dynamo',
      test('a1.Number To Dynamo', _inferDynamoValueTypes(1), { N: '1' }),
      // test('a2.Number To Dynamo', __inferDynamoValueTypes(1), { N: '1' }),
      test('b1.String To Dynamo', _inferDynamoValueTypes('1'), { S: '1' }),
      // test('b2.String To Dynamo', __inferDynamoValueTypes('1'), { S: '1' }),
      test('c1.Buffer To Dynamo', _inferDynamoValueTypes(Buffer.from('Buf1')), { B: Buffer.from('Buf1') }),
      // test('c2.Buffer To Dynamo', __inferDynamoValueTypes(Buffer.from('Buf1')), { B: Buffer.from('Buf1') }),
      test('d1.String Set To Dynamo', _inferDynamoValueTypes(['', '', '']), { SS: ['', '', ''] }),
      // test('d2.String Set To Dynamo', __inferDynamoValueTypes(['', '', '']), { SS: ['', '', ''] }),
      test('e1.Buffer Set To Dynamo',
        _inferDynamoValueTypes([Buffer.from('Buf1'), Buffer.from('Buf1')]),
        { BS: [Buffer.from('Buf1'), Buffer.from('Buf1')] }),
      // test('e2.Buffer Set To Dynamo',
      //   __inferDynamoValueTypes([Buffer.from('Buf1'), Buffer.from('Buf1')]),
      //   { BS: [Buffer.from('Buf1'), Buffer.from('Buf1')] }),
      test('f1.Number Set To Dynamo',
        _inferDynamoValueTypes([1, 2, 3]),
        { NS: ['1', '2', '3'] }),
      // test('f2.Number Set To Dynamo',
      //   __inferDynamoValueTypes([1, 2, 3]),
      //   { NS: ['1', '2', '3'] }),
      test('g1.List To Dynamo',
        _inferDynamoValueTypes([1, true, '3', Buffer.from('Buf1'), null] as any),
        { L: [{ N: '1' }, { BOOL: true }, { S: '3' }, { B: Buffer.from('Buf1') }, { NULL: true }] }),
      // test('g2.List To Dynamo',
      //   __inferDynamoValueTypes([1, true, '3', Buffer.from('Buf1'), null] as any),
      //   { L: [{ N: '1' }, { BOOL: true }, { S: '3' }, { B: Buffer.from('Buf1') }, { NULL: true }] }),
      // test('h1.Example Map To Dynamo Type', _inferDynamoValueTypes({ map: { nestedMap: { key: 'value' } } }), { map: { M: { nestedMap: { M: { key: { S: 'value' } } } } } }),
      // test('h2.Example Map To Dynamo Type', __inferDynamoValueTypes({ map: { nestedMap: { key: 'value' } } }), { M: { map: { M: { nestedMap: { M: { key: { S: 'value' } } } } } } }),

      test('i1.Map To Dynamo',
        _inferDynamoValueTypes({ A: { a: 1, b: 2 } }),
        { A: { M: { a: { M: { i: { N: '1' }, ii: { N: '2' } } }, b: { M: { iii: { N: '3' } } } } }, B: { M: { iv: { N: '4' } } } }),
      // test('i2.Map To Dynamo',
      //   __inferDynamoValueTypes({ A: { a: { i: 1, ii: 2 }, b: { iii: 3 } }, B: { iv: 4 } }),
      //   { A: { M: { a: { M: { i: { N: '1' }, ii: { N: '2' } } }, b: { M: { iii: { N: '3' } } } } }, B: { M: { iv: { N: '4' } } } }),

      test('j1.Map To Dynamo',
        _inferDynamoValueTypes({ A: { a: { i: 1, ii: 2 }, b: { iii: 3 } }, B: { iv: 4 } }),
        { A: { M: { a: { M: { i: { N: '1' }, ii: { N: '2' } } }, b: { M: { iii: { N: '3' } } } } }, B: { M: { iv: { N: '4' } } } })
      // test('j2.Map To Dynamo',
      //   __inferDynamoValueTypes({ A: { a: { i: 1, ii: 2 }, b: { iii: 3 } }, B: { iv: 4 } }),
      //   { A: { M: { a: { M: { i: { N: '1' }, ii: { N: '2' } } }, b: { M: { iii: { N: '3' } } } } }, B: { M: { iv: { N: '4' } } } })
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
