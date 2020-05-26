/* eslint-disable no-unused-vars */
import type { DynamoDB } from 'aws-sdk'
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
import { reservedWords } from './dynamoReservedWords'
import fs from 'fs'
import path from 'path'

const isError = (input:any):input is Error => input instanceof Error
const { isArray } = Array
const isBuffer = Buffer.isBuffer
const isString = (i:string | any): i is string => typeof i === 'string' || i instanceof String
const isBool = (i:boolean | any): i is boolean => typeof i === 'boolean' || i instanceof Boolean
const isNumber = (i:number | any): i is number => typeof i === 'number' || i instanceof Number
const isObj = (i:object | any): i is object => typeof i === 'object' || i instanceof Object
const isBinary = (i:Buffer | any): i is Buffer => Buffer.isBuffer(i)
const isNull = (i:null | any): i is null => i === null
const isPrimitive = (value:any): value is string | number |Buffer | null | boolean => (typeof value !== 'object' && typeof value !== 'function') || value === null

export const parseNumber = (input:string): Number | Error => {
  return !Number.isNaN(Number.parseFloat(input))
    ? Number.parseFloat(input)
    : new Error('Got an N or NS typed data element that was not a parsable string')
}

export const parseNumberOrThrow = (input:string): number => {
  const numErr = parseNumber(input)
  if (isError(numErr)) {
    throw numErr
  } else {
    return numErr as number
  }
}

export const toDynamo = (input: validJsDynamoTypes):DynamoAttrValueType => {
  if (isPrimitive(input) || isArray(input) || isBuffer(input)) {
    return _inferDynamoValueTypes(input)
  } else {
    return Object.entries(input).reduce((p, [key, val], i, a) => {
      return {
        ...p,
        [key]: _inferDynamoValueTypes(val)
      }
    }, {} as DynamoAttrValueType)
  }
}

const _inferDynamoValueTypes = (input:validJsDynamoTypes):DynamoAttrValueType => {
  if (isString(input)) {
    return { S: input }
  } else if (isBool(input)) {
    return { BOOL: input as boolean }
  } else if (isNumber(input)) {
    return { N: input.toString() }
  } else if (isBinary(input)) {
    return { B: Buffer.from(input) }
  } else if (isNull(input)) {
    return { NULL: true }
  } else if (isArray(input)) {
    // all same same typed array?
    const firstTypeof = typeof input[0]
    const firstProtoOf = Object.getPrototypeOf(input[0])
    // eslint-disable-next-line valid-typeof
    const allSame = input.every((v :string | number | Buffer) => typeof v === firstTypeof && Object.getPrototypeOf(v) === Object.getPrototypeOf(input[0]))
    if (!allSame) {
      return { L: (input as (string | Buffer | number)[]).map((v: string | number | Buffer) => _inferDynamoValueTypes(v)) }
    } else {
      if (firstTypeof === 'string') {
        return { SS: input as string[] }
      } else if (firstTypeof === 'number') {
        return { NS: (input as number[]).map(v => v.toString()) }
      } else {
        return { BS: input as Buffer[] }
      }
    }
  } else if (isObj(input)) {
    return {
      M: Object.entries(input).reduce((acc, [attrib, value]) => ({
        ...acc,
        [attrib]: _inferDynamoValueTypes(value) as DynamoAttrValueType
      }), {} as {[Attribute:string]: DynamoAttrValueType})
    } as DynamoMap
  } else {
    throw new Error('WAT kindof data type did you give???')
  }
}

export const fromDynamo = (input: DynamoAttrValueType): jsTypesFromDynamo => {
  const typeKey = Object.keys(input)[0] as 'S' | 'N' | 'B' | 'BOOL' | 'NULL' | 'BS' | 'SS' | 'NS' | 'L' | 'M' | string
  if (['S', 'N', 'B', 'BOOL', 'NULL', 'BS', 'SS', 'NS', 'L', 'M'].includes(typeKey)) {
    return _inferJsValues(input)
  } else {
    // hold on to the top key??
    return _inferJsValues(input)
  }
}

