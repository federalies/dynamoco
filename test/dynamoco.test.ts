import isCi from 'is-ci'
import { groupOfTestsNeedingSetup, testMaker } from './index.test'
import { DynamoDB, SharedIniFileCredentials } from 'aws-sdk'
import { Converter } from 'aws-sdk/clients/dynamodb'
// eslint-disable-next-line no-unused-vars
import type { IGroupReturn } from './index.test' // IComparitorFn, ITestReturn, ITestFn
import { promisify } from 'util'
import { exec } from 'child_process'
import { dynamoco, mocoQuery } from '../src'

const execP = promisify(exec)
const toDynamo = Converter.marshall
// const fromDynamo = Converter.unmarshall

// #endregion inline-Micro-Testing-Framework
// const eq = (a:unknown, e:unknown) => a === e
const mockMsgId = () => `${Math.random() * 999_999_999}`

const runTheLocalService = async () => {
  const pullCmd = 'docker pull amazon/dynamodb-local'
  const runCmd = 'docker run -p 8000:8000 amazon/dynamodb-local &>/dev/null &'

  console.log({ pullCmd })
  await execP(pullCmd)
  console.log({ runCmd })
  await execP(runCmd)

  return null
}
/*
    Could do this...

    {[tableName:string]:{
        tableDef: [{AttributeName:'', AttributeType:'S', KeyRange: 'HASH' | 'RANGE' }],
        throughput: {read:5, write:5}
        gsi?:[],
        lsi?:[]
    }
 */
