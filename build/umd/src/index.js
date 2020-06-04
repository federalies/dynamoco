var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __asyncDelegator = (this && this.__asyncDelegator) || function (o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
};
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./dynamoReservedWords", "zlib", "fs", "path"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const dynamoReservedWords_1 = require("./dynamoReservedWords");
    const zlib_1 = require("zlib");
    const fs_1 = __importDefault(require("fs"));
    const path_1 = __importDefault(require("path"));
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
    exports.parseNumber = (input) => {
        return !Number.isNaN(Number.parseFloat(input))
            ? Number.parseFloat(input)
            : new Error('Got an N or NS typed data element that was not a parsable string');
    };
    exports.parseNumberOrThrow = (input) => {
        const numErr = exports.parseNumber(input);
        if (isError(numErr)) {
            throw numErr;
        }
        else {
            return numErr;
        }
    };
    exports.toDynamo = (input) => {
        if (isPrimitive(input) || isArray(input) || isBuffer(input)) {
            return _inferDynamoValueTypes(input);
        }
        else {
            const ret = Object.entries(input).reduce((p, [key, val], i, a) => {
                return Object.assign(Object.assign({}, p), { [key]: _inferDynamoValueTypes(val) });
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
                M: Object.entries(input).reduce((acc, [attrib, value]) => (Object.assign(Object.assign({}, acc), { [attrib]: _inferDynamoValueTypes(value) })), {})
            };
        }
    };
    exports.fromDynamo = (input) => {
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
            return exports.parseNumberOrThrow(Object.values(input)[0]);
        }
        else if ('B' in input) {
            return Buffer.from(Object.values(input)[0]);
        }
        else if ('SS' in input) {
            return Object.values(input)[0];
        }
        else if ('NS' in input) {
            return Object.values(input)[0].map(exports.parseNumberOrThrow);
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
            return Object.entries(dictOfTypedVals).reduce((acc, [keyname, item]) => (Object.assign(Object.assign({}, acc), { [keyname]: _inferJsValues(item) })), {});
        }
        else {
            return Object.entries(input).reduce((acc, [keyname, item]) => (Object.assign(Object.assign({}, acc), { [keyname]: _inferJsValues(item) })), {});
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
        const columns = (tableDef.AttributeDefinitions || []).reduce((p, c) => {
            var _a;
            return (Object.assign(Object.assign({}, p), { [c.AttributeName]: {
                    columnName: c.AttributeName,
                    origType: c.AttributeType,
                    dbmlType: (_a = mapping[c.AttributeType]) !== null && _a !== void 0 ? _a : 'varchar',
                    settings: {
                        notes: '',
                        primaryKey: false
                    }
                } }));
        }, {});
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
    exports._stipDynamoTypingsForValues = (input = {}) => {
        return Object.entries(input).reduce((acc, [attrib, typedDynamoVal]) => (Object.assign(Object.assign({}, acc), { [attrib]: _inferJsValues(typedDynamoVal) })), {});
    };
    const _giveDynamoTypesToValues = (i) => {
        return Object.entries(i).reduce((acc, [attribute, value]) => (Object.assign(Object.assign({}, acc), { [attribute]: _inferDynamoValueTypes(value) })), {});
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
    exports.mocoQuery = (table, startingState) => {
        const state = {
            _m: Object.assign({ reserved: dynamoReservedWords_1.reservedWords(fs_1.default, path_1.default, zlib_1.brotliDecompressSync) }, startingState === null || startingState === void 0 ? void 0 : startingState._m),
            r: Object.assign({ TableName: table, Select: 'ALL_ATTRIBUTES', ReturnConsumedCapacity: 'TOTAL' }, startingState === null || startingState === void 0 ? void 0 : startingState.r)
        };
        const ascending = () => {
            return exports.mocoQuery(state.r.TableName, { _m: state._m, r: Object.assign(Object.assign({}, state.r), { ScanIndexForward: true }) });
        };
        const consistentRead = (useConsistentRead) => {
            return exports.mocoQuery(state.r.TableName, {
                _m: state._m,
                r: Object.assign(Object.assign({}, state.r), { ConsistentRead: useConsistentRead })
            });
        };
        const descending = () => {
            return exports.mocoQuery(state.r.TableName, { _m: state._m, r: Object.assign(Object.assign({}, state.r), { ScanIndexForward: false }) });
        };
        const expressionAttributeValues = (input) => {
            return exports.mocoQuery(state.r.TableName, {
                _m: state._m,
                r: Object.assign(Object.assign({}, state.r), { ExpressionAttributeValues: state.r.ExpressionAttributeValues
                        ? Object.assign(Object.assign({}, state.r.ExpressionAttributeValues), _giveDynamoTypesToValues(input)) : _giveDynamoTypesToValues(input) })
            });
        };
        const expressionAttributeNames = (input) => {
            return exports.mocoQuery(state.r.TableName, {
                _m: state._m,
                r: Object.assign(Object.assign({}, state.r), { ExpressionAttributeNames: state.r.ExpressionAttributeNames
                        ? Object.assign(Object.assign({}, state.r.ExpressionAttributeNames), input) : input })
            });
        };
        const extract = () => {
            return state.r;
        };
        const filterExpression = (filterExpr) => {
            return exports.mocoQuery(state.r.TableName, {
                _m: state._m,
                r: Object.assign(Object.assign({}, state.r), { FilterExpression: filterExpr })
            });
        };
        const limit = (n) => {
            return exports.mocoQuery(state.r.TableName, {
                _m: state._m,
                r: Object.assign(Object.assign({}, state.r), { Limit: n })
            });
        };
        const projectionExpression = (...projExpr) => {
            return exports.mocoQuery(state.r.TableName, {
                _m: state._m,
                r: Object.assign(Object.assign({}, state.r), { ProjectionExpression: projExpr.join(','), Select: 'SPECIFIC_ATTRIBUTES' })
            });
        };
        const usingIndex = (indexName) => {
            return exports.mocoQuery(state.r.TableName, {
                _m: state._m,
                r: Object.assign(Object.assign({}, state.r), { IndexName: indexName })
            });
        };
        const returnConsumedCapacity = (input = 'TOTAL') => {
            return exports.mocoQuery(state.r.TableName, {
                _m: state._m,
                r: Object.assign(Object.assign({}, state.r), { ReturnConsumedCapacity: input })
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
            return exports.mocoQuery(state.r.TableName, {
                _m: state._m,
                r
            });
        };
        const startKey = (lastKeyEvaluated) => {
            return exports.mocoQuery(state.r.TableName, {
                _m: state._m,
                r: Object.assign(Object.assign({}, state.r), { ExclusiveStartKey: lastKeyEvaluated })
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
            const r = Object.assign({}, state.r);
            if (typeof _input === 'string') {
                const input = _input;
                r.FilterExpression = (r.FilterExpression || '').length > 0
                    ? `${r.FilterExpression} ${input}`
                    : `${input}`;
                return exports.mocoQuery(state.r.TableName, { r, _m: state._m });
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
                        ? Object.assign(Object.assign({}, r.ExpressionAttributeValues), ExpressionAttributeValues) : ExpressionAttributeValues;
                    r.ExpressionAttributeNames = Object.keys((r.ExpressionAttributeNames || {})).length > 0
                        ? Object.assign(Object.assign({}, r.ExpressionAttributeNames), ExpressionAttributeNames) : ExpressionAttributeNames;
                    return exports.mocoQuery(state.r.TableName, {
                        r: Object.assign(Object.assign(Object.assign(Object.assign({}, r), { FilterExpression: r.FilterExpression }), (Object.keys(r.ExpressionAttributeValues).length > 0 ? { ExpressionAttributeValues: r.ExpressionAttributeValues } : {})), (Object.keys(r.ExpressionAttributeNames).length > 0 ? { ExpressionAttributeNames: r.ExpressionAttributeNames } : {})),
                        _m: state._m
                    });
                }
                else {
                    const input = _input;
                    const { KeyConditionExpression, ExpressionAttributeValues, ExpressionAttributeNames } = _mocoPredicate(input);
                    const FilterExpression = KeyConditionExpression;
                    return exports.mocoQuery(state.r.TableName, {
                        r: Object.assign(Object.assign(Object.assign(Object.assign({}, r), { FilterExpression }), (Object.keys(ExpressionAttributeValues).length > 0 ? { ExpressionAttributeValues } : {})), (Object.keys(ExpressionAttributeNames).length > 0 ? { ExpressionAttributeNames } : {})),
                        _m: state._m
                    });
                }
            }
        };
        const where = (_input) => {
            const r = Object.assign({}, state.r);
            if (typeof _input === 'string') {
                const input = _input;
                r.KeyConditionExpression = (r.KeyConditionExpression || '').length > 0
                    ? `${r.KeyConditionExpression} ${input}`
                    : `${input}`;
                return exports.mocoQuery(state.r.TableName, { r, _m: state._m });
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
                    ? Object.assign(Object.assign({}, r.ExpressionAttributeValues), ExpressionAttributeValues) : ExpressionAttributeValues;
                r.ExpressionAttributeNames = Object.keys((r.ExpressionAttributeNames || {})).length > 0
                    ? Object.assign(Object.assign({}, r.ExpressionAttributeNames), ExpressionAttributeNames) : ExpressionAttributeNames;
                return exports.mocoQuery(state.r.TableName, {
                    r: Object.assign(Object.assign(Object.assign(Object.assign({}, r), { KeyConditionExpression: r.KeyConditionExpression }), (Object.keys(r.ExpressionAttributeValues).length > 0 ? { ExpressionAttributeValues: r.ExpressionAttributeValues } : {})), (Object.keys(r.ExpressionAttributeNames).length > 0 ? { ExpressionAttributeNames: r.ExpressionAttributeNames } : {})),
                    _m: state._m
                });
            }
            else {
                const input = _input;
                const { KeyConditionExpression, ExpressionAttributeValues, ExpressionAttributeNames } = _mocoPredicate(input);
                return exports.mocoQuery(state.r.TableName, {
                    r: Object.assign(Object.assign(Object.assign(Object.assign({}, r), { KeyConditionExpression }), (Object.keys(ExpressionAttributeValues).length > 0 ? { ExpressionAttributeValues } : {})), (Object.keys(ExpressionAttributeNames).length > 0 ? { ExpressionAttributeNames } : {})),
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
    exports.dynamoco = (db, defaults) => {
        const getItem = async (TableName, input, opts) => {
            const Key = _giveDynamoTypesToValues(input);
            const res = await db.getItem(Object.assign({ TableName, Key }, opts)).promise();
            const _Item = exports._stipDynamoTypingsForValues(res.Item);
            return Object.assign(Object.assign({}, res), { _Item });
        };
        const putItem = async (TableName, item, opts) => {
            const Item = _giveDynamoTypesToValues(item);
            const res = await db.putItem(Object.assign({ TableName, Item }, opts)).promise();
            const _Attributes = exports._stipDynamoTypingsForValues(res.Attributes);
            return Object.assign(Object.assign({}, res), { _Attributes });
        };
        const getBatch = async (batchReq) => {
            const RequestItems = Object.entries(batchReq)
                .reduce((acc, [table, attributeValObjArr]) => (Object.assign(Object.assign({}, acc), { [table]: { Keys: attributeValObjArr.map(_giveDynamoTypesToValues) } })), {});
            const res = await db.batchGetItem({ RequestItems }).promise();
            const _Responses = Object.entries(res.Responses)
                .reduce((acc, [table, typedAttribMapArr]) => (Object.assign(Object.assign({}, acc), { [table]: typedAttribMapArr.map((item) => exports._stipDynamoTypingsForValues(item)) })), {});
            return Object.assign(Object.assign({}, res), { _Responses });
        };
        const putBatch = async (batchReq, opts) => {
            const RequestItems = Object.entries(batchReq).reduce((acc, [table, putReqArr]) => (Object.assign(Object.assign({}, acc), { [table]: putReqArr.map(v => ({ PutRequest: { Item: _giveDynamoTypesToValues(v) } })) })), {});
            return db.batchWriteItem(Object.assign({ RequestItems }, opts)).promise();
        };
        const deleteBatch = async (batchReq, opts) => {
            const RequestItems = Object.entries(batchReq).reduce((acc, [table, keysForDelReqArr]) => (Object.assign(Object.assign({}, acc), { [table]: keysForDelReqArr.map(v => ({ DeleteRequest: { Key: _giveDynamoTypesToValues(v) } })) })), {});
            return db.batchWriteItem(Object.assign({ RequestItems }, opts)).promise();
        };
        const query = async (table, mocoWhereClause, mocoFilterClause, opts) => {
            const q = exports.mocoQuery(table);
            const query = isArray(mocoWhereClause)
                ? mocoFilterClause
                    ? q.where(mocoWhereClause).filter(mocoFilterClause).extract()
                    : q.where(mocoWhereClause).extract()
                : mocoWhereClause;
            const res = await db.query(Object.assign(Object.assign({}, query), opts)).promise();
            return Object.assign(Object.assign({}, res), (res.Items
                ? { _Items: res.Items.map(v => exports._stipDynamoTypingsForValues(v)) }
                : {}));
        };
        const scan = async (table, mocoFilterClause, mocoScanState) => {
            const scanParam = exports.mocoQuery(table);
            const scanWithThis = scanParam.filter(mocoFilterClause).extract();
            const res = await db.scan(Object.assign(Object.assign({ TableName: table }, mocoScanState), scanWithThis)).promise();
            return Object.assign(Object.assign({}, res), (res.Items
                ? { _Items: res.Items.map(v => exports._stipDynamoTypingsForValues(v)) }
                : {}));
        };
        const describeTable = async (TableName) => {
            const res = await db.describeTable({ TableName }).promise();
            const DBML = parseTableProps(TableName, res.Table);
            return Object.assign(Object.assign({}, res), { DBML });
        };
        const updateTable = async (table, onDemandMode, opts) => {
            return db.updateTable(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ TableName: table, BillingMode: onDemandMode ? 'PAY_PER_REQUEST' : 'PROVISIONED' }, ((opts === null || opts === void 0 ? void 0 : opts.attrDefs) ? { AttributeDefinitions: opts.attrDefs } : {})), ((opts === null || opts === void 0 ? void 0 : opts.gsi) ? { GlobalSecondaryIndexUpdates: opts.gsi } : {})), ((opts === null || opts === void 0 ? void 0 : opts.throughput) ? { ProvisionedThroughput: { ReadCapacityUnits: opts.throughput.read, WriteCapacityUnits: opts.throughput.write } } : {})), ((opts === null || opts === void 0 ? void 0 : opts.replicaUpdates) ? { ReplicaUpdates: opts.replicaUpdates } : {})), ((opts === null || opts === void 0 ? void 0 : opts.SSE) ? { SSESpecification: opts.SSE } : {})), ((opts === null || opts === void 0 ? void 0 : opts.streamSpec) ? { StreamSpecification: opts.streamSpec } : {}))).promise();
        };
        function paginate(req) {
            return __asyncGenerator(this, arguments, function* paginate_1() {
                let res;
                if ('KeyConditionExpression' in req || 'ScanIndexForward' in req) {
                    res = yield __await(db.query(req).promise());
                }
                else {
                    res = yield __await(db.scan(req).promise());
                }
                const _Items = res.Items ? res.Items.map(entry => exports.fromDynamo(entry)) : undefined;
                yield yield __await(Object.assign(Object.assign({}, res), { _Items }));
                if (res.LastEvaluatedKey) {
                    yield __await(yield* __asyncDelegator(__asyncValues(paginate(Object.assign(Object.assign({}, req), { ExclusiveStartKey: res.LastEvaluatedKey })))));
                }
            });
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
            mocoQuery: exports.mocoQuery,
            _inferValueTypes: _inferDynamoValueTypes,
            _giveTypesToValues: _giveDynamoTypesToValues,
            _db: db
        };
    };
    exports.default = { dynamoco: exports.dynamoco, mocoQuery: exports.mocoQuery };
});
