import { reservedWords } from './dynamoReservedWords';
import { brotliDecompressSync } from 'zlib';
import fs from 'fs';
import path from 'path';
const isError = (input) => input instanceof Error;
const { isArray } = Array;
const isBuffer = Buffer.isBuffer;
const isString = (i) => typeof i === 'string' || i instanceof String;
const isBool = (i) => typeof i === 'boolean' || i instanceof Boolean;
const isNumber = (i) => typeof i === 'number' || i instanceof Number;
const isObj = (i) => typeof i === 'object' || i instanceof Object;
const isBinary = (i) => Buffer.isBuffer(i);
const isNull = (i) => i === null;
const isPrimitive = (value) => (typeof value !== 'object' && typeof value !== 'function') || value === null;
export const parseNumber = (input) => {
    return !Number.isNaN(Number.parseFloat(input))
        ? Number.parseFloat(input)
        : new Error('Got an N or NS typed data element that was not a parsable string');
};
export const parseNumberOrThrow = (input) => {
    const numErr = parseNumber(input);
    if (isError(numErr)) {
        throw numErr;
    }
    else {
        return numErr;
    }
};
export const toDynamo = (input) => {
    if (isPrimitive(input) || isArray(input) || isBuffer(input)) {
        return _inferDynamoValueTypes(input);
    }
    else {
        const ret = Object.entries(input).reduce((p, [key, val], i, a) => {
            return {
                ...p,
                [key]: _inferDynamoValueTypes(val)
            };
        }, {});
        if (Object.keys(ret).length === 0) {
            throw new Error('WAT kindof data type did you give???');
        }
        else {
            return ret;
        }
    }
};
const _inferDynamoValueTypes = (input) => {
    if (isString(input)) {
        return { S: input };
    }
    else if (isBool(input)) {
        return { BOOL: input };
    }
    else if (isNumber(input)) {
        return { N: input.toString() };
    }
    else if (isBinary(input)) {
        return { B: Buffer.from(input) };
    }
    else if (isNull(input)) {
        return { NULL: true };
    }
    else if (isArray(input)) {
        const firstTypeof = typeof input[0];
        const firstProtoOf = Object.getPrototypeOf(input[0]);
        const allSame = input.every((v) => typeof v === firstTypeof && Object.getPrototypeOf(v) === Object.getPrototypeOf(input[0]));
        if (!allSame) {
            return { L: input.map((v) => _inferDynamoValueTypes(v)) };
        }
        else {
            if (firstTypeof === 'string') {
                return { SS: input };
            }
            else if (firstTypeof === 'number') {
                return { NS: input.map(v => v.toString()) };
            }
            else {
                return { BS: input };
            }
        }
    }
    else {
        return {
            M: Object.entries(input).reduce((acc, [attrib, value]) => ({
                ...acc,
                [attrib]: _inferDynamoValueTypes(value)
            }), {})
        };
    }
};
export const fromDynamo = (input) => {
    const typeKey = Object.keys(input)[0];
    if (['S', 'N', 'B', 'BOOL', 'NULL', 'BS', 'SS', 'NS', 'L', 'M'].includes(typeKey)) {
        return _inferJsValues(input);
    }
    else {
        return _inferJsValues(input);
    }
};
const _inferJsValues = (input) => {
    if ('S' in input) {
        return Object.values(input)[0].toString();
    }
    else if ('N' in input) {
        return parseNumberOrThrow(Object.values(input)[0]);
    }
    else if ('B' in input) {
        return Buffer.from(Object.values(input)[0]);
    }
    else if ('SS' in input) {
        return Object.values(input)[0];
    }
    else if ('NS' in input) {
        return Object.values(input)[0].map(parseNumberOrThrow);
    }
    else if ('BS' in input) {
        return Object.values(input)[0].map(b => Buffer.from(b));
    }
    else if ('NULL' in input) {
        return null;
    }
    else if ('BOOL' in input) {
        return Object.values(input)[0];
    }
    else if ('L' in input) {
        return Object.values(input)[0].map(item => _inferJsValues(item));
    }
    else if ('M' in input) {
        const dictOfTypedVals = Object.values(input)[0];
        return Object.entries(dictOfTypedVals).reduce((acc, [keyname, item]) => ({
            ...acc,
            [keyname]: _inferJsValues(item)
        }), {});
    }
    else {
        return Object.entries(input).reduce((acc, [keyname, item]) => ({
            ...acc,
            [keyname]: _inferJsValues(item)
        }), {});
    }
};
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
const _giveDynamoTypesToValues = (i) => {
    return Object.entries(i).reduce((acc, [attribute, value]) => ({
        ...acc,
        [attribute]: _inferDynamoValueTypes(value)
    }), {});
};
const queryOperators = (inputOpr, logLevel = 5) => {
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
    };
    if (inputOpr in local) {
        return local[inputOpr];
    }
    else {
        if (logLevel >= 4) {
            console.warn('the given operator () was unkown and is defaulting to ');
        }
        return '=';
    }
};
export const mocoQuery = (table, startingState) => {
    const state = {
        _m: {
            reserved: reservedWords(fs, path, brotliDecompressSync),
            ...startingState?._m
        },
        r: {
            TableName: table,
            Select: 'ALL_ATTRIBUTES',
            ReturnConsumedCapacity: 'TOTAL',
            ...startingState?.r
        }
    };
    const ascending = () => {
        return mocoQuery(state.r.TableName, { _m: state._m, r: { ...state.r, ScanIndexForward: true } });
    };
    const consistentRead = (useConsistentRead) => {
        return mocoQuery(state.r.TableName, {
            _m: state._m,
            r: {
                ...state.r,
                ConsistentRead: useConsistentRead
            }
        });
    };
    const descending = () => {
        return mocoQuery(state.r.TableName, { _m: state._m, r: { ...state.r, ScanIndexForward: false } });
    };
    const expressionAttributeValues = (input) => {
        return mocoQuery(state.r.TableName, {
            _m: state._m,
            r: {
                ...state.r,
                ExpressionAttributeValues: state.r.ExpressionAttributeValues
                    ? {
                        ...state.r.ExpressionAttributeValues,
                        ..._giveDynamoTypesToValues(input)
                    }
                    : _giveDynamoTypesToValues(input)
            }
        });
    };
    const expressionAttributeNames = (input) => {
        return mocoQuery(state.r.TableName, {
            _m: state._m,
            r: {
                ...state.r,
                ExpressionAttributeNames: state.r.ExpressionAttributeNames
                    ? {
                        ...state.r.ExpressionAttributeNames,
                        ...input
                    }
                    : input
            }
        });
    };
    const extract = () => {
        return state.r;
    };
    const filterExpression = (filterExpr) => {
        return mocoQuery(state.r.TableName, {
            _m: state._m,
            r: { ...state.r, FilterExpression: filterExpr }
        });
    };
    const limit = (n) => {
        return mocoQuery(state.r.TableName, {
            _m: state._m,
            r: {
                ...state.r,
                Limit: n
            }
        });
    };
    const projectionExpression = (...projExpr) => {
        return mocoQuery(state.r.TableName, {
            _m: state._m,
            r: {
                ...state.r,
                ProjectionExpression: projExpr.join(','),
                Select: 'SPECIFIC_ATTRIBUTES'
            }
        });
    };
    const usingIndex = (indexName) => {
        return mocoQuery(state.r.TableName, {
            _m: state._m,
            r: {
                ...state.r,
                IndexName: indexName
            }
        });
    };
    const returnConsumedCapacity = (input = 'TOTAL') => {
        return mocoQuery(state.r.TableName, {
            _m: state._m,
            r: {
                ...state.r,
                ReturnConsumedCapacity: input
            }
        });
    };
    const select = (input) => {
        const r = state.r;
        if (input === '*') {
            r.Select = 'ALL_ATTRIBUTES';
            r.ProjectionExpression = undefined;
        }
        else if (isArray(input)) {
            r.Select = 'SPECIFIC_ATTRIBUTES';
            r.ProjectionExpression = input.join(',');
        }
        else if (input === 'COUNT') {
            r.Select = 'COUNT';
            r.ProjectionExpression = undefined;
        }
        else if (input === 'ALL_PROJECTED_ATTRIBUTES') {
            r.Select = 'ALL_PROJECTED_ATTRIBUTES';
            r.ProjectionExpression = undefined;
        }
        else {
            throw new Error('WAT');
        }
        return mocoQuery(state.r.TableName, {
            _m: state._m,
            r
        });
    };
    const startKey = (lastKeyEvaluated) => {
        return mocoQuery(state.r.TableName, {
            _m: state._m,
            r: {
                ...state.r,
                ExclusiveStartKey: lastKeyEvaluated
            }
        });
    };
    const _mocoPredicate = (input) => {
        const ret = {
            KeyConditionExpression: '',
            ExpressionAttributeValues: {},
            ExpressionAttributeNames: {}
        };
        const oper = queryOperators(input[1]);
        const Attr = input[0];
        let abbrevAttr;
        if (Attr.toUpperCase() in state._m.reserved) {
            abbrevAttr = `#${Attr.toLowerCase().slice(0, 3)}`;
        }
        if (oper === 'BETWEEN') {
            const [valueLo, valueHi] = input[2];
            const typedValueLo = _inferDynamoValueTypes(valueLo);
            const typedValueHi = _inferDynamoValueTypes(valueHi);
            const placeholderLo = `:${Attr.toLowerCase().slice(0, 3)}Lo`;
            const placeholderHi = `:${Attr.toLowerCase().slice(0, 3)}Hi`;
            ret.KeyConditionExpression = `${abbrevAttr || Attr} BETWEEN ${placeholderLo} AND ${placeholderHi}`;
            ret.ExpressionAttributeValues = {
                [placeholderLo]: typedValueLo,
                [placeholderHi]: typedValueHi
            };
            ret.ExpressionAttributeNames = abbrevAttr ? { [abbrevAttr]: Attr } : {};
            return ret;
        }
        else {
            const value = input[2];
            const typedValue = _inferDynamoValueTypes(value);
            const placeholder = `:${Attr.toLowerCase().slice(0, 3)}`;
            ret.ExpressionAttributeValues = { [placeholder]: typedValue };
            ret.ExpressionAttributeNames = abbrevAttr ? { [abbrevAttr]: Attr } : {};
            if (oper === 'begins_with') {
                ret.KeyConditionExpression = `begins_with(${abbrevAttr || Attr},${placeholder})`;
                return ret;
            }
            else {
                ret.KeyConditionExpression = `${abbrevAttr || Attr} ${oper} ${placeholder}`;
                return ret;
            }
        }
    };
    const filter = (_input) => {
        const r = { ...state.r };
        if (typeof _input === 'string') {
            const input = _input;
            r.FilterExpression = (r.FilterExpression || '').length > 0
                ? `${r.FilterExpression} ${input}`
                : `${input}`;
            return mocoQuery(state.r.TableName, { r, _m: state._m });
        }
        else {
            if (isArray(_input) && typeof _input[0] === 'string' && isArray(_input[1])) {
                const input = _input;
                const expressionLinkType = input[0];
                const mocoExpr = input[1];
                const { KeyConditionExpression, ExpressionAttributeValues, ExpressionAttributeNames } = _mocoPredicate(mocoExpr);
                const FilterExpression = KeyConditionExpression;
                r.FilterExpression = (r.FilterExpression || '').length > 0
                    ? `${r.FilterExpression} ${expressionLinkType} ${FilterExpression}`
                    : FilterExpression;
                r.ExpressionAttributeValues = Object.keys((r.ExpressionAttributeValues || {})).length > 0
                    ? { ...r.ExpressionAttributeValues, ...ExpressionAttributeValues }
                    : ExpressionAttributeValues;
                r.ExpressionAttributeNames = Object.keys((r.ExpressionAttributeNames || {})).length > 0
                    ? { ...r.ExpressionAttributeNames, ...ExpressionAttributeNames }
                    : ExpressionAttributeNames;
                return mocoQuery(state.r.TableName, {
                    r: {
                        ...r,
                        FilterExpression: r.FilterExpression,
                        ...(Object.keys(r.ExpressionAttributeValues).length > 0 ? { ExpressionAttributeValues: r.ExpressionAttributeValues } : {}),
                        ...(Object.keys(r.ExpressionAttributeNames).length > 0 ? { ExpressionAttributeNames: r.ExpressionAttributeNames } : {})
                    },
                    _m: state._m
                });
            }
            else {
                const input = _input;
                const { KeyConditionExpression, ExpressionAttributeValues, ExpressionAttributeNames } = _mocoPredicate(input);
                const FilterExpression = KeyConditionExpression;
                return mocoQuery(state.r.TableName, {
                    r: {
                        ...r,
                        FilterExpression,
                        ...(Object.keys(ExpressionAttributeValues).length > 0 ? { ExpressionAttributeValues } : {}),
                        ...(Object.keys(ExpressionAttributeNames).length > 0 ? { ExpressionAttributeNames } : {})
                    },
                    _m: state._m
                });
            }
        }
    };
    const where = (_input) => {
        const r = { ...state.r };
        if (typeof _input === 'string') {
            const input = _input;
            r.KeyConditionExpression = (r.KeyConditionExpression || '').length > 0
                ? `${r.KeyConditionExpression} ${input}`
                : `${input}`;
            return mocoQuery(state.r.TableName, { r, _m: state._m });
        }
        else if (isArray(_input) && ['AND', 'OR'].includes(_input[0]) && isArray(_input[1])) {
            const input = _input;
            const expressionLinkType = input[0];
            const mocoExpr = input[1];
            const { KeyConditionExpression, ExpressionAttributeValues, ExpressionAttributeNames } = _mocoPredicate(mocoExpr);
            r.KeyConditionExpression = (r.KeyConditionExpression || '').length > 0
                ? `${r.KeyConditionExpression} ${expressionLinkType} ${KeyConditionExpression}`
                : KeyConditionExpression;
            r.ExpressionAttributeValues = Object.keys((r.ExpressionAttributeValues || {})).length > 0
                ? { ...r.ExpressionAttributeValues, ...ExpressionAttributeValues }
                : ExpressionAttributeValues;
            r.ExpressionAttributeNames = Object.keys((r.ExpressionAttributeNames || {})).length > 0
                ? { ...r.ExpressionAttributeNames, ...ExpressionAttributeNames }
                : ExpressionAttributeNames;
            return mocoQuery(state.r.TableName, {
                r: {
                    ...r,
                    KeyConditionExpression: r.KeyConditionExpression,
                    ...(Object.keys(r.ExpressionAttributeValues).length > 0 ? { ExpressionAttributeValues: r.ExpressionAttributeValues } : {}),
                    ...(Object.keys(r.ExpressionAttributeNames).length > 0 ? { ExpressionAttributeNames: r.ExpressionAttributeNames } : {})
                },
                _m: state._m
            });
        }
        else {
            const input = _input;
            const { KeyConditionExpression, ExpressionAttributeValues, ExpressionAttributeNames } = _mocoPredicate(input);
            return mocoQuery(state.r.TableName, {
                r: {
                    ...r,
                    KeyConditionExpression,
                    ...(Object.keys(ExpressionAttributeValues).length > 0 ? { ExpressionAttributeValues } : {}),
                    ...(Object.keys(ExpressionAttributeNames).length > 0 ? { ExpressionAttributeNames } : {})
                },
                _m: state._m
            });
        }
    };
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
    };
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
        const res = await db.scan({ TableName: table, ...mocoScanState, ...scanWithThis }).promise();
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
        const _Items = res.Items ? res.Items.map(entry => fromDynamo(entry)) : undefined;
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
        mocoQuery,
        _inferValueTypes: _inferDynamoValueTypes,
        _giveTypesToValues: _giveDynamoTypesToValues,
        _db: db
    };
};
export default { dynamoco, mocoQuery };
