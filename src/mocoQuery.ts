/* eslint-disable no-unused-vars */
import type {
  Key,
  QueryInput
} from 'aws-sdk/clients/dynamodb'
/* eslint-enable no-unused-vars */

import { reservedWords } from './dynamoReservedWords'
import { brotliDecompressSync } from 'zlib'
import fs from 'fs'
import path from 'path'

const { isArray } = Array
const isError = (input:any):input is Error => input instanceof Error
const isString = (i:string | any): i is string => typeof i === 'string' || i instanceof String
const isBool = (i:boolean | any): i is boolean => typeof i === 'boolean' || i instanceof Boolean
const isNumber = (i:number | any): i is number => typeof i === 'number' || i instanceof Number
const isBinary = (i:Buffer | any): i is Buffer => Buffer.isBuffer(i)
const isNull = (i:null | any): i is null => i === null

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

export const _inferDynamoValueTypes = (input:validJsDynamoTypes):DynamoAttrValueType => {
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
    const allSame = input.every((v :string | number | Buffer) => typeof v === firstTypeof && Object.getPrototypeOf(v) === firstProtoOf)
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
  } else {
    // if (isObj(input))
    return {
      M: Object.entries(input).reduce((acc, [attrib, value]) => ({
        ...acc,
        [attrib]: _inferDynamoValueTypes(value) as DynamoAttrValueType
      }), {} as {[Attribute:string]: DynamoAttrValueType})
    } as DynamoMap
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

export const _inferJsValues = (input: DynamoAttrValueType): jsTypesFromDynamo => {
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

export const queryOperators = (inputOpr:string, logLevel: number = 5): string => {
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

export const _giveDynamoTypesToValues = (i:validJs2DynamoDict):Key => {
  return Object.entries(i).reduce((acc, [attribute, value]) => ({
    ...acc,
    [attribute]: _inferDynamoValueTypes(value)
  }), {} as Key)
}

export const mocoQuery = (table:string, startingState?: {r:QueryReqState, _m: QueryMetaState}):MocoQuery => {
  const state = {
    _m: {
      reserved: reservedWords(fs, path, brotliDecompressSync),
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
export default mocoQuery

// #region types
export type DynamoString = {'S':string}
export type DynamoNumber = {'N':string}
export type DynamoBinary = {'B':Buffer | string | Blob } // @todo add in TypedArray for corectness
export type DynamoStringSet = {'SS':string[]}
export type DynamoNumberSet = {'NS':string[]}
export type DynamoBinarySet = {'BS':(Buffer | string | Blob)[]}
export type DynamoNull = {'NULL': boolean}
export type DynamoBool = {'BOOL': boolean}
export type DynamoMap = {'M': {[Attribute:string]: DynamoAttrValueType }}
export type DynamoList = {'L': DynamoAttrValueType[]}
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

export type jsTypesFromDynamo = boolean | null | string | number | Buffer| string[] | number[] | Buffer[] | jsTypesFromDynamo[] | {[attribute:string]:jsTypesFromDynamo}
export type validplainJSTypesInDynamo = boolean | null | string | number | Buffer | string[] | number[] | Buffer[]
export type validJsDynamoTypes = validplainJSTypesInDynamo | {[Attribute:string]: validJsDynamoTypes }
export type validJs2DynamoDict = {[Attribute: string]: validJsDynamoTypes}
export type MocoPredicateClause = [string, '='| '<'| '>'| '<='| '>='| 'BETWEEN'| 'begins_with', null | boolean | string | number | Buffer | (Buffer | string| number)[] ]
export interface MocoPredicateClauseReturn {
    KeyConditionExpression:string,
    ExpressionAttributeValues:{[attribute:string]: DynamoAttrValueType}
    ExpressionAttributeNames: {[attribute:string]: string}
}

export interface QueryMetaState {
    table: string
    predicateOpr: string
    reserved: {[word:string]:boolean}

}

export interface QueryReqState {
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

export interface ScanReqState{
    // TableName: string - omitted here - used once as is and added back in another time
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

export interface MocoQuery {
    ascending: ()=>MocoQuery
    descending: ()=>MocoQuery
    consistentRead: (useConsistent:boolean)=>MocoQuery
    expressionAttributeValues: (input: validJs2DynamoDict)=>MocoQuery
    expressionAttributeNames: (input: {[key: string]: string })=>MocoQuery
    limit: (n:number)=>MocoQuery
    projectionExpression: (...projectionExpr: string[])=>MocoQuery
    usingIndex: (index:string)=>MocoQuery
    returnConsumedCapacity: (input?: 'INDEXES' | 'TOTAL' | 'NONE')=>MocoQuery
    select: (input:'*'| 'COUNT'| 'ALL_PROJECTED_ATTRIBUTES' | string[])=>MocoQuery
    startKey: (lastKeyEvaluated:Key)=>MocoQuery
    filterExpression: (filterExpr: string)=>MocoQuery
    filter: (_input: string | MocoPredicateClause | ['AND' | 'OR', MocoPredicateClause])=>MocoQuery
    where: (_input: string | MocoPredicateClause | ['AND' | 'OR', MocoPredicateClause])=>MocoQuery
    // --
    extract: ()=>QueryInput
}
// #endregion types
