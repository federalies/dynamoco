import type { DynamoDB } from 'aws-sdk';
import type { DynamoAttrValueType, DynamoMap, jsTypesFromDynamo, validJs2DynamoDict, PredicateClauses, ScanReqState, QueryReqState } from './mocoQuery';
import type { Key, BatchGetItemOutput, GetItemOutput, PutItemOutput, QueryInput, QueryOutput, ScanInput, ScanOutput, BatchWriteItemOutput, CreateGlobalSecondaryIndexAction, UpdateGlobalSecondaryIndexAction, DeleteGlobalSecondaryIndexAction, StreamSpecification, SSESpecification, ReplicationGroupUpdateList, DescribeTableOutput, UpdateTableOutput } from 'aws-sdk/clients/dynamodb';
export declare const _stipDynamoTypingsForValues: (input?: {
    [sttibuteName: string]: DynamoDB.AttributeValue | import("./mocoQuery").DynamoString | import("./mocoQuery").DynamoNumber | import("./mocoQuery").DynamoBinary | import("./mocoQuery").DynamoStringSet | import("./mocoQuery").DynamoNumberSet | import("./mocoQuery").DynamoBinarySet | DynamoMap | import("./mocoQuery").DynamoList | import("./mocoQuery").DynamoNull | import("./mocoQuery").DynamoBool;
}) => {
    [sttibuteName: string]: jsTypesFromDynamo;
};
export declare const dynamoco: (db: DynamoDB, defaults?: {} | undefined) => IDynaMoco;
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
export interface IDynaMoco {
    getItem: (TableName: string, input: validJs2DynamoDict, opts?: GetItemOpts) => Promise<GetItemOutput & {
        _Item: Dict<jsTypesFromDynamo>;
    }>;
    putItem: (TableName: string, item: validJs2DynamoDict, opts?: PutItemOpts) => Promise<PutItemOutput & {
        _Attributes: Dict<jsTypesFromDynamo>;
    }>;
    getBatch: (batchReq: {
        [table: string]: validJs2DynamoDict[];
    }) => Promise<BatchGetItemOutput & {
        _Responses: Dict<Dict<jsTypesFromDynamo>[]>;
    }>;
    putBatch: (batchReq: {
        [table: string]: validJs2DynamoDict[];
    }, opts?: WriteBatchOpts) => Promise<BatchWriteItemOutput>;
    deleteBatch: (batchReq: {
        [table: string]: validJs2DynamoDict[];
    }, opts?: WriteBatchOpts) => Promise<BatchWriteItemOutput>;
    query: (input: string | QueryInput, mocoWhereClauses?: PredicateClauses, mocoFilterClauses?: PredicateClauses, opts?: ExtraQueryOptions) => Promise<ScanOutput & {
        _Items: Dict<jsTypesFromDynamo>[];
    }>;
    scan: (input: string | ScanInput, mocoScanState: Partial<ScanReqState>, ...mocoFilterClauses: PredicateClauses) => Promise<ScanOutput & {
        _Items: Dict<jsTypesFromDynamo>[];
    }>;
    describeTable: (TableName: string) => Promise<DescribeTableOutput & {
        DBML: string;
    }>;
    updateTable: (table: string, onDemandMode: boolean, opts?: UpdateTable) => Promise<UpdateTableOutput>;
    paginate: (req: ScanReqState & {
        TableName: string;
    } | QueryReqState) => AsyncGenerator<(QueryOutput | ScanOutput) & {
        _Items?: jsTypesFromDynamo[];
    }>;
    _db: DynamoDB;
}
declare type Dict<T> = {
    [key: string]: T;
};
