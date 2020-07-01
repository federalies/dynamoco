import {
  mocoQuery,
  fromDynamo,
  _inferJsValues,
  _giveDynamoTypesToValues
} from './mocoQuery'

/* eslint-disable no-unused-vars */
import type { DynamoDB } from 'aws-sdk'
import type {
  validJsDynamoTypes,
  DynamoAttrValueType,
  DynamoMap,
  jsTypesFromDynamo,
  validJs2DynamoDict,
  MocoPredicateClause,
  ScanReqState,
  QueryReqState
} from './mocoQuery'

import type {
  Key,
  PutItemInputAttributeMap,
  BatchGetRequestMap,
  AttributeValue,
  ItemList,
  QueryInput,
  TableDescription,
  KeySchema,
  AttributeMap,
  QueryOutput,
  ScanOutput,
  CreateGlobalSecondaryIndexAction,
  UpdateGlobalSecondaryIndexAction,
  DeleteGlobalSecondaryIndexAction,
  StreamSpecification,
  SSESpecification,
  ReplicationGroupUpdateList
} from 'aws-sdk/clients/dynamodb'
/* eslint-enable no-unused-vars */

const { isArray } = Array

const parseTableProps = (table:string, tableDef: TableDescription): string => {
  const preamble = `Table ${table} {\n`
  // eslint-disable-next-line no-unused-vars
  const indexHeader = 'index {'
  const tab = '\t'
  const closer = '\n}'

  const mapping = {
    // 'dynamo':'postgres'
    // 'NULL' : 'varchar',
    S: 'text',
    SS: 'text[]',
    BOOL: 'boolean',
    N: 'numeric',
    NS: 'numeric[]',
    B: 'bytea',
    BS: 'bytea[]',
    L: 'JSON', // @todo - needs further looking into
    M: 'JSON' // @todo - needs further looking into
  } as {[str:string]:string}

  const columns = (tableDef.AttributeDefinitions || []).reduce((p, c) => ({
    ...p,
    [c.AttributeName]: {
      columnName: c.AttributeName,
      origType: c.AttributeType,
      dbmlType: mapping[c.AttributeType] ?? 'varchar' as string,
      settings: {
        notes: '',
        primaryKey: false
      }
    }
  }), {} as {[col:string]:{
        columnName: string
        origType: string
        dbmlType: string
        settings:{
            notes: string,
            primaryKey: boolean
        }
    }})

  for (const key of tableDef.KeySchema as KeySchema) {
    if (key.KeyType === 'HASH') {
      columns[key.AttributeName].settings.primaryKey = true
    } else {
      columns[key.AttributeName].settings.notes = 'Used as Range Key'
    }
  }

  const settingsPrint = (i:{notes:string, primaryKey:boolean}) => {
    const settingsArr = [] as string[]
    i.notes.length > 1 && settingsArr.push(`note: ${i.notes}`)
    i.primaryKey && settingsArr.push('pk')

    if (settingsArr.length > 0) {
      return `[${settingsArr.join(', ')}]`
    } else {
      return ''
    }
  }

  const cols = Object.values(columns).map(c => `${tab} ${c.columnName} ${c.dbmlType} ${settingsPrint(c.settings)}`).join('\n')

  return preamble + cols + closer
}

export const _stipDynamoTypingsForValues = (input: {[sttibuteName:string]:AttributeValue | DynamoAttrValueType} = {}): {[sttibuteName:string]:jsTypesFromDynamo} => {
  return Object.entries(input).reduce((acc, [attrib, typedDynamoVal]) => ({
    ...acc,
    [attrib]: _inferJsValues(typedDynamoVal as DynamoAttrValueType)
  }), {} as {[sttibuteName:string]:jsTypesFromDynamo})
}

// export const toDynamo = _giveDynamoTypesToValues