const _inferJsValues = (input: DynamoAttrValueType): jsTypesFromDynamo => {
  if ('S' in input) {
    return Object.values(input)[0].toString() as string
  } else if ('N' in input) {
    return parseNumberOrThrow(Object.values(input)[0]) as number
  } else if ('B' in input) {
    return Buffer.from(Object.values(input)[0]) as Buffer
  } else if ('SS' in input) {
    return Object.values(input)[0] as string[]
  } else if ('NS' in input) {
    return Object.values(input)[0].map(parseNumberOrThrow) as number[]
  } else if ('BS' in input) {
    return Object.values(input)[0].map(b => Buffer.from(b)) as Buffer[]
  } else if ('NULL' in input) {
    return null
  } else if ('BOOL' in input) {
    return Object.values(input)[0] as boolean
  } else if ('L' in input) {
    return Object.values(input)[0].map(item => _inferJsValues(item)) as jsTypesFromDynamo[]
  } else if ('M' in input) {
    const dictOfTypedVals = Object.values(input)[0]
    return Object.entries(dictOfTypedVals).reduce((acc, [keyname, item]) => ({
      ...acc,
      [keyname]: _inferJsValues(item)
    }), {}) as {[attribute:string]:jsTypesFromDynamo}
  } else {
    return Object.entries(input as {[Attr:string]:DynamoAttrValueType}).reduce((acc, [keyname, item]) => ({
      ...acc,
      [keyname]: _inferJsValues(item)
    }), {}) as {[attribute:string]:jsTypesFromDynamo}
  }
}