const createTables = async (d:DynamoDB, tableDefs:unknown) => {
  const tbls = await d.listTables().promise()

  if (tbls.TableNames?.includes('Emails')) {
    await d.deleteTable({ TableName: 'Emails' }).promise()
  }

  await d.createTable({
    TableName: 'Emails',
    KeySchema: [
      { KeyType: 'HASH', AttributeName: 'User' },
      { KeyType: 'RANGE', AttributeName: 'Date' }
    ],
    AttributeDefinitions: [
      { AttributeType: 'S', AttributeName: 'User' },
      { AttributeType: 'N', AttributeName: 'Date' },
      { AttributeType: 'S', AttributeName: 'MsgId' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'MsgId',
        KeySchema: [{ KeyType: 'HASH', AttributeName: 'MsgId' }],
        Projection: { ProjectionType: 'KEYS_ONLY' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 1,
          WriteCapacityUnits: 1
        }
      }
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
  }).promise()

  return null
}
const fillTable = async (d:DynamoDB) => {
  const batch = [
    toDynamo({
      User: 'myAlias',
      Date: 1_589_303_429_255,
      _UserDate: 'myAlias::1589303429255',
      MsgId: '566893153.4859517',
      From: 'someGuy@example.com',
      To: ['myAlias@filters.email'],
      'Reply-To': 'myAlias+23vqewsfvwesvds@filters.email',
      Headers: {
        SPF: 'asdasdsadasd',
        DKIM: 'asdasdasd'
      },
      Subject: 'Fake Data1',
      Body: 'This is the body of the email',
      BodyText: 'This is the body of the email',
      BodyHTML: '<div>This is the body of the email</div>'
    }),
    toDynamo({
      User: 'myAlias',
      Date: 1_589_303_449_032,
      _UserDate: 'myAlias::1589303449032',
      MsgId: '684463664.036467',
      From: 'otherPerson@domain.com',
      To: ['myAlias@filters.email'],
      'Reply-To': 'myAlias+23vqewsfvwesvds@filters.email',
      Headers: {
        SPF: 'asdasdsadasd',
        DKIM: 'asdasdasd'
      },
      Subject: 'Fake Data2',
      Body: 'This is second body you will see. Maybe its Heaven to see your second body.',
      BodyText: 'This is second body you will see. Maybe its Heaven to see your second body.',
      BodyHTML: '<div>This is second body you will see. Maybe its Heaven to see your second body.</div>'
    }),
    toDynamo({
      User: 'myAlias',
      Date: 1_589_303_460_428,
      _UserDate: 'myAlias::1589303460428',
      MsgId: '987090915.6604751',
      From: 'somePerson@domain.com',
      To: ['myAlias@filters.email'],
      'Reply-To': 'myAlias+23vqewsfvwesvds@filters.email',
      Headers: {
        SPF: 'asdasdsadasd',
        DKIM: 'asdasdasd'
      },
      Subject: 'Fake Data3',
      Body: 'When in the third act what happens?',
      BodyText: 'When in the third act what happens?',
      BodyHTML: '<div>When in the third act what happens?</div>'
    })
  ]

  const RequestItems = { Emails: batch.map(Item => ({ PutRequest: { Item } })) }
  await d.batchWriteItem({ RequestItems }).promise()
  return null
}
const listTables = async (d:DynamoDB) => {}

const setupTableDataBeforeTest = async (d:DynamoDB):Promise<void> => {
  !isCi && await runTheLocalService()
  await createTables(d, {}).catch(er => console.error('is Docker Daemon running?\n\n\n', er))
  await listTables(d)
  await fillTable(d)
}

const deleteTable = async (d:DynamoDB) => {
  await d.deleteTable({ TableName: 'Emails' }).promise()
}

// main
const allGroups = async () => {
  const [test, groupTest] = testMaker(__filename)
  let d:DynamoDB
  if (isCi) {
    d = new DynamoDB({ region: 'us-west-2', endpoint: 'http://localhost:8000' })
  } else {
    const credentials = new SharedIniFileCredentials({ profile: 'personal_default' })
    d = new DynamoDB({ credentials, region: 'us-west-2', endpoint: 'http://localhost:8000' })
  }

  // console.log({d})

  const groupContext = groupOfTestsNeedingSetup(d, test, setupTableDataBeforeTest, deleteTable)

  return groupTest('DynaMoco Mock TestsFor Email Table',
    groupContext(
      {
        name: '1.Simple - GetItem Test',
        actual: async (d:DynamoDB) => {
          const r = await dynamoco(d)
            .getItem('Emails', { User: 'myAlias', Date: 1589303449032 })
          return r._Item._UserDate
        },
        expected: async () => 'myAlias::1589303449032'
      },
      {
        name: '2.Simple - GetItem Test',
        actual: async (d:DynamoDB) => {
          const r = await dynamoco(d).getItem('Emails', { User: 'myAlias', Date: 1589303460428 })
          return r._Item._UserDate
        },
        expected: async () => 'myAlias::1589303460428'
      },
      {
        name: '3.Simple - Query Test Using Connection',
        actual: async (d:DynamoDB) => {
          const queryParam = mocoQuery('Emails')
            .select('COUNT')
            .where(['User', '=', 'myAlias'])
            .where(['AND', ['Date', '<=', 1589303460428 + 1]])
            .extract()
          // console.log({queryParam})
          const regular = await d.query(queryParam).promise()
          return regular.Count
        },
        expected: async () => 3
      },
      {
        name: '4.Simple - Query Test using Dynamoco',
        actual: async (d:DynamoDB) => {
          const queryParam = mocoQuery('Emails')
            .select('COUNT')
            .where(['User', '=', 'myAlias'])
            .where(['AND', ['Date', '<=', 1589303460428 + 1]])
            .extract()
          const ez = await dynamoco(d).query('Emails', queryParam)
          return ez.Count
        },
        expected: async () => 3
      },
      {
        name: '5.Simple - Query Test using Dynamoco',
        actual: async (d:DynamoDB) => {
          const queryParam = mocoQuery('Emails')
            .select('*')
            .where(['User', '=', 'myAlias'])
            .where(['AND', ['Date', 'BETWEEN', [1_589_303_440_000, 1_589_303_459_000]]])
            .extract()
          const ez = await dynamoco(d).query('Emails', queryParam)
          return ez.Count
        },
        expected: async () => 1
      },
      {
        name: '6. DBML',
        actual: async (d:DynamoDB) => {
          const r = await dynamoco(d).describeTable('Emails')
          return r.DBML.replace(/[\s]+/gi, ' ')
        },
        expected: async () =>
`Table Emails {
    User text [pk]
    Date numeric [note: Used as Range Key]
    MsgId text
}`.replace(/[\s]+/gi, ' ')
      },
      {
        name: '7.Put Item',
        actual: async (d:DynamoDB) => {
          const putItemData = {
            User: 'myAlias',
            Date: 1_589_303_460_500,
            _UserDate: 'myAlias::1589303460428',
            MsgId: mockMsgId(),
            From: 'somePerson@domain.com',
            To: ['myAlias@filters.email'],
            'Reply-To': 'myAlias+23vqewsfvwesvds@filters.email',
            // Headers: { SPF: 'asdasdsadasd',DKIM: 'asdasdasd'},
            Subject: 'Fake Data4',
            Body: 'Adding This Dynamically',
            BodyText: 'Adding This Dynamically',
            BodyHTML: '<div>Adding This Dynamically</div>'
          }

          const ez = await dynamoco(d)
            .putItem('Emails', putItemData, {
              ReturnConsumedCapacity: 'TOTAL',
              ReturnItemCollectionMetrics: 'SIZE'
            })

          return ez._Attributes
        },
        expected: async () => ({})
      },
      {
        name: '8. Put Batch',
        actual: async (d:DynamoDB) => {
          const batch = [{
            User: 'myAlias',
            Date: 1_589_303_460_600,
            _UserDate: 'myAlias::1589303460428',
            MsgId: mockMsgId(),
            From: 'somePerson@domain.com',
            To: ['myAlias@filters.email'],
            'Reply-To': 'myAlias+23vqewsfvwesvds@filters.email',
            // Headers: { SPF: 'asdasdsadasd',DKIM: 'asdasdasd'},
            Subject: 'Fake Data4',
            Body: 'Adding This Dynamically',
            BodyText: 'Adding This Dynamically',
            BodyHTML: '<div>Adding This Dynamically</div>'
          },
          {
            User: 'myAlias',
            Date: 1_589_303_460_700,
            _UserDate: 'myAlias::1589303460428',
            MsgId: mockMsgId(),
            From: 'somePerson@domain.com',
            To: ['myAlias@filters.email'],
            'Reply-To': 'myAlias+23vqewsfvwesvds@filters.email',
            // Headers: { SPF: 'asdasdsadasd',DKIM: 'asdasdasd'},
            Subject: 'Fake Data4',
            Body: 'Adding This Dynamically',
            BodyText: 'Adding This Dynamically',
            BodyHTML: '<div>Adding This Dynamically</div>'
          }] as any[]

          const ez = await dynamoco(d)
            .putBatch({ Emails: batch })
          return ez
        },
        expected: async () => ({ UnprocessedItems: {} })
      }, {
        name: '9. Get Batch',
        actual: async () => {
          const ez = await dynamoco(d).getBatch({
            Emails: [
              {
                User: 'myAlias',
                Date: 1_589_303_429_255
              },
              {
                User: 'myAlias',
                Date: 1_589_303_449_032
              }
            ]
          })
          return ez._Responses?.Emails.length
        },
        expected: async () => 2
      },
      {
        name: '10. Delete Batch',
        actual: async () => ({}),
        expected: async () => ({})
      },
      {
        name: '11. Scan',
        actual: async () => ({}),
        expected: async () => ({})
      }

    )
  )as Promise<IGroupReturn[]>
}

export default allGroups

;(async () => {
  if (!module.parent) {
    // eslint-disable-next-line no-unused-vars
    const r = await allGroups()
    // console.log(JSON.stringify({ r }, null, 2))
  }
})()
