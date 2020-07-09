import { mocoQuery, fromDynamo, _inferJsValues, _giveDynamoTypesToValues } from './mocoQuery';
const { isArray } = Array;
const parseTableProps = (table, tableDef) => {
    const preamble = `Table ${table} {\n`;
    const indexHeader = 'index {';
    const tab = '\t';
    const closer = '\n}';
    const mapping = {
        S: 'text',
        SS: 'text[]',
        BOOL: 'boolean',
        N: 'numeric',
        NS: 'numeric[]',
        B: 'bytea',
        BS: 'bytea[]',
        L: 'JSON',
        M: 'JSON'
    };
    const columns = (tableDef.AttributeDefinitions || []).reduce((p, c) => ({
        ...p,
        [c.AttributeName]: {
            columnName: c.AttributeName,
            origType: c.AttributeType,
            dbmlType: mapping[c.AttributeType] ?? 'varchar',
            settings: {
                notes: '',
                primaryKey: false
            }
        }
    }), {});
    for (const key of tableDef.KeySchema) {
        if (key.KeyType === 'HASH') {
            columns[key.AttributeName].settings.primaryKey = true;
        }
        else {
            columns[key.AttributeName].settings.notes = 'Used as Range Key';
        }
    }
    const settingsPrint = (i) => {
        const settingsArr = [];
        i.notes.length > 1 && settingsArr.push(`note: ${i.notes}`);
        i.primaryKey && settingsArr.push('pk');
        if (settingsArr.length > 0) {
            return `[${settingsArr.join(', ')}]`;
        }
        else {
            return '';
        }
    };
    const cols = Object.values(columns).map(c => `${tab} ${c.columnName} ${c.dbmlType} ${settingsPrint(c.settings)}`).join('\n');
    return preamble + cols + closer;
};
export const _stipDynamoTypingsForValues = (input = {}) => {
    return Object.entries(input).reduce((acc, [attrib, typedDynamoVal]) => ({
        ...acc,
        [attrib]: _inferJsValues(typedDynamoVal)
    }), {});
};
export const dynamoco = (db, defaults) => {
    const getItem = async (TableName, input, opts) => {
        const Key = _giveDynamoTypesToValues(input);
        const res = await db.getItem({ TableName, Key, ...opts }).promise();
        const _Item = _stipDynamoTypingsForValues(res.Item);
        return { ...res, _Item };
    };
    const putItem = async (TableName, item, opts) => {
        const Item = _giveDynamoTypesToValues(item);
        const res = await db.putItem({ TableName, Item, ...opts }).promise();
        const _Attributes = _stipDynamoTypingsForValues(res.Attributes);
        return { ...res, _Attributes };
    };
    const getBatch = async (batchReq) => {
        const RequestItems = Object.entries(batchReq)
            .reduce((acc, [table, attributeValObjArr]) => ({
            ...acc,
            [table]: { Keys: attributeValObjArr.map(_giveDynamoTypesToValues) }
        }), {});
        const res = await db.batchGetItem({ RequestItems }).promise();
        const _Responses = Object.entries(res.Responses)
            .reduce((acc, [table, typedAttribMapArr]) => ({
            ...acc,
            [table]: typedAttribMapArr.map((item) => _stipDynamoTypingsForValues(item))
        }), {});
        return { ...res, _Responses };
    };
    const putBatch = async (batchReq, opts) => {
        const RequestItems = Object.entries(batchReq).reduce((acc, [table, putReqArr]) => ({ ...acc, [table]: putReqArr.map(v => ({ PutRequest: { Item: _giveDynamoTypesToValues(v) } })) }), {});
        return db.batchWriteItem({ RequestItems, ...opts }).promise();
    };
    const deleteBatch = async (batchReq, opts) => {
        const RequestItems = Object.entries(batchReq).reduce((acc, [table, keysForDelReqArr]) => ({ ...acc, [table]: keysForDelReqArr.map(v => ({ DeleteRequest: { Key: _giveDynamoTypesToValues(v) } })) }), {});
        return db.batchWriteItem({ RequestItems, ...opts }).promise();
    };
    const query = async (table, mocoWhereClause, mocoFilterClause, opts) => {
        const q = mocoQuery(table);
        const query = isArray(mocoWhereClause)
            ? mocoFilterClause
                ? q.where(mocoWhereClause).filter(mocoFilterClause).extract()
                : q.where(mocoWhereClause).extract()
            : mocoWhereClause;
        const res = await db.query({ ...query, ...opts }).promise();
        return {
            ...res,
            ...(res.Items
                ? { _Items: res.Items.map(v => _stipDynamoTypingsForValues(v)) }
                : {})
        };
    };
    const scan = async (table, mocoFilterClause, mocoScanState) => {
        const scanParam = mocoQuery(table);
        const scanWithThis = scanParam.filter(mocoFilterClause).extract();
        const res = await db.scan({ ...mocoScanState, ...scanWithThis }).promise();
        return {
            ...res,
            ...(res.Items
                ? { _Items: res.Items.map(v => _stipDynamoTypingsForValues(v)) }
                : {})
        };
    };
    const describeTable = async (TableName) => {
        const res = await db.describeTable({ TableName }).promise();
        const DBML = parseTableProps(TableName, res.Table);
        return { ...res, DBML };
    };
    const updateTable = async (table, onDemandMode, opts) => {
        return db.updateTable({
            TableName: table,
            BillingMode: onDemandMode ? 'PAY_PER_REQUEST' : 'PROVISIONED',
            ...(opts?.attrDefs ? { AttributeDefinitions: opts.attrDefs } : {}),
            ...(opts?.gsi ? { GlobalSecondaryIndexUpdates: opts.gsi } : {}),
            ...(opts?.throughput ? { ProvisionedThroughput: { ReadCapacityUnits: opts.throughput.read, WriteCapacityUnits: opts.throughput.write } } : {}),
            ...(opts?.replicaUpdates ? { ReplicaUpdates: opts.replicaUpdates } : {}),
            ...(opts?.SSE ? { SSESpecification: opts.SSE } : {}),
            ...(opts?.streamSpec ? { StreamSpecification: opts.streamSpec } : {})
        }).promise();
    };
    async function* paginate(req) {
        let res;
        if ('KeyConditionExpression' in req || 'ScanIndexForward' in req) {
            res = await db.query(req).promise();
        }
        else {
            res = await db.scan(req).promise();
        }
        const _Items = res.Items
            ? res.Items.map(entry => fromDynamo(entry))
            : undefined;
        yield { ...res, _Items };
        if (res.LastEvaluatedKey) {
            yield* paginate({ ...req, ExclusiveStartKey: res.LastEvaluatedKey });
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
        paginate,
        _db: db
    };
};
export default dynamoco;
