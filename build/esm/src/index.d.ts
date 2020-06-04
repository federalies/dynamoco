/// <reference types="node" />
import type { DynamoDB } from 'aws-sdk';
import type { Key, QueryInput, CreateGlobalSecondaryIndexAction, UpdateGlobalSecondaryIndexAction, DeleteGlobalSecondaryIndexAction, StreamSpecification, SSESpecification, ReplicationGroupUpdateList } from 'aws-sdk/clients/dynamodb';
export declare const parseNumber: (input: string) => Number | Error;
export declare const parseNumberOrThrow: (input: string) => number;
export declare const toDynamo: (input: validJsDynamoTypes) => DynamoAttrValueType;
export declare const fromDynamo: (input: DynamoAttrValueType) => jsTypesFromDynamo;
export declare const _stipDynamoTypingsForValues: (input?: {
    [sttibuteName: string]: DynamoDB.AttributeValue | DynamoString | DynamoNumber | DynamoBinary | DynamoStringSet | DynamoNumberSet | DynamoBinarySet | DynamoMap | DynamoList | DynamoNull | DynamoBool;
}) => {
    [sttibuteName: string]: jsTypesFromDynamo;
};
export declare const mocoQuery: (table: string, startingState?: {
    r: QueryReqState;
    _m: QueryMetaState;
} | undefined) => mocoQuery;
export declare const dynamoco: (db: DynamoDB, defaults?: {} | undefined) => {
    getItem: (TableName: string, input: validJs2DynamoDict, opts?: getItemOpts | undefined) => Promise<{
        _Item: {
            [sttibuteName: string]: jsTypesFromDynamo;
        };
        Item?: DynamoDB.AttributeMap | undefined;
        ConsumedCapacity?: DynamoDB.ConsumedCapacity | undefined;
        $response: import("aws-sdk").Response<DynamoDB.GetItemOutput, import("aws-sdk").AWSError>;
    }>;
    putItem: (TableName: string, item: validJs2DynamoDict, opts?: putItemOpts | undefined) => Promise<{
        _Attributes: {
            [sttibuteName: string]: jsTypesFromDynamo;
        };
        Attributes?: DynamoDB.AttributeMap | undefined;
        ConsumedCapacity?: DynamoDB.ConsumedCapacity | undefined;
        ItemCollectionMetrics?: DynamoDB.ItemCollectionMetrics | undefined;
        $response: import("aws-sdk").Response<DynamoDB.PutItemOutput, import("aws-sdk").AWSError>;
    }>;
    getBatch: (batchReq: {
        [table: string]: validJs2DynamoDict[];
    }) => Promise<{
        _Responses: {
            [table: string]: {
                [attribute: string]: jsTypesFromDynamo;
            }[];
        };
        Responses?: DynamoDB.BatchGetResponseMap | undefined;
        UnprocessedKeys?: DynamoDB.BatchGetRequestMap | undefined;
        ConsumedCapacity?: DynamoDB.ConsumedCapacityMultiple | undefined;
        $response: import("aws-sdk").Response<DynamoDB.BatchGetItemOutput, import("aws-sdk").AWSError>;
    }>;
    putBatch: (batchReq: {
        [table: string]: validJs2DynamoDict[];
    }, opts?: writeBatchOpts | undefined) => Promise<import("aws-sdk/lib/request").PromiseResult<DynamoDB.BatchWriteItemOutput, import("aws-sdk").AWSError>>;
    deleteBatch: (batchReq: {
        [table: string]: validJs2DynamoDict[];
    }, opts?: writeBatchOpts | undefined) => Promise<import("aws-sdk/lib/request").PromiseResult<DynamoDB.BatchWriteItemOutput, import("aws-sdk").AWSError>>;
    query: (table: string, mocoWhereClause: DynamoDB.QueryInput | MocoPredicateClause, mocoFilterClause?: MocoPredicateClause | undefined, opts?: extraQueryOptions | undefined) => Promise<{
        _Items?: {
            [sttibuteName: string]: jsTypesFromDynamo;
        }[] | {
            [attribute: string]: jsTypesFromDynamo;
        }[] | undefined;
        Items?: DynamoDB.ItemList | undefined;
        Count?: number | undefined;
        ScannedCount?: number | undefined;
        LastEvaluatedKey?: DynamoDB.Key | undefined;
        ConsumedCapacity?: DynamoDB.ConsumedCapacity | undefined;
    }>;
    scan: (table: string, mocoFilterClause: MocoPredicateClause, mocoScanState?: ScanReqState | undefined) => Promise<{
        _Items?: {
            [sttibuteName: string]: jsTypesFromDynamo;
        }[];
        Items?: DynamoDB.ItemList | undefined;
        Count?: number | undefined;
        ScannedCount?: number | undefined;
        LastEvaluatedKey?: DynamoDB.Key | undefined;
        ConsumedCapacity?: DynamoDB.ConsumedCapacity | undefined;
        $response: import("aws-sdk").Response<DynamoDB.ScanOutput, import("aws-sdk").AWSError>;
    }>;
    describeTable: (TableName: string) => Promise<{
        DBML: string;
        Table?: DynamoDB.TableDescription | undefined;
        $response: import("aws-sdk").Response<DynamoDB.DescribeTableOutput, import("aws-sdk").AWSError>;
    }>;
    updateTable: (table: string, onDemandMode: boolean, opts?: UpdateTable | undefined) => Promise<import("aws-sdk/lib/request").PromiseResult<DynamoDB.UpdateTableOutput, import("aws-sdk").AWSError>>;
    paginate: (req: QueryReqState | (ScanReqState & {
        TableName: string;
    })) => AsyncGenerator<(DynamoDB.QueryOutput & {
        _Items?: jsTypesFromDynamo[] | undefined;
    }) | (DynamoDB.ScanOutput & {
        _Items?: jsTypesFromDynamo[] | undefined;
    }), any, unknown>;
    mocoQuery: (table: string, startingState?: {
        r: QueryReqState;
        _m: QueryMetaState;
    } | undefined) => mocoQuery;
    _inferValueTypes: (input: validJsDynamoTypes) => DynamoAttrValueType;
    _giveTypesToValues: (i: validJs2DynamoDict) => DynamoDB.Key;
    _db: DynamoDB;
};
declare const _default: {
    dynamoco: (db: DynamoDB, defaults?: {} | undefined) => {
        getItem: (TableName: string, input: validJs2DynamoDict, opts?: getItemOpts | undefined) => Promise<{
            _Item: {
                [sttibuteName: string]: jsTypesFromDynamo;
            };
            Item?: DynamoDB.AttributeMap | undefined;
            ConsumedCapacity?: DynamoDB.ConsumedCapacity | undefined;
            $response: import("aws-sdk").Response<DynamoDB.GetItemOutput, import("aws-sdk").AWSError>;
        }>;
        putItem: (TableName: string, item: validJs2DynamoDict, opts?: putItemOpts | undefined) => Promise<{
            _Attributes: {
                [sttibuteName: string]: jsTypesFromDynamo;
            };
            Attributes?: DynamoDB.AttributeMap | undefined;
            ConsumedCapacity?: DynamoDB.ConsumedCapacity | undefined;
            ItemCollectionMetrics?: DynamoDB.ItemCollectionMetrics | undefined;
            $response: import("aws-sdk").Response<DynamoDB.PutItemOutput, import("aws-sdk").AWSError>;
        }>;
        getBatch: (batchReq: {
            [table: string]: validJs2DynamoDict[];
        }) => Promise<{
            _Responses: {
                [table: string]: {
                    [attribute: string]: jsTypesFromDynamo;
                }[];
            };
            Responses?: DynamoDB.BatchGetResponseMap | undefined;
            UnprocessedKeys?: DynamoDB.BatchGetRequestMap | undefined;
            ConsumedCapacity?: DynamoDB.ConsumedCapacityMultiple | undefined;
            $response: import("aws-sdk").Response<DynamoDB.BatchGetItemOutput, import("aws-sdk").AWSError>;
        }>;
        putBatch: (batchReq: {
            [table: string]: validJs2DynamoDict[];
        }, opts?: writeBatchOpts | undefined) => Promise<import("aws-sdk/lib/request").PromiseResult<DynamoDB.BatchWriteItemOutput, import("aws-sdk").AWSError>>;
        deleteBatch: (batchReq: {
            [table: string]: validJs2DynamoDict[];
        }, opts?: writeBatchOpts | undefined) => Promise<import("aws-sdk/lib/request").PromiseResult<DynamoDB.BatchWriteItemOutput, import("aws-sdk").AWSError>>;
        query: (table: string, mocoWhereClause: DynamoDB.QueryInput | MocoPredicateClause, mocoFilterClause?: MocoPredicateClause | undefined, opts?: extraQueryOptions | undefined) => Promise<{
            _Items?: {
                [sttibuteName: string]: jsTypesFromDynamo;
            }[] | {
                [attribute: string]: jsTypesFromDynamo;
            }[] | undefined;
            Items?: DynamoDB.ItemList | undefined;
            Count?: number | undefined;
            ScannedCount?: number | undefined;
            LastEvaluatedKey?: DynamoDB.Key | undefined;
            ConsumedCapacity?: DynamoDB.ConsumedCapacity | undefined;
        }>;
        scan: (table: string, mocoFilterClause: MocoPredicateClause, mocoScanState?: ScanReqState | undefined) => Promise<{
            _Items?: {
                [sttibuteName: string]: jsTypesFromDynamo;
            }[];
            Items?: DynamoDB.ItemList | undefined;
            Count?: number | undefined;
            ScannedCount?: number | undefined;
            LastEvaluatedKey?: DynamoDB.Key | undefined;
            ConsumedCapacity?: DynamoDB.ConsumedCapacity | undefined;
            $response: import("aws-sdk").Response<DynamoDB.ScanOutput, import("aws-sdk").AWSError>;
        }>;
        describeTable: (TableName: string) => Promise<{
            DBML: string;
            Table?: DynamoDB.TableDescription | undefined;
            $response: import("aws-sdk").Response<DynamoDB.DescribeTableOutput, import("aws-sdk").AWSError>;
        }>;
        updateTable: (table: string, onDemandMode: boolean, opts?: UpdateTable | undefined) => Promise<import("aws-sdk/lib/request").PromiseResult<DynamoDB.UpdateTableOutput, import("aws-sdk").AWSError>>;
        paginate: (req: QueryReqState | (ScanReqState & {
            TableName: string;
        })) => AsyncGenerator<(DynamoDB.QueryOutput & {
            _Items?: jsTypesFromDynamo[] | undefined;
        }) | (DynamoDB.ScanOutput & {
            _Items?: jsTypesFromDynamo[] | undefined;
        }), any, unknown>;
        mocoQuery: (table: string, startingState?: {
            r: QueryReqState;
            _m: QueryMetaState;
        } | undefined) => mocoQuery;
        _inferValueTypes: (input: validJsDynamoTypes) => DynamoAttrValueType;
        _giveTypesToValues: (i: validJs2DynamoDict) => DynamoDB.Key;
        _db: DynamoDB;
    };
    mocoQuery: (table: string, startingState?: {
        r: QueryReqState;
        _m: QueryMetaState;
    } | undefined) => mocoQuery;
};
export default _default;
declare type DynamoString = {
    'S': string;
};
declare type DynamoNumber = {
    'N': string;
};
declare type DynamoBinary = {
    'B': Buffer | string | Blob;
};
declare type DynamoStringSet = {
    'SS': string[];
};
declare type DynamoNumberSet = {
    'NS': string[];
};
declare type DynamoBinarySet = {
    'BS': (Buffer | string | Blob)[];
};
declare type DynamoNull = {
    'NULL': boolean;
};
declare type DynamoBool = {
    'BOOL': boolean;
};
declare type DynamoMap = {
    'M': {
        [Attribute: string]: DynamoAttrValueType;
    };
};
declare type DynamoList = {
    'L': DynamoAttrValueType[];
};
export declare type DynamoAttrValueType = DynamoString | DynamoNumber | DynamoBinary | DynamoStringSet | DynamoNumberSet | DynamoBinarySet | DynamoMap | DynamoList | DynamoNull | DynamoBool;
export declare type jsTypesFromDynamo = boolean | null | string | number | Buffer | string[] | number[] | Buffer[] | jsTypesFromDynamo[] | {
    [attribute: string]: jsTypesFromDynamo;
};
declare type validplainJSTypesInDynamo = boolean | null | string | number | Buffer | string[] | number[] | Buffer[];
declare type validJsDynamoTypes = validplainJSTypesInDynamo | {
    [Attribute: string]: validJsDynamoTypes;
};
declare type validJs2DynamoDict = {
    [Attribute: string]: validJsDynamoTypes;
};
declare type MocoPredicateClause = [string, '=' | '<' | '>' | '<=' | '>=' | 'BETWEEN' | 'begins_with', null | boolean | string | number | Buffer | (Buffer | string | number)[]];
interface QueryMetaState {
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
interface getItemOpts {
    ConsistentRead?: boolean;
    ReturnConsumedCapacity?: 'INDEXES' | 'TOTAL' | 'NONE';
    ProjectionExpression?: string;
    ExpressionAttributeNames?: {
        [key: string]: string;
    };
}
interface putItemOpts {
    ConditionExpression?: string;
    ExpressionAttributeNames?: {
        [key: string]: string;
    };
    ExpressionAttributeValues?: {
        [key: string]: DynamoAttrValueType;
    };
    ReturnValues?: 'NONE' | 'ALL_OLD' | 'UPDATED_OLD' | 'ALL_NEW' | 'UPDATED_NEW';
    ReturnConsumedCapacity?: 'INDEXES' | 'TOTAL' | 'NONE';
    ReturnItemCollectionMetrics?: 'SIZE' | 'NONE';
}
interface writeBatchOpts {
    ReturnConsumedCapacity?: 'INDEXES' | 'TOTAL' | 'NONE';
    ReturnItemCollectionMetrics?: 'SIZE' | 'NONE';
}
interface extraQueryOptions {
    IndexName?: string;
    Limit?: number;
    ConsistentRead?: boolean;
    ScanIndexForward?: boolean;
    ExclusiveStartKey?: Key;
    Select?: 'ALL_ATTRIBUTES' | 'ALL_PROJECTED_ATTRIBUTES' | 'COUNT' | 'SPECIFIC_ATTRIBUTES';
    ReturnConsumedCapacity?: 'INDEXES' | 'TOTAL' | 'NONE';
    ProjectionExpression?: string;
    ExpressionAttributeNames?: {
        [key: string]: string;
    };
    ExpressionAttributeValues?: {
        [key: string]: DynamoAttrValueType;
    };
}
interface UpdateTable {
    attrDefs?: {
        AttributeName: string;
        AttributeType: 'S' | 'N' | 'B';
    }[];
    throughput?: {
        read: number;
        write: number;
    };
    gsi?: ({
        Create: CreateGlobalSecondaryIndexAction;
    } | {
        Update: UpdateGlobalSecondaryIndexAction;
    } | {
        Delete: DeleteGlobalSecondaryIndexAction;
    })[];
    streamSpec?: StreamSpecification;
    SSE?: SSESpecification;
    replicaUpdates?: ReplicationGroupUpdateList;
}
interface mocoQuery {
    ascending: () => mocoQuery;
    descending: () => mocoQuery;
    consistentRead: (useConsistent: boolean) => mocoQuery;
    expressionAttributeValues: (input: validJs2DynamoDict) => mocoQuery;
    expressionAttributeNames: (input: {
        [key: string]: string;
    }) => mocoQuery;
    limit: (n: number) => mocoQuery;
    projectionExpression: (...projectionExpr: string[]) => mocoQuery;
    usingIndex: (index: string) => mocoQuery;
    returnConsumedCapacity: (input?: 'INDEXES' | 'TOTAL' | 'NONE') => mocoQuery;
    select: (input: '*' | 'COUNT' | 'ALL_PROJECTED_ATTRIBUTES' | string[]) => mocoQuery;
    startKey: (lastKeyEvaluated: Key) => mocoQuery;
    filterExpression: (filterExpr: string) => mocoQuery;
    filter: (_input: string | MocoPredicateClause | ['AND' | 'OR', MocoPredicateClause]) => mocoQuery;
    where: (_input: string | MocoPredicateClause | ['AND' | 'OR', MocoPredicateClause]) => mocoQuery;
    extract: () => QueryInput;
}
