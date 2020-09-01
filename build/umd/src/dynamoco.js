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
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./mocoQuery"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const mocoQuery_1 = require("./mocoQuery");
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
        return Object.entries(input).reduce((acc, [attrib, typedDynamoVal]) => (Object.assign(Object.assign({}, acc), { [attrib]: mocoQuery_1._inferJsValues(typedDynamoVal) })), {});
    };
    exports.dynamoco = (db, defaults) => {
        const getItem = async (TableName, input, opts) => {
            const Key = mocoQuery_1._giveDynamoTypesToValues(input);
            const res = await db.getItem(Object.assign({ TableName, Key }, opts)).promise();
            const _Item = exports._stipDynamoTypingsForValues(res.Item);
            return Object.assign(Object.assign({}, res), { _Item });
        };
        const putItem = async (TableName, item, opts) => {
            const Item = mocoQuery_1._giveDynamoTypesToValues(item);
            const res = await db.putItem(Object.assign({ TableName, Item }, opts)).promise();
            const _Attributes = exports._stipDynamoTypingsForValues(res.Attributes);
            return Object.assign(Object.assign({}, res), { _Attributes });
        };
        const getBatch = async (batchReq) => {
            const RequestItems = Object.entries(batchReq)
                .reduce((acc, [table, attributeValObjArr]) => (Object.assign(Object.assign({}, acc), { [table]: { Keys: attributeValObjArr.map(mocoQuery_1._giveDynamoTypesToValues) } })), {});
            const res = await db.batchGetItem({ RequestItems }).promise();
            const _Responses = Object.entries(res.Responses)
                .reduce((acc, [table, typedAttribMapArr]) => (Object.assign(Object.assign({}, acc), { [table]: typedAttribMapArr.map((item) => exports._stipDynamoTypingsForValues(item)) })), {});
            return Object.assign(Object.assign({}, res), { _Responses });
        };
        const putBatch = async (batchReq, opts) => {
            const RequestItems = Object.entries(batchReq).reduce((acc, [table, putReqArr]) => (Object.assign(Object.assign({}, acc), { [table]: putReqArr.map(v => ({ PutRequest: { Item: mocoQuery_1._giveDynamoTypesToValues(v) } })) })), {});
            return db.batchWriteItem(Object.assign({ RequestItems }, opts)).promise();
        };
        const deleteBatch = async (batchReq, opts) => {
            const RequestItems = Object.entries(batchReq).reduce((acc, [table, keysForDelReqArr]) => (Object.assign(Object.assign({}, acc), { [table]: keysForDelReqArr.map(v => ({ DeleteRequest: { Key: mocoQuery_1._giveDynamoTypesToValues(v) } })) })), {});
            return db.batchWriteItem(Object.assign({ RequestItems }, opts)).promise();
        };
        const query = async (input, mocoWhereClauses = [], mocoFilterClauses = [], opts) => {
            const q = typeof input === 'string' ? mocoQuery_1.mocoQuery(input) : input;
            let query;
            if ('extract' in q) {
                let moco = q;
                moco = mocoWhereClauses.reduce((p, c) => p.where(c), moco);
                moco = mocoFilterClauses.reduce((p, c) => p.filter(c), moco);
                query = moco.extract();
            }
            else {
                query = q;
            }
            const res = await db.query(Object.assign(Object.assign({}, query), opts)).promise();
            const ret = Object.assign(Object.assign({}, res), (res.Items
                ? { _Items: res.Items.map(v => exports._stipDynamoTypingsForValues(v)) }
                : { _Items: [] }));
            return ret;
        };
        const scan = async (input, mocoScanState = {}, ...mocoFilterClauses) => {
            const scanParam = typeof input === 'string' ? mocoQuery_1.mocoQuery(input) : input;
            let scanWithThis;
            if ('extract' in scanParam) {
                scanWithThis = mocoFilterClauses.reduce((p, c) => p.filter(c), scanParam).extract();
            }
            else {
                scanWithThis = scanParam;
            }
            const res = await db.scan(Object.assign(Object.assign({}, mocoScanState), scanWithThis)).promise();
            const ret = Object.assign(Object.assign({}, res), (res.Items
                ? { _Items: res.Items.map(v => exports._stipDynamoTypingsForValues(v)) }
                : {}));
            return ret;
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
                const _Items = res.Items
                    ? res.Items.map(entry => mocoQuery_1.fromDynamo(entry))
                    : undefined;
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
            _db: db
        };
    };
    exports.default = exports.dynamoco;
});