const parseTableProps = (table:string, tableDef: TableDescription): string => {
  const preamble = `Table ${table} {\n`
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

const _giveDynamoTypesToValues = (i:validJs2DynamoDict):Key => {
  return Object.entries(i).reduce((acc, [attribute, value]) => ({
    ...acc,
    [attribute]: _inferDynamoValueTypes(value)
  }), {} as Key)
}

const queryOperators = (inputOpr:string, logLevel: number = 5): string => {
  // logLevel table
  // 0 none
  // 1 info
  // 2 debug
  // 3 log
  // 4 warn
  // 5 error

  const local = {
    '=': '=',
    '==': '=',
    '===': '=',
    EQ: '=',
    '<': '<',
    LT: '<',
    '<<': '<',
    '>': '>',
    GT: '>',
    '>>': '>',
    '<=': '<=',
    LTE: '<=',
    '>=': '>=',
    GTE: '>=',
    BETWEEN: 'BETWEEN',
    between: 'BETWEEN',
    begins_with: 'begins_with',
    BEGINS_WITH: 'begins_with',
    startsWith: 'begins_with'
  } as {[str:string]:string}

  if (inputOpr in local) {
    return local[inputOpr]
  } else {
    if (logLevel >= 4) {
      console.warn('the given operator () was unkown and is defaulting to ')
    }
    return '='
  }
}

export const mocoQuery = (table:string, startingState?: {r:QueryReqState, _m: QueryMetaState}):mocoQuery => {
  const state = {
    _m: {
      reserved: reservedWords(fs, path),
      ...startingState?._m
    } as QueryMetaState, // letter m for meta
    r: {
      TableName: table,
      Select: 'ALL_ATTRIBUTES',
      ReturnConsumedCapacity: 'TOTAL',
      ...startingState?.r
    } as QueryReqState // letter r for request
  }

  const ascending = () => {
    return mocoQuery(state.r.TableName, { _m: state._m, r: { ...state.r, ScanIndexForward: true } })
  }

  const consistentRead = (useConsistentRead: boolean) => {
    return mocoQuery(state.r.TableName, {
      _m: state._m,
      r: {
        ...state.r,
        ConsistentRead: useConsistentRead
      }
    })
  }

  const descending = () => {
    return mocoQuery(state.r.TableName, { _m: state._m, r: { ...state.r, ScanIndexForward: false } })
  }

  const expressionAttributeValues = (input: validJs2DynamoDict) => {
    return mocoQuery(state.r.TableName, {
      _m: state._m,
      r: {
        ...state.r,
        ExpressionAttributeValues:
        state.r.ExpressionAttributeValues
          ? {
            ...state.r.ExpressionAttributeValues,
            ..._giveDynamoTypesToValues(input) as {[key: string]: DynamoAttrValueType}
          }
          : _giveDynamoTypesToValues(input) as {[key: string]: DynamoAttrValueType}
      }
    })
  }

  const expressionAttributeNames = (input: {[key: string]: string }) => {
    return mocoQuery(state.r.TableName, {
      _m: state._m,
      r: {
        ...state.r,
        ExpressionAttributeNames:
        state.r.ExpressionAttributeNames
          ? {
            ...state.r.ExpressionAttributeNames,
            ...input
          }
          : input
      }
    })
  }

  const extract = () => {
    return state.r as QueryInput
  }

  const filterExpression = (filterExpr: string) => {
    return mocoQuery(state.r.TableName, {
      _m: state._m,
      r: { ...state.r, FilterExpression: filterExpr }
    })
  }

  const limit = (n:number) => {
    return mocoQuery(state.r.TableName, {
      _m: state._m,
      r: {
        ...state.r,
        Limit: n
      }
    })
  }

  const projectionExpression = (...projExpr: string[]) => {
    return mocoQuery(state.r.TableName, {
      _m: state._m,
      r: {
        ...state.r,
        ProjectionExpression: projExpr.join(','),
        Select: 'SPECIFIC_ATTRIBUTES' // reqd or err
      }
    })
  }

  const usingIndex = (indexName:string) => {
    return mocoQuery(state.r.TableName, {
      _m: state._m,
      r: {
        ...state.r,
        IndexName: indexName
      }
    })
  }

  const returnConsumedCapacity = (input: 'INDEXES' | 'TOTAL' | 'NONE' = 'TOTAL') => {
    return mocoQuery(state.r.TableName, {
      _m: state._m,
      r: {
        ...state.r,
        ReturnConsumedCapacity: input
      }
    })
  }

  const select = (input:'*'| 'COUNT'| 'ALL_PROJECTED_ATTRIBUTES' | string[]) => {
    const r = state.r
    if (input === '*') {
      // ALL
      r.Select = 'ALL_ATTRIBUTES'
      r.ProjectionExpression = undefined
    } else if (isArray(input)) {
      // given attributes
      r.Select = 'SPECIFIC_ATTRIBUTES'
      r.ProjectionExpression = input.join(',')
    } else if (input === 'COUNT') {
      r.Select = 'COUNT'
      r.ProjectionExpression = undefined
    } else if (input === 'ALL_PROJECTED_ATTRIBUTES') {
      r.Select = 'ALL_PROJECTED_ATTRIBUTES'
      r.ProjectionExpression = undefined
    } else {
      throw new Error('WAT')
    }

    return mocoQuery(state.r.TableName, {
      _m: state._m,
      r
    })
  }

  const startKey = (lastKeyEvaluated:Key) => {
    return mocoQuery(state.r.TableName, {
      _m: state._m,
      r: {
        ...state.r,
        ExclusiveStartKey: lastKeyEvaluated
      }
    })
  }

  const _mocoPredicate = (input: MocoPredicateClause):MocoPredicateClauseReturn => {
    const ret = {
      KeyConditionExpression: '',
      ExpressionAttributeValues: {},
      ExpressionAttributeNames: {}
    } as MocoPredicateClauseReturn

    const oper = queryOperators(input[1])
    const Attr = input[0]
    let abbrevAttr: string | undefined

    if (Attr.toUpperCase() in state._m.reserved) {
      abbrevAttr = `#${Attr.toLowerCase().slice(0, 3)}`
    }

    if (oper === 'BETWEEN') {
      const [valueLo, valueHi] = input[2] as number[] | string[]
      const typedValueLo = _inferDynamoValueTypes(valueLo)
      const typedValueHi = _inferDynamoValueTypes(valueHi)
      const placeholderLo = `:${Attr.toLowerCase().slice(0, 3)}Lo`
      const placeholderHi = `:${Attr.toLowerCase().slice(0, 3)}Hi`

      ret.KeyConditionExpression = `${abbrevAttr || Attr} BETWEEN ${placeholderLo} AND ${placeholderHi}`
      ret.ExpressionAttributeValues = {
        [placeholderLo]: typedValueLo,
        [placeholderHi]: typedValueHi
      }
      ret.ExpressionAttributeNames = abbrevAttr ? { [abbrevAttr]: Attr } : {}
      return ret
    } else {
      const value = input[2]
      const typedValue = _inferDynamoValueTypes(value as null | boolean | string | number)
      const placeholder = `:${Attr.toLowerCase().slice(0, 3)}`

      ret.ExpressionAttributeValues = { [placeholder]: typedValue }
      ret.ExpressionAttributeNames = abbrevAttr ? { [abbrevAttr]: Attr } : {}

      if (oper === 'begins_with') {
        ret.KeyConditionExpression = `begins_with(${abbrevAttr || Attr},${placeholder})`
        return ret
      } else {
        ret.KeyConditionExpression = `${abbrevAttr || Attr} ${oper} ${placeholder}`
        return ret
      }
    }
  }

  const filter = (_input: string | MocoPredicateClause | ['AND' | 'OR', MocoPredicateClause]) => {
    const r = { ...state.r }

    if (typeof _input === 'string') {
      const input = _input as string
      // BYO linking word
      r.FilterExpression = (r.FilterExpression || '').length > 0
        ? `${r.FilterExpression} ${input}`
        : `${input}`
      return mocoQuery(state.r.TableName, { r, _m: state._m })
    } else {
      if (isArray(_input) && typeof _input[0] === 'string' && isArray(_input[1])) {
        // merge with prior state if any
        const input = _input as ['AND' | 'OR', MocoPredicateClause]
        const expressionLinkType = input[0]
        const mocoExpr = input[1]

        const { KeyConditionExpression, ExpressionAttributeValues, ExpressionAttributeNames } = _mocoPredicate(mocoExpr)
        const FilterExpression = KeyConditionExpression // key switch for the filter method

        r.FilterExpression = (r.FilterExpression || '').length > 0
          ? `${r.FilterExpression} ${expressionLinkType} ${FilterExpression}`
          : FilterExpression

        r.ExpressionAttributeValues = Object.keys((r.ExpressionAttributeValues || {})).length > 0
          ? { ...r.ExpressionAttributeValues, ...ExpressionAttributeValues }
          : ExpressionAttributeValues

        r.ExpressionAttributeNames = Object.keys((r.ExpressionAttributeNames || {})).length > 0
          ? { ...r.ExpressionAttributeNames, ...ExpressionAttributeNames }
          : ExpressionAttributeNames

        return mocoQuery(state.r.TableName,
          {
            r: {
              ...r,
              FilterExpression: r.FilterExpression,
              ...(Object.keys(r.ExpressionAttributeValues).length > 0 ? { ExpressionAttributeValues: r.ExpressionAttributeValues } : {}),
              ...(Object.keys(r.ExpressionAttributeNames).length > 0 ? { ExpressionAttributeNames: r.ExpressionAttributeNames } : {})
            },
            _m: state._m
          })
      } else {
        // destroys prior state because zero linkage is available
        const input = _input as MocoPredicateClause
        const { KeyConditionExpression, ExpressionAttributeValues, ExpressionAttributeNames } = _mocoPredicate(input)
        const FilterExpression = KeyConditionExpression // key switch for the filter method
        return mocoQuery(state.r.TableName,
          {
            r:
                        {
                          ...r,
                          FilterExpression,
                          ...(Object.keys(ExpressionAttributeValues).length > 0 ? { ExpressionAttributeValues } : {}),
                          ...(Object.keys(ExpressionAttributeNames).length > 0 ? { ExpressionAttributeNames } : {})
                        },
            _m: state._m
          }
        )
      }
    }
  }

  const where = (_input: string | MocoPredicateClause | ['AND' | 'OR', MocoPredicateClause]) => {
    // input:: `Price`, '>', 1.00
    // input:: `Price`, 'BETEWEEN, [1.00, 5.00]
    // input:: `Descriptions`, 'begins_with, 'prefix'
    const r = { ...state.r }

    if (typeof _input === 'string') {
      const input = _input as string
      // BYO linking word
      r.KeyConditionExpression = (r.KeyConditionExpression || '').length > 0
        ? `${r.KeyConditionExpression} ${input}`
        : `${input}`
      return mocoQuery(state.r.TableName, { r, _m: state._m })
    } else if (isArray(_input) && ['AND', 'OR'].includes(_input[0]) && isArray(_input[1])) {
      // merge with prior state if any
      const input = _input as ['AND' | 'OR', MocoPredicateClause]
      const expressionLinkType = input[0]
      const mocoExpr = input[1]

      const { KeyConditionExpression, ExpressionAttributeValues, ExpressionAttributeNames } = _mocoPredicate(mocoExpr)

      r.KeyConditionExpression = (r.KeyConditionExpression || '').length > 0
        ? `${r.KeyConditionExpression} ${expressionLinkType} ${KeyConditionExpression}`
        : KeyConditionExpression

      r.ExpressionAttributeValues = Object.keys((r.ExpressionAttributeValues || {})).length > 0
        ? { ...r.ExpressionAttributeValues, ...ExpressionAttributeValues }
        : ExpressionAttributeValues

      r.ExpressionAttributeNames = Object.keys((r.ExpressionAttributeNames || {})).length > 0
        ? { ...r.ExpressionAttributeNames, ...ExpressionAttributeNames }
        : ExpressionAttributeNames

      return mocoQuery(state.r.TableName,
        {
          r: {
            ...r,
            KeyConditionExpression: r.KeyConditionExpression,
            ...(Object.keys(r.ExpressionAttributeValues).length > 0 ? { ExpressionAttributeValues: r.ExpressionAttributeValues } : {}),
            ...(Object.keys(r.ExpressionAttributeNames).length > 0 ? { ExpressionAttributeNames: r.ExpressionAttributeNames } : {})
          },
          _m: state._m
        })
    } else {
      // destroys prior state
      const input = _input as MocoPredicateClause
      const { KeyConditionExpression, ExpressionAttributeValues, ExpressionAttributeNames } = _mocoPredicate(input)
      return mocoQuery(state.r.TableName,
        {
          r:
                    {
                      ...r,
                      KeyConditionExpression,
                      ...(Object.keys(ExpressionAttributeValues).length > 0 ? { ExpressionAttributeValues } : {}),
                      ...(Object.keys(ExpressionAttributeNames).length > 0 ? { ExpressionAttributeNames } : {})
                    },
          _m: state._m
        }
      )
    }
  }

  return {
    ascending,
    consistentRead,
    descending,
    expressionAttributeValues,
    expressionAttributeNames,
    extract,
    filterExpression,
    filter,
    limit,
    projectionExpression,
    usingIndex,
    returnConsumedCapacity,
    select,
    startKey,
    where
  }
}

export const dynamoco = (db: DynamoDB, defaults?:{}) => {
  const getItem = async (TableName: string, input:validJs2DynamoDict, opts?: getItemOpts) => {
    const Key = _giveDynamoTypesToValues(input) as Key
    const res = await db.getItem({ TableName, Key, ...opts }).promise()
    const _Item = _stipDynamoTypingsForValues(res.Item)
    return { ...res, _Item }
  }

  const putItem = async (TableName:string, item:validJs2DynamoDict, opts?:putItemOpts) => {
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

  const putBatch = async (batchReq:{[table:string]: validJs2DynamoDict[]}, opts?:writeBatchOpts) => {
    const RequestItems = Object.entries(batchReq).reduce((acc, [table, putReqArr]) =>
      ({ ...acc, [table]: putReqArr.map(v => ({ PutRequest: { Item: _giveDynamoTypesToValues(v) } })) })
    , {})
    return db.batchWriteItem({ RequestItems, ...opts }).promise()
    // res.UnprocessedItems do not transform these since they are ready to be returned in this form
  }

  const deleteBatch = async (batchReq:{[table:string]:validJs2DynamoDict[]}, opts?:writeBatchOpts) => {
    const RequestItems = Object.entries(batchReq).reduce((acc, [table, keysForDelReqArr]) =>
      ({ ...acc, [table]: keysForDelReqArr.map(v => ({ DeleteRequest: { Key: _giveDynamoTypesToValues(v) } })) })
    , {})
    return db.batchWriteItem({ RequestItems, ...opts }).promise()
  }

  const query = async (table:string,
    mocoWhereClause:MocoPredicateClause | QueryInput,
    mocoFilterClause?:MocoPredicateClause,
    opts?:extraQueryOptions) => {
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

  const updateTTL = async (TableName:string, AttributeName:string, Enabled:boolean) => {
    return db.updateTimeToLive({
      TableName,
      TimeToLiveSpecification: {
        AttributeName,
        Enabled
      }
    }).promise()
  }

  const updateTable = async (table: string, onDemandMode:boolean, opts:UpdateTable) => {
    return db.updateTable({
      TableName: table,
      BillingMode: onDemandMode ? 'PAY_PER_REQUEST' : 'PROVISIONED',
      ...(opts.attrDefs ? { AttributeDefinitions: opts.attrDefs } : {}),
      ...(opts.gsi ? { GlobalSecondaryIndexUpdates: opts.gsi } : {}),
      ...(opts.throughput ? { ProvisionedThroughput: { ReadCapacityUnits: opts.throughput.read, WriteCapacityUnits: opts.throughput.write } } : {}),
      ...(opts.replicaUpdates ? { ReplicaUpdates: opts.replicaUpdates } : {}),
      ...(opts.SSE ? { SSESpecification: opts.SSE } : {}),
      ...(opts.streamSpec ? { StreamSpecification: opts.streamSpec } : {})
    }).promise()
  }

  async function * paginate (req: ScanReqState | QueryReqState, mode:'scan' | 'query' = 'query'):AsyncGenerator<QueryOutput | ScanOutput> {
    let res: QueryOutput | ScanOutput
    if (mode === 'query' || 'KeyConditionExpression' in req || 'ScanIndexForward' in req) {
      // If given a conflicting `mode` and `RequestType`, use the `RequestType` structure,  Since it makes things extract faster.
      res = await db.query(req).promise()
    } else {
      res = await db.scan(req).promise()
    }
    yield res
    if (res.LastEvaluatedKey) {
      yield * paginate({ ...req, ExclusiveStartKey: res.LastEvaluatedKey }, mode)
    }
  }

  const updateItem = async (table:string, opts:unknown) => {
    // const scanParams = {TableName:table} as ScanReqState
    // return db.updateItem().promise()
    throw new Error('not implemented yet need help')
  }

  const transactGetItems = async (table:string, opts:unknown) => {
    throw new Error('not implemented yet! Need help')
  }

  const transactWriteItems = async () => {
    throw new Error('not implemented yet! Need help')
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
    mocoQuery,
    _inferValueTypes: _inferDynamoValueTypes,
    _giveTypesToValues: _giveDynamoTypesToValues,
    _db: db
  }
}

export default { dynamoco, mocoQuery }

// #region types
type DynamoString = {'S':string}
type DynamoNumber = {'N':string}
type DynamoBinary = {'B':Buffer | string | Blob } // @todo add in TypedArray for corectness
type DynamoStringSet = {'SS':string[]}
type DynamoNumberSet = {'NS':string[]}
type DynamoBinarySet = {'BS':(Buffer | string | Blob)[]}
type DynamoNull = {'NULL': boolean}
type DynamoBool = {'BOOL': boolean}
type DynamoMap = {'M': {[Attribute:string]: DynamoAttrValueType }}
type DynamoList = {'L': DynamoAttrValueType[]}
export type DynamoAttrValueType =
| DynamoString
| DynamoNumber
| DynamoBinary
| DynamoStringSet
| DynamoNumberSet
| DynamoBinarySet
| DynamoMap
| DynamoList
| DynamoNull
| DynamoBool

type jsTypesFromDynamo = boolean | null | string | number | Buffer| string[] | number[] | Buffer[] | jsTypesFromDynamo[] | {[attribute:string]:jsTypesFromDynamo}
type validplainJSTypesInDynamo = boolean | null | string | number | Buffer | string[] | number[] | Buffer[]
type validJsDynamoTypes = validplainJSTypesInDynamo | {[Attribute:string]: validJsDynamoTypes }
type validJs2DynamoDict = {[Attribute: string]: validJsDynamoTypes}
type MocoPredicateClause = [string, '='| '<'| '>'| '<='| '>='| 'BETWEEN'| 'begins_with', null | boolean | string | number | Buffer | (Buffer | string| number)[] ]
interface MocoPredicateClauseReturn {
    KeyConditionExpression:string,
    ExpressionAttributeValues:{[attribute:string]: DynamoAttrValueType}
    ExpressionAttributeNames: {[attribute:string]: string}
}

interface QueryMetaState {
    table: string
    predicateOpr: string
    reserved: {[word:string]:boolean}

}

interface QueryReqState {
    TableName: string //!
    Select?:
        | 'ALL_ATTRIBUTES'
        | 'ALL_PROJECTED_ATTRIBUTES' /* only for index - and depends on how index is setup */
        | 'COUNT'
        | 'SPECIFIC_ATTRIBUTES' // falls back to `AttributesToGet` && using ProjectionExpression requires this option or Err
    IndexName?: string
    Limit?: number
    ConsistentRead?: boolean
    ScanIndexForward?: boolean
    ExclusiveStartKey?: Key
    ReturnConsumedCapacity?: 'INDEXES'| 'TOTAL'| 'NONE'
    ProjectionExpression?: string
    FilterExpression?: string
    KeyConditionExpression?: string // often derefs something from `ExprAttrVal`
    ExpressionAttributeNames?: {[key: string]: string }
    ExpressionAttributeValues?: {[key: string]: DynamoAttrValueType};
}

interface ScanReqState{
    TableName: string
    Select?:
        | 'ALL_ATTRIBUTES'
        | 'ALL_PROJECTED_ATTRIBUTES' /* only for index - and depends on how index is setup */
        | 'COUNT'
        | 'SPECIFIC_ATTRIBUTES' // falls back to `AttributesToGet` && using ProjectionExpression requires this option or Err
    IndexName?: string
    Limit?: number
    ConsistentRead?: boolean
    ExclusiveStartKey?: Key
    ReturnConsumedCapacity?: 'INDEXES'| 'TOTAL'| 'NONE'
    ProjectionExpression?: string
    FilterExpression?: string
    ExpressionAttributeNames?: {[key: string]: string }
    ExpressionAttributeValues?: {[key: string]: DynamoAttrValueType};
}

interface getItemOpts {
    ConsistentRead?: boolean
    ReturnConsumedCapacity?: 'INDEXES'| 'TOTAL'| 'NONE'
    ProjectionExpression?: string
    ExpressionAttributeNames?: {[key: string]: string }
}

interface putItemOpts {
    ConditionExpression?: string // similar to KeyConditionExpressions @see https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.ConditionExpressions.html
    ExpressionAttributeNames?: {[key: string]: string }
    ExpressionAttributeValues?: {[key: string]: DynamoAttrValueType}
    ReturnValues?: 'NONE'| 'ALL_OLD'| 'UPDATED_OLD'| 'ALL_NEW'| 'UPDATED_NEW'
    ReturnConsumedCapacity?: 'INDEXES'| 'TOTAL'| 'NONE'
    ReturnItemCollectionMetrics?: 'SIZE'| 'NONE'
}

interface writeBatchOpts{
    ReturnConsumedCapacity?: 'INDEXES'| 'TOTAL'| 'NONE'
    ReturnItemCollectionMetrics?: 'SIZE'|'NONE'
}

interface extraQueryOptions{
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

  interface mocoQuery {
    ascending: ()=>mocoQuery
    descending: ()=>mocoQuery
    consistentRead: (useConsistent:boolean)=>mocoQuery
    expressionAttributeValues: (input: validJs2DynamoDict)=>mocoQuery
    expressionAttributeNames: (input: {[key: string]: string })=>mocoQuery
    limit: (n:number)=>mocoQuery
    projectionExpression: (...projectionExpr: string[])=>mocoQuery
    usingIndex: (index:string)=>mocoQuery
    returnConsumedCapacity: (input?: 'INDEXES' | 'TOTAL' | 'NONE')=>mocoQuery
    select: (input:'*'| 'COUNT'| 'ALL_PROJECTED_ATTRIBUTES' | string[])=>mocoQuery
    startKey: (lastKeyEvaluated:Key)=>mocoQuery
    filterExpression: (filterExpr: string)=>mocoQuery
    filter: (_input: string | MocoPredicateClause | ['AND' | 'OR', MocoPredicateClause])=>mocoQuery
    where: (_input: string | MocoPredicateClause | ['AND' | 'OR', MocoPredicateClause])=>mocoQuery
    // --
    extract: ()=>QueryInput
}
// #endregion types
