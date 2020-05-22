import { mocoQuery } from '../src/index'
import { testMaker, isErrorThrown } from './index.test'
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
    )
  )
}

;(async () => {
  if (!module.parent) {
    // eslint-disable-next-line no-unused-vars
    const r = await allGroups()
    // console.log(JSON.stringify({ r }, null, 2))
  }
})()

export default allGroups

// add
/*
.expressionAttributeValues
.expressionAttributeNames
.filterExpression
.projectionExpression
.usingIndex
.returnConsumedCapacity
.select(['','',''])
.select('ALL_PROJECTED_ATTRIBUTES')
*/
