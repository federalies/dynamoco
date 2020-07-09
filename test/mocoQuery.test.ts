import { URL } from 'url'
import { testMaker, isErrorThrown } from './index.test'
import { mocoQuery } from '../src/index'
// eslint-disable-next-line no-unused-vars
import type { QueryInput } from 'aws-sdk/clients/dynamodb'

// #endregion inline-Micro-Testing-Framework

// main
const allGroups = async () => {
  const [test, groupTest] = testMaker(__filename)
  return groupTest('MocoQuery Query Builder',

    groupTest('Easy Tests',
      test('Check Defaults',
        mocoQuery('table1').extract(),
                {
                  TableName: 'table1',
                  Select: 'ALL_ATTRIBUTES',
                  ReturnConsumedCapacity: 'TOTAL'
                } as QueryInput
      ),
      test('Using Limit',
        mocoQuery('table1').limit(100).extract(),
                {
                  TableName: 'table1',
                  Select: 'ALL_ATTRIBUTES',
                  ReturnConsumedCapacity: 'TOTAL',
                  Limit: 100
                } as QueryInput
      )
    ),

    groupTest('Level2 Tests',
      test('exmaple - asc.consistent.filter(gt)',
        mocoQuery('table1')
          .ascending()
          .consistentRead(true)
          .filter(['Attribute1', 'equals', 3] as any).extract(),
                {
                  TableName: 'table1',
                  Select: 'ALL_ATTRIBUTES',
                  ReturnConsumedCapacity: 'TOTAL',
                  ScanIndexForward: true,
                  ConsistentRead: true,
                  FilterExpression: 'Attribute1 = :att',
                  ExpressionAttributeValues: {
                    ':att': { N: '3' }
                  }
                } as QueryInput
      ),
      test('exmaple - select.where(BETWEEN)',
        mocoQuery('table1')
          .select('COUNT')
          .where(['Attribute1', 'BETWEEN', ['A', 'D']])
          .extract(),
                {
                  TableName: 'table1',
                  Select: 'COUNT',
                  ReturnConsumedCapacity: 'TOTAL',
                  KeyConditionExpression: 'Attribute1 BETWEEN :attLo AND :attHi',
                  ExpressionAttributeValues: {
                    ':attLo': { S: 'A' },
                    ':attHi': { S: 'D' }
                  }
                } as QueryInput
      ),
      test('Using Limit',
        mocoQuery('table1')
          .select('*')
          .startKey({ KeyedAttr: { S: 'someString' } })
          .filter(['Attribute2', 'begins_with', 'prefix'])
          .limit(1000)
          .extract(),
                {
                  TableName: 'table1',
                  ReturnConsumedCapacity: 'TOTAL',
                  Select: 'ALL_ATTRIBUTES',
                  Limit: 1000,
                  ExclusiveStartKey: { KeyedAttr: { S: 'someString' } },
                  FilterExpression: 'begins_with(Attribute2,:att)',
                  ExpressionAttributeValues: {
                    ':att': { S: 'prefix' }
                  }
                } as QueryInput
      )
    ),

    groupTest('Level3 Tests',
      test('exmaple - adding stacked Filters',
        mocoQuery('table1')
          .filter(['Attribute1', '>', 6])
          .filter(['AND', ['Date', '<', 2025]])
          .extract(),
                {
                  TableName: 'table1',
                  ReturnConsumedCapacity: 'TOTAL',
                  Select: 'ALL_ATTRIBUTES',
                  FilterExpression: 'Attribute1 > :att AND #dat < :dat',
                  ExpressionAttributeValues: {
                    ':att': { N: '6' },
                    ':dat': { N: '2025' }
                  },
                  ExpressionAttributeNames: {
                    '#dat': 'Date'
                  }
                } as QueryInput
      ),
      test('exmaple - adding stacked Where Clauses',
        mocoQuery('table1')
          .filter('Attributè2 <= :att')
          .where('Attribute1 > :att')
          .where(['AND', ['Date', '<', 2025]])
          .expressionAttributeValues({ ':att': 7 })
          .extract(),
                {
                  TableName: 'table1',
                  ReturnConsumedCapacity: 'TOTAL',
                  Select: 'ALL_ATTRIBUTES',
                  KeyConditionExpression: 'Attribute1 > :att AND #dat < :dat',
                  FilterExpression: 'Attributè2 <= :att',
                  ExpressionAttributeValues: {
                    ':att': { N: '7' },
                    ':dat': { N: '2025' }
                  },
                  ExpressionAttributeNames: {
                    '#dat': 'Date'
                  }
                } as QueryInput
      )
    ),
    test('exmaple - Code Coverage Sandbag Example',
      mocoQuery('table1')
        .descending()
        .expressionAttributeNames({ '#d': 'Date' })
        .expressionAttributeValues({ ':dt': 2020 })
        .filterExpression('#d <= :dt')
        .select(['Attr1.SubA', 'Attr2', 'Attr3'])
        .projectionExpression('Attr1.SubA', 'Attr2', 'Attr3')
        .usingIndex('myIndex')
        .returnConsumedCapacity('NONE')
        .extract(),
          {
            TableName: 'table1',
            IndexName: 'myIndex',
            ReturnConsumedCapacity: 'NONE',
            Select: 'SPECIFIC_ATTRIBUTES',
            ProjectionExpression: 'Attr1.SubA,Attr2,Attr3',
            ExpressionAttributeValues: {
              ':dt': { N: '2020' }
            },
            ExpressionAttributeNames: {
              '#d': 'Date'
            },
            FilterExpression: '#d <= :dt'
          } as QueryInput
    ),
    test('Is Error Thrown.1',
      isErrorThrown(
        () => mocoQuery('table1')
          .select('ALL_PROJECTED_ATTRIBUTES')
          .select('BAD INPUT' as any)
          .extract()
      ),
      true
    ),
    test('Is Error Thrown.1',
      isErrorThrown(
        () => mocoQuery('table1')
          .select('ALL_PROJECTED_ATTRIBUTES')
          .select('BAD INPUT' as any)
          .extract()
      ),
      true
    ),
    test('Expression Attr Values',
      () => mocoQuery('table1').expressionAttributeValues({ a: true }).extract(),
      () => {}
    ),
    test('Dyanmo Query to URL',
      () => mocoQuery('table1')
        .select('COUNT')
        .where(['pk', '=', 'Value1'])
        .where(['AND', ['sk', 'begins_with', 'prefix']])
        .filter(['attr1', 'begins_with', 'prefix'])
        .filter(['AND', ['attr2', '=', null]])
        .filter(['AND', ['attr3Not42', '<>', 42]])
        .consistentRead(true)
        .toUrlString(),
      () => 'dynamo://table1/pk+=+%22Value1%22/sk+begins_with+%22prefix%22?attr1+begins_with+%22prefix%22&AND+attr2+=+null&AND+attr3Not42+%3C%3E+42#ConsistentRead=true&Select=%22COUNT%22&ReturnConsumedCapacity=%22TOTAL%22'
    ),
    test('Dyanmo Query from URLstring',
      () => mocoQuery('').fromUrl(
        // configure by a URL String
        mocoQuery('table1')
          .select('COUNT')
          .where(['pk', '=', 'Value1'])
          .where(['AND', ['sk', 'begins_with', 'prefix']])
          .filter(['attr1', '<>', false])
          .filter(['AND', ['attr2', '=', null]])
          .filter(['AND', ['attr3Not42', '<>', 42]])
          .descending()
          .consistentRead(true)
          .toUrlString()
      ).toUrlString(),
      () => mocoQuery('table1')
        .select('COUNT')
        .where(['pk', '=', 'Value1'])
        .where(['AND', ['sk', 'begins_with', 'prefix']])
        .filter(['attr1', '<>', false])
        .filter(['AND', ['attr2', '=', null]])
        .filter(['AND', ['attr3Not42', '<>', 42]])
        .descending()
        .consistentRead(true)
        .toUrlString()
    ),
    test('Dyanmo Query from URL',
      () => {
        const url = mocoQuery('table1')
          .select('COUNT')
          .where(['pk', '=', 'Value1'])
          .where(['AND', ['sk', 'begins_with', 'prefix']])
          .filter(['attr1', '<>', false])
          .filter(['AND', ['attr2', '=', null]])
          .filter(['AND', ['attr3Not42', '<>', 42]])
          .consistentRead(true)
          .toURL()

        return mocoQuery('').fromUrl(url).toUrlString()
      },
      () => mocoQuery('table1')
        .select('COUNT')
        .where(['pk', '=', 'Value1'])
        .where(['AND', ['sk', 'begins_with', 'prefix']])
        .filter(['attr1', '<>', false])
        .filter(['AND', ['attr2', '=', null]])
        .filter(['AND', ['attr3Not42', '<>', 42]])
        .consistentRead(true)
        .toUrlString()
    ),
    test('Dyanmo Query from URLString',
      () => {
        const url = mocoQuery('table1')
          .select('COUNT')
          .where(['pk', '=', 'Value1'])
          .where(['AND', ['sk', 'begins_with', 'prefix']])
          .filter(['attr1', '<>', false])
          .filter(['AND', ['attr2', '=', null]])
          .filter(['AND', ['attr3Not42', '<>', 42]])
          .consistentRead(true)
          .toUrlString()

        return mocoQuery('').fromUrl(url).toUrlString()
      },
      () => mocoQuery('table1')
        .select('COUNT')
        .where(['pk', '=', 'Value1'])
        .where('AND sk begins_with prefix')
        .filter(['attr1', '<>', false])
        .filter(['AND', ['attr2', '=', null]])
        .filter(['AND', ['attr3Not42', '<>', 42]])
        .consistentRead(true)
        .toUrlString()
    ),
    test('Out of Order Filters should give equiv URL objects',
      () => mocoQuery('table1')
        .select('COUNT')
        .where(['pk', '=', 'Value1'])
        .where(['AND', ['sk', 'begins_with', 'prefix']])
        .filter(['attr1', '<>', false])
        // swapped order
        .consistentRead(true)
        .filter(['AND', ['attr3Not42', '<>', 42]])
        .filter(['AND', ['attr2', '=', null]])
        .toURL(),
      () => mocoQuery('table1')
        .select('COUNT')
        .where(['pk', '=', 'Value1'])
        .where(['AND', ['sk', 'begins_with', 'prefix']])
        .filter(['attr1', '<>', false])
        .filter(['AND', ['attr2', '=', null]])
        .filter(['AND', ['attr3Not42', '<>', 42]])
        .consistentRead(true)
        .toURL()
    ),
    test('Basic URL',
      mocoQuery('table1').toURL(),
      new URL('dynamo://table1#Select=All')),
    test('dummy', 1, 1)
  )
}

;(async () => {
  if (module.parent) {
    return allGroups
  } else {
    await allGroups().catch(er => { console.error(er); process.exitCode = 0 })
  }
})()

export default allGroups
