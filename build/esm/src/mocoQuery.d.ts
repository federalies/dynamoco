/// <reference types="node" />
import type { Key, QueryInput } from 'aws-sdk/clients/dynamodb';
export declare const parseNumber: (input: string) => Number | Error;
export declare const parseNumberOrThrow: (input: string) => number;
export declare const _inferDynamoValueTypes: (input: validJsDynamoTypes) => DynamoAttrValueType;
export declare const fromDynamo: (input: DynamoAttrValueType) => jsTypesFromDynamo;
export declare const _inferJsValues: (input: DynamoAttrValueType) => jsTypesFromDynamo;
export declare const queryOperators: (inputOpr: string, logLevel?: number) => string;
export declare const _giveDynamoTypesToValues: (i: validJs2DynamoDict) => Key;
export declare const mocoQuery: (table: string, startingState?: {
    r: QueryReqState;
    _m: QueryMetaState;
} | undefined) => MocoQuery;
export default mocoQuery;
export declare type DynamoString = {
    'S': string;
};
export declare type DynamoNumber = {
    'N': string;
};
export declare type DynamoBinary = {
    'B': Buffer | string | Blob;
};
export declare type DynamoStringSet = {
    'SS': string[];
};
export declare type DynamoNumberSet = {
    'NS': string[];
};
export declare type DynamoBinarySet = {
    'BS': (Buffer | string | Blob)[];
};
export declare type DynamoNull = {
    'NULL': boolean;
};
export declare type DynamoBool = {
    'BOOL': boolean;
};
export declare type DynamoMap = {
    'M': {
        [Attribute: string]: DynamoAttrValueType;
    };
};
export declare type DynamoList = {
    'L': DynamoAttrValueType[];
};
export declare type DynamoAttrValueType = DynamoString | DynamoNumber | DynamoBinary | DynamoStringSet | DynamoNumberSet | DynamoBinarySet | DynamoMap | DynamoList | DynamoNull | DynamoBool;
export declare type jsTypesFromDynamo = boolean | null | string | number | Buffer | string[] | number[] | Buffer[] | jsTypesFromDynamo[] | {
    [attribute: string]: jsTypesFromDynamo;
};
export declare type validplainJSTypesInDynamo = boolean | null | string | number | Buffer | string[] | number[] | Buffer[];
export declare type validJsDynamoTypes = validplainJSTypesInDynamo | {
    [Attribute: string]: validJsDynamoTypes;
};
export declare type validJs2DynamoDict = {
    [Attribute: string]: validJsDynamoTypes;
};
export declare type MocoPredicateClause = [string, '=' | '<' | '>' | '<=' | '>=' | 'BETWEEN' | 'begins_with', null | boolean | string | number | Buffer | (Buffer | string | number)[]];
export interface MocoPredicateClauseReturn {
    KeyConditionExpression: string;
    ExpressionAttributeValues: {
        [attribute: string]: DynamoAttrValueType;
    };
    ExpressionAttributeNames: {
        [attribute: string]: string;
    };
}
export interface QueryMetaState {
    table: string;
    predicateOpr: string;
    reserved: {
        [word: string]: boolean;
    };
}
export interface QueryReqState {
    TableName: string;
    Select?: 'ALL_ATTRIBUTES' | 'ALL_PROJECTED_ATTRIBUTES' | 'COUNT' | 'SPECIFIC_ATTRIBUTES';
    IndexName?: string;
    Limit?: number;
    ConsistentRead?: boolean;
    ScanIndexForward?: boolean;
    ExclusiveStartKey?: Key;
    ReturnConsumedCapacity?: 'INDEXES' | 'TOTAL' | 'NONE';
    ProjectionExpression?: string;
    FilterExpression?: string;
    KeyConditionExpression?: string;
    ExpressionAttributeNames?: {
        [key: string]: string;
    };
    ExpressionAttributeValues?: {
        [key: string]: DynamoAttrValueType;
    };
}
export interface ScanReqState {
    Select?: 'ALL_ATTRIBUTES' | 'ALL_PROJECTED_ATTRIBUTES' | 'COUNT' | 'SPECIFIC_ATTRIBUTES';
    IndexName?: string;
    Limit?: number;
    ConsistentRead?: boolean;
    ExclusiveStartKey?: Key;
    ReturnConsumedCapacity?: 'INDEXES' | 'TOTAL' | 'NONE';
    ProjectionExpression?: string;
    FilterExpression?: string;
    ExpressionAttributeNames?: {
        [key: string]: string;
    };
    ExpressionAttributeValues?: {
        [key: string]: DynamoAttrValueType;
    };
}
export interface MocoQuery {
    ascending: () => MocoQuery;
    descending: () => MocoQuery;
    consistentRead: (useConsistent: boolean) => MocoQuery;
    expressionAttributeValues: (input: validJs2DynamoDict) => MocoQuery;
    expressionAttributeNames: (input: {
        [key: string]: string;
    }) => MocoQuery;
    limit: (n: number) => MocoQuery;
    projectionExpression: (...projectionExpr: string[]) => MocoQuery;
    usingIndex: (index: string) => MocoQuery;
    returnConsumedCapacity: (input?: 'INDEXES' | 'TOTAL' | 'NONE') => MocoQuery;
    select: (input: '*' | 'COUNT' | 'ALL_PROJECTED_ATTRIBUTES' | string[]) => MocoQuery;
    startKey: (lastKeyEvaluated: Key) => MocoQuery;
    filterExpression: (filterExpr: string) => MocoQuery;
    filter: (_input: string | MocoPredicateClause | ['AND' | 'OR', MocoPredicateClause]) => MocoQuery;
    where: (_input: string | MocoPredicateClause | ['AND' | 'OR', MocoPredicateClause]) => MocoQuery;
    extract: () => QueryInput;
}
