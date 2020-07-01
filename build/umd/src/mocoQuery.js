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
    const { isArray } = Array;
    const isError = (input) => input instanceof Error;
    const isString = (i) => typeof i === 'string' || i instanceof String;
    const isBool = (i) => typeof i === 'boolean' || i instanceof Boolean;
    const isNumber = (i) => typeof i === 'number' || i instanceof Number;
    const isBinary = (i) => Buffer.isBuffer(i);
    const isNull = (i) => i === null;
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
    exports._inferDynamoValueTypes = (input) => {
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
            const allSame = input.every((v) => typeof v === firstTypeof && Object.getPrototypeOf(v) === firstProtoOf);
            if (!allSame) {
                return { L: input.map((v) => exports._inferDynamoValueTypes(v)) };
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
                M: Object.entries(input).reduce((acc, [attrib, value]) => (Object.assign(Object.assign({}, acc), { [attrib]: exports._inferDynamoValueTypes(value) })), {})
            };
        }
    };
    exports.fromDynamo = (input) => {
        const typeKey = Object.keys(input)[0];
        if (['S', 'N', 'B', 'BOOL', 'NULL', 'BS', 'SS', 'NS', 'L', 'M'].includes(typeKey)) {
            return exports._inferJsValues(input);
        }
        else {
            return exports._inferJsValues(input);
        }
    };
    exports._inferJsValues = (input) => {
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
            return Object.values(input)[0].map(item => exports._inferJsValues(item));
        }
        else if ('M' in input) {
            const dictOfTypedVals = Object.values(input)[0];
            return Object.entries(dictOfTypedVals).reduce((acc, [keyname, item]) => (Object.assign(Object.assign({}, acc), { [keyname]: exports._inferJsValues(item) })), {});
        }
        else {
            return Object.entries(input).reduce((acc, [keyname, item]) => (Object.assign(Object.assign({}, acc), { [keyname]: exports._inferJsValues(item) })), {});
        }
    };
    exports.queryOperators = (inputOpr, logLevel = 5) => {
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
    exports._giveDynamoTypesToValues = (i) => {
        return Object.entries(i).reduce((acc, [attribute, value]) => (Object.assign(Object.assign({}, acc), { [attribute]: exports._inferDynamoValueTypes(value) })), {});
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
                        ? Object.assign(Object.assign({}, state.r.ExpressionAttributeValues), exports._giveDynamoTypesToValues(input)) : exports._giveDynamoTypesToValues(input) })
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
            const oper = exports.queryOperators(input[1]);
            const Attr = input[0];
            let abbrevAttr;
            if (Attr.toUpperCase() in state._m.reserved) {
                abbrevAttr = `#${Attr.toLowerCase().slice(0, 3)}`;
            }
            if (oper === 'BETWEEN') {
                const [valueLo, valueHi] = input[2];
                const typedValueLo = exports._inferDynamoValueTypes(valueLo);
                const typedValueHi = exports._inferDynamoValueTypes(valueHi);
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
                const typedValue = exports._inferDynamoValueTypes(value);
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
    exports.default = exports.mocoQuery;
});