export const dynamoco = (db: DynamoDB, defaults?:{}) => {
  const getItem = async (TableName: string, input:validJs2DynamoDict, opts?: GetItemOpts) => {
    const Key = _giveDynamoTypesToValues(input) as Key
    const res = await db.getItem({ TableName, Key, ...opts }).promise()
    const _Item = _stipDynamoTypingsForValues(res.Item)
    return { ...res, _Item }
  }

  const putItem = async (TableName:string, item:validJs2DynamoDict, opts?:PutItemOpts) => {
    const Item = _giveDynamoTypesToValues(item) as PutItemInputAttributeMap
    // console.log('before:', { TableName, Item, opts })
    const res = await db.putItem({ TableName, Item, ...opts }).promise()
    // console.log('after:', { res })
    const _Attributes = _stipDynamoTypingsForValues(res.Attributes)
    return { ...res, _Attributes }
  }

  const getBatch = async (batchReq: {[table:string]:validJs2DynamoDict[]}) => {
    const RequestItems = Object.entries(batchReq)
      .reduce((acc, [table, attributeValObjArr]) => ({
        ...acc,
        [table]: { Keys: attributeValObjArr.map(_giveDynamoTypesToValues) }
      }), {} as BatchGetRequestMap)

    const res = await db.batchGetItem({ RequestItems }).promise()
    const _Responses = Object.entries(res.Responses as {[table: string]: ItemList})
      .reduce((
        acc: { [table: string]: { [attribute: string]: jsTypesFromDynamo }[] },
        [table, typedAttribMapArr] : [string, AttributeMap[]]
      ) => ({
        ...acc,
        [table]: typedAttribMapArr.map((item : AttributeMap) => _stipDynamoTypingsForValues(item))
      }), {} as {[table:string]: {[attribute:string]: jsTypesFromDynamo}[] })
    return { ...res, _Responses }
  }

  const putBatch = async (batchReq:{[table:string]: validJs2DynamoDict[]}, opts?:WriteBatchOpts) => {
    const RequestItems = Object.entries(batchReq).reduce((acc, [table, putReqArr]) =>
      ({ ...acc, [table]: putReqArr.map(v => ({ PutRequest: { Item: _giveDynamoTypesToValues(v) } })) })
    , {})
    return db.batchWriteItem({ RequestItems, ...opts }).promise()
    // res.UnprocessedItems do not transform these since they are ready to be returned in this form
  }

  const deleteBatch = async (batchReq:{[table:string]:validJs2DynamoDict[]}, opts?:WriteBatchOpts) => {
    const RequestItems = Object.entries(batchReq).reduce((acc, [table, keysForDelReqArr]) =>
      ({ ...acc, [table]: keysForDelReqArr.map(v => ({ DeleteRequest: { Key: _giveDynamoTypesToValues(v) } })) })
    , {})
    return db.batchWriteItem({ RequestItems, ...opts }).promise()
  }

  const query = async (table:string,
    mocoWhereClause:MocoPredicateClause | QueryInput,
    mocoFilterClause?:MocoPredicateClause,
    opts?:ExtraQueryOptions) => {
    const q = mocoQuery(table)
    const query = isArray(mocoWhereClause)
      ? mocoFilterClause
        ? q.where(mocoWhereClause).filter(mocoFilterClause).extract()
        : q.where(mocoWhereClause).extract()
      : mocoWhereClause

    const res = await db.query({ ...query, ...opts }).promise() as QueryOutput & {_Items?: {[attribute:string]:jsTypesFromDynamo}[]}
    return {
      ...res,
      ...(res.Items
        ? { _Items: res.Items.map(v => _stipDynamoTypingsForValues(v)) }
        : {}
      )
    }
  }

  const scan = async (table:string, mocoFilterClause:MocoPredicateClause, mocoScanState?: ScanReqState) => {
    const scanParam = mocoQuery(table)
    const scanWithThis = scanParam.filter(mocoFilterClause).extract()
    const res = await db.scan({ ...mocoScanState, ...scanWithThis }).promise()
    return {
      ...res,
      ...(res.Items
        ? { _Items: res.Items.map(v => _stipDynamoTypingsForValues(v)) }
        : {}
      )
    }
  }

  const describeTable = async (TableName:string) => {
    const res = await db.describeTable({ TableName }).promise()
    const DBML = parseTableProps(TableName, res.Table as TableDescription)
    return { ...res, DBML }
  }

  const updateTable = async (table: string, onDemandMode:boolean, opts?:UpdateTable) => {
    return db.updateTable({
      TableName: table,
      BillingMode: onDemandMode ? 'PAY_PER_REQUEST' : 'PROVISIONED',
      ...(opts?.attrDefs ? { AttributeDefinitions: opts.attrDefs } : {}),
      ...(opts?.gsi ? { GlobalSecondaryIndexUpdates: opts.gsi } : {}),
      ...(opts?.throughput ? { ProvisionedThroughput: { ReadCapacityUnits: opts.throughput.read, WriteCapacityUnits: opts.throughput.write } } : {}),
      ...(opts?.replicaUpdates ? { ReplicaUpdates: opts.replicaUpdates } : {}),
      ...(opts?.SSE ? { SSESpecification: opts.SSE } : {}),
      ...(opts?.streamSpec ? { StreamSpecification: opts.streamSpec } : {})
    }).promise()
  }

  async function * paginate (req: ScanReqState & {TableName:string} | QueryReqState):AsyncGenerator<(QueryOutput | ScanOutput) & {_Items?: jsTypesFromDynamo[] }> {
    let res: QueryOutput | ScanOutput
    if ('KeyConditionExpression' in req || 'ScanIndexForward' in req) {
      // If given a conflicting `mode` and `RequestType`, use the `RequestType` structure,  Since it makes things extract faster.
      res = await db.query(req).promise()
    } else {
      res = await db.scan(req).promise()
    }
    const _Items = res.Items ? res.Items.map(entry => fromDynamo(entry as DynamoAttrValueType)) : undefined
    yield { ...res, _Items }
    if (res.LastEvaluatedKey) {
      yield * paginate({ ...req, ExclusiveStartKey: res.LastEvaluatedKey })
    }
  }

  return {
    getItem,
    putItem,
    getBatch,
    putBatch,
    deleteBatch,
    query,
    scan,
    describeTable,
    updateTable,
    // updateItem,
    // transactGetItems
    // transactWriteItems
    paginate,
    _db: db
  }
}

