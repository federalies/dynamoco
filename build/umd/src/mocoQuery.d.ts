/// <reference types="node" />
import { URL } from 'url';
import type { Key, QueryInput } from 'aws-sdk/clients/dynamodb';
export declare const parseNumber: (input: string) => Number | Error;
export declare const parseNumberOrThrow: (input: string) => number;
export declare const _inferDynamoValueTypes: (input: validJsDynamoTypes) => DynamoAttrValueType;
export declare const fromDynamo: (input: DynamoAttrValueType) => jsTypesFromDynamo;
export declare const _inferJsValues: (input: DynamoAttrValueType) => jsTypesFromDynamo;
export declare const queryOperators: (inputOpr: string, logLevel?: number) => string;
export declare const _giveDynamoTypesToValues: (i: validJs2DynamoDict) => Key;
export declare const mocoQuery: (table: string, startingState?: {
    r: Partial<QueryReqState>;
    _m: Partial<QueryMetaState>;
} | undefined) => IMocoQuery;
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
export declare type PredicateComparitorOperations = '=' | '<>' | '<' | '>' | '<=' | '>=' | 'BETWEEN' | 'begins_with';
export declare type PredicateValues = null | boolean | string | number | Buffer | (Buffer | string | number)[];
export declare type MocoPredicateClause = [string, PredicateComparitorOperations, PredicateValues];
export declare type LinkedMocoPredicateClause = ['AND' | 'OR', MocoPredicateClause];
export declare type PredicateClause = MocoPredicateClause | LinkedMocoPredicateClause;
export declare type PredicateClauses = PredicateClause[];
export interface MocoPredicateClauseReturn {
    KeyConditionExpression: string;
    ExpressionAttributeValues: {
        [attribute: string]: DynamoAttrValueType;
    };
    ExpressionAttributeNames: {
        [attribute: string]: string;
    };
    linkingLogic?: 'AND' | 'OR';
}
export interface QueryMetaState {
    reserved: {
        [word: string]: boolean;
    };
    where: (string | MocoPredicateClause | LinkedMocoPredicateClause)[];
    filters: (MocoPredicateClause | LinkedMocoPredicateClause)[];
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
export interface IMocoQuery {
    ascending: () => IMocoQuery;
    descending: () => IMocoQuery;
    consistentRead: (useConsistent: boolean) => IMocoQuery;
    expressionAttributeValues: (input: validJs2DynamoDict) => IMocoQuery;
    expressionAttributeNames: (input: {
        [key: string]: string;
    }) => IMocoQuery;
    limit: (n: number) => IMocoQuery;
    projectionExpression: (...projectionExpr: string[]) => IMocoQuery;
    usingIndex: (index: string) => IMocoQuery;
    returnConsumedCapacity: (input?: 'INDEXES' | 'TOTAL' | 'NONE') => IMocoQuery;
    select: (input: '*' | 'COUNT' | 'ALL_PROJECTED_ATTRIBUTES' | string[]) => IMocoQuery;
    startKey: (lastKeyEvaluated: Key) => IMocoQuery;
    filterExpression: (filterExpr: string) => IMocoQuery;
    filter: (_input: string | PredicateClause) => IMocoQuery;
    where: (_input: string | PredicateClause) => IMocoQuery;
    fromUrl: (input: string | URL) => IMocoQuery;
    extract: () => QueryInput;
    toURL: () => URL;
    toUrlString: () => string;
}
