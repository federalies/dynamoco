var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "url", "./dynamoReservedWords", "zlib", "fs", "path"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const url_1 = require("url");
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
            '<>': '<>',
            '!=': '<>',
            '!==': '<>',
            NOT: '<>',
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
                console.warn(`the given operator (${inputOpr}) : is an unkown operator and is defaulting to '='`);
            }
            return '=';
        }
    };
    exports._giveDynamoTypesToValues = (i) => {
        return Object.entries(i).reduce((acc, [attribute, value]) => (Object.assign(Object.assign({}, acc), { [attribute]: exports._inferDynamoValueTypes(value) })), {});
    };
    exports.mocoQuery = function mocoquery(table, startingState) {
        const state = {
            _m: Object.assign({ where: [], filters: [], reserved: dynamoReservedWords_1.reservedWords(fs_1.default, path_1.default, zlib_1.brotliDecompressSync) }, startingState === null || startingState === void 0 ? void 0 : startingState._m),
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
                    state._m.filters.push(input);
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
                    state._m.filters.push(input);
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
                state._m.where.push(input.replace(' ', ':'));
                r.KeyConditionExpression = (r.KeyConditionExpression || '').length > 0
                    ? `${r.KeyConditionExpression} ${input}`
                    : `${input}`;
                return exports.mocoQuery(state.r.TableName, { r, _m: state._m });
            }
            else if (isArray(_input) && ['AND', 'OR'].includes(_input[0]) && isArray(_input[1])) {
                const input = _input;
                const expressionLinkType = input[0];
                const mocoExpr = input[1];
                state._m.where.push(input);
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
                state._m.where.push(_input);
                const { KeyConditionExpression, ExpressionAttributeValues, ExpressionAttributeNames } = _mocoPredicate(input);
                return exports.mocoQuery(state.r.TableName, {
                    r: Object.assign(Object.assign(Object.assign(Object.assign({}, r), { KeyConditionExpression }), (Object.keys(ExpressionAttributeValues).length > 0 ? { ExpressionAttributeValues } : {})), (Object.keys(ExpressionAttributeNames).length > 0 ? { ExpressionAttributeNames } : {})),
                    _m: state._m
                });
            }
        };
        const toUrlString = () => {
            const directParams = {
                Limit: state.r.Limit,
                IndexName: state.r.IndexName,
                ConsistentRead: state.r.ConsistentRead,
                ExclusiveStartKey: state.r.ExclusiveStartKey,
                ProjectionExpression: state.r.ProjectionExpression,
                ScanIndexForward: state.r.ScanIndexForward,
                Select: state.r.Select,
                ReturnConsumedCapacity: state.r.ReturnConsumedCapacity
            };
            const attrToString = (mode) => (v, i) => {
                if (mode === 'path') {
                    if (typeof v === 'string') {
                        return v;
                    }
                    else if ((v[0] === 'AND' || v[0] === 'OR')) {
                        const _v = v;
                        const attr = _v[1][0];
                        const op = _v[1][1];
                        const val = _v[1][2];
                        return `${attr}+${op}+${JSON.stringify(val)}`;
                    }
                    else {
                        const _v = v;
                        const attr = _v[0];
                        const op = _v[1];
                        const val = _v[2];
                        return `${attr}+${op}+${JSON.stringify(val)}`;
                    }
                }
                else {
                    if (typeof v === 'string') {
                        return v;
                    }
                    else if ((v[0] === 'AND' || v[0] === 'OR')) {
                        const _v = v;
                        const linker = _v[0];
                        const attr = _v[1][0];
                        const op = _v[1][1];
                        const val = _v[1][2];
                        return `${linker}+${attr}+${op}+${JSON.stringify(val)}`;
                    }
                    else {
                        const _v = v;
                        const attr = _v[0];
                        const op = _v[1];
                        const val = _v[2];
                        return `${attr}+${op}+${JSON.stringify(val)}`;
                    }
                }
            };
            return encodeURI(`dynamo://${state.r.TableName}/${state._m.where.map(attrToString('path')).join('/')}${state._m.filters.map(attrToString('query')).join('&').length > 0
                ? `?${state._m.filters.map(attrToString('query')).join('&')}`
                : ''}${Object.entries(directParams)
                .filter(([key, val]) => val)
                .map(([key, val]) => `${key}=${JSON.stringify(val)}`).join('&').length > 0
                ? `#${Object.entries(directParams)
                    .filter(([key, val]) => val)
                    .map(([key, val]) => `${key}=${JSON.stringify(val)}`).join('&')}`
                : ''}`);
        };
        const toURL = () => {
            return new url_1.URL(toUrlString());
        };
        const fromUrl = (i) => {
            if (typeof i === 'string')
                i = new url_1.URL(i);
            const pathSegs = i.pathname.split('/')
                .filter(seg => seg.length > 1)
                .map(seg => seg.split('+'))
                .map(seg => seg.map(elem => decodeURI(elem)))
                .map(seg => seg.map((elem, i) => i === 2 ? JSON.parse(elem) : elem));
            const filters = [...i.searchParams.entries()].map(([key, val], i) => {
                return val
                    ? [...key.split(' ').map(chunk => chunk.length === 0 ? '=' : chunk), val]
                    : [...key.split(' ').map(chunk => chunk.length === 0 ? '=' : chunk)];
            }).map(wordArr => {
                return wordArr.length === 4
                    ? [wordArr[0], [...wordArr.slice(1)]]
                    : wordArr;
            }).map(f => f.length === 3
                ? [f[0], f[1], JSON.parse(f[2])]
                : [f[0], [f[1][0], f[1][1], JSON.parse(f[1][2])]]);
            const hashParams = i.hash
                .slice(1)
                .split('&')
                .map(seg => seg.split('='))
                .map(seg => seg.map(elem => decodeURI(elem)))
                .map(seg => seg.map((elem, i) => i === 1 ? JSON.parse(elem) : elem))
                .reduce((p, [key, val]) => (Object.assign(Object.assign({}, p), { [key]: val })), {});
            const directParams = {
                Limit: hashParams === null || hashParams === void 0 ? void 0 : hashParams.Limit,
                IndexName: hashParams === null || hashParams === void 0 ? void 0 : hashParams.IndexName,
                ConsistentRead: hashParams === null || hashParams === void 0 ? void 0 : hashParams.ConsistentRead,
                ExclusiveStartKey: hashParams === null || hashParams === void 0 ? void 0 : hashParams.ExclusiveStartKey,
                ProjectionExpression: hashParams === null || hashParams === void 0 ? void 0 : hashParams.ProjectionExpression,
                ScanIndexForward: hashParams === null || hashParams === void 0 ? void 0 : hashParams.ScanIndexForward,
                Select: hashParams === null || hashParams === void 0 ? void 0 : hashParams.Select,
                ReturnConsumedCapacity: hashParams === null || hashParams === void 0 ? void 0 : hashParams.ReturnConsumedCapacity
            };
            let ret = exports.mocoQuery(i.host, { r: directParams, _m: {} });
            for (const pred of pathSegs) {
                ret = ret.where(pred);
            }
            for (const f of filters) {
                ret = ret.filter(f);
            }
            return ret;
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
            where,
            toURL,
            toUrlString,
            fromUrl
        };
    };
    exports.default = exports.mocoQuery;
});