export default dynamoco

// #region types

interface GetItemOpts {
    ConsistentRead?: boolean
    ReturnConsumedCapacity?: 'INDEXES'| 'TOTAL'| 'NONE'
    ProjectionExpression?: string
    ExpressionAttributeNames?: {[key: string]: string }
}

interface PutItemOpts {
    ConditionExpression?: string // similar to KeyConditionExpressions @see https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.ConditionExpressions.html
    ExpressionAttributeNames?: {[key: string]: string }
    ExpressionAttributeValues?: {[key: string]: DynamoAttrValueType}
    ReturnValues?: 'NONE'| 'ALL_OLD'| 'UPDATED_OLD'| 'ALL_NEW'| 'UPDATED_NEW'
    ReturnConsumedCapacity?: 'INDEXES'| 'TOTAL'| 'NONE'
    ReturnItemCollectionMetrics?: 'SIZE'| 'NONE'
}

interface WriteBatchOpts{
    ReturnConsumedCapacity?: 'INDEXES'| 'TOTAL'| 'NONE'
    ReturnItemCollectionMetrics?: 'SIZE'|'NONE'
}

interface ExtraQueryOptions{
    IndexName?: string
    Limit?: number
    ConsistentRead?: boolean
    ScanIndexForward?: boolean
    ExclusiveStartKey?: Key
    Select?:
    | 'ALL_ATTRIBUTES'
    | 'ALL_PROJECTED_ATTRIBUTES' /* only for index - and depends on how index is setup */
    | 'COUNT'
    | 'SPECIFIC_ATTRIBUTES' // falls back to `AttributesToGet` && using ProjectionExpression requires this option or Err
    ReturnConsumedCapacity?: 'INDEXES'| 'TOTAL'| 'NONE'
    ProjectionExpression?: string
    ExpressionAttributeNames?: {[key: string]: string } // really is just a {placeholder : value} map to get round reserve words in the expression String
    ExpressionAttributeValues?: {[key: string]: DynamoAttrValueType};
}

interface UpdateTable {
    attrDefs?: {
        AttributeName: string
        AttributeType: 'S'|'N'|'B'}[]
    throughput?: {read:number, write:number};
    gsi?: (
        | {Create: CreateGlobalSecondaryIndexAction}
        | {Update: UpdateGlobalSecondaryIndexAction}
        | {Delete: DeleteGlobalSecondaryIndexAction})[]
    streamSpec?: StreamSpecification;
    SSE?: SSESpecification;
    replicaUpdates?: ReplicationGroupUpdateList;
}

// #endregion types
