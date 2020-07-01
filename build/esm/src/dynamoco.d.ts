import type { DynamoDB } from 'aws-sdk';
import type { DynamoAttrValueType, DynamoMap, jsTypesFromDynamo, validJs2DynamoDict, MocoPredicateClause, ScanReqState, QueryReqState } from './mocoQuery';
import type { Key, CreateGlobalSecondaryIndexAction, UpdateGlobalSecondaryIndexAction, DeleteGlobalSecondaryIndexAction, StreamSpecification, SSESpecification, ReplicationGroupUpdateList } from 'aws-sdk/clients/dynamodb';
export declare const _stipDynamoTypingsForValues: (input?: {
    [sttibuteName: string]: DynamoDB.AttributeValue | import("./mocoQuery").DynamoString | import("./mocoQuery").DynamoNumber | import("./mocoQuery").DynamoBinary | import("./mocoQuery").DynamoStringSet | import("./mocoQuery").DynamoNumberSet | import("./mocoQuery").DynamoBinarySet | DynamoMap | import("./mocoQuery").DynamoList | import("./mocoQuery").DynamoNull | import("./mocoQuery").DynamoBool;
}) => {
    [sttibuteName: string]: jsTypesFromDynamo;
};
export declare const dynamoco: (db: DynamoDB, defaults?: {} | undefined) => {
    getItem: (TableName: string, input: validJs2DynamoDict, opts?: GetItemOpts | undefined) => Promise<{
        _Item: {
            [sttibuteName: string]: jsTypesFromDynamo;
        };
        Item?: DynamoDB.AttributeMap | undefined;
        ConsumedCapacity?: DynamoDB.ConsumedCapacity | undefined;
        $response: import("aws-sdk").Response<DynamoDB.GetItemOutput, import("aws-sdk").AWSError>;
    }>;
    putItem: (TableName: string, item: validJs2DynamoDict, opts?: PutItemOpts | undefined) => Promise<{
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
    }, opts?: WriteBatchOpts | undefined) => Promise<import("aws-sdk/lib/request").PromiseResult<DynamoDB.BatchWriteItemOutput, import("aws-sdk").AWSError>>;
    deleteBatch: (batchReq: {
        [table: string]: validJs2DynamoDict[];
    }, opts?: WriteBatchOpts | undefined) => Promise<import("aws-sdk/lib/request").PromiseResult<DynamoDB.BatchWriteItemOutput, import("aws-sdk").AWSError>>;
    query: (table: string, mocoWhereClause: DynamoDB.QueryInput | MocoPredicateClause, mocoFilterClause?: MocoPredicateClause | undefined, opts?: ExtraQueryOptions | undefined) => Promise<{
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
    _db: DynamoDB;
};
export default dynamoco;
interface GetItemOpts {
    ConsistentRead?: boolean;
    ReturnConsumedCapacity?: 'INDEXES' | 'TOTAL' | 'NONE';
    ProjectionExpression?: string;
    ExpressionAttributeNames?: {
        [key: string]: string;
    };
}
interface PutItemOpts {
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
interface WriteBatchOpts {
    ReturnConsumedCapacity?: 'INDEXES' | 'TOTAL' | 'NONE';
    ReturnItemCollectionMetrics?: 'SIZE' | 'NONE';
}
interface ExtraQueryOptions {
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
