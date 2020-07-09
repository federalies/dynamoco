(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "url", "./index.test", "../src/index"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const url_1 = require("url");
    const index_test_1 = require("./index.test");
    const index_1 = require("../src/index");
    const allGroups = async () => {
        const [test, groupTest] = index_test_1.testMaker(__filename);
        return groupTest('MocoQuery Query Builder', groupTest('Easy Tests', test('Check Defaults', index_1.mocoQuery('table1').extract(), {
            TableName: 'table1',
            Select: 'ALL_ATTRIBUTES',
            ReturnConsumedCapacity: 'TOTAL'
        }), test('Using Limit', index_1.mocoQuery('table1').limit(100).extract(), {
            TableName: 'table1',
            Select: 'ALL_ATTRIBUTES',
            ReturnConsumedCapacity: 'TOTAL',
            Limit: 100
        })), groupTest('Level2 Tests', test('exmaple - asc.consistent.filter(gt)', index_1.mocoQuery('table1')
            .ascending()
            .consistentRead(true)
            .filter(['Attribute1', 'equals', 3]).extract(), {
            TableName: 'table1',
            Select: 'ALL_ATTRIBUTES',
            ReturnConsumedCapacity: 'TOTAL',
            ScanIndexForward: true,
            ConsistentRead: true,
            FilterExpression: 'Attribute1 = :att',
            ExpressionAttributeValues: {
                ':att': { N: '3' }
            }
        }), test('exmaple - select.where(BETWEEN)', index_1.mocoQuery('table1')
            .select('COUNT')
            .where(['Attribute1', 'BETWEEN', ['A', 'D']])
            .extract(), {
            TableName: 'table1',
            Select: 'COUNT',
            ReturnConsumedCapacity: 'TOTAL',
            KeyConditionExpression: 'Attribute1 BETWEEN :attLo AND :attHi',
            ExpressionAttributeValues: {
                ':attLo': { S: 'A' },
                ':attHi': { S: 'D' }
            }
        }), test('Using Limit', index_1.mocoQuery('table1')
            .select('*')
            .startKey({ KeyedAttr: { S: 'someString' } })
            .filter(['Attribute2', 'begins_with', 'prefix'])
            .limit(1000)
            .extract(), {
            TableName: 'table1',
            ReturnConsumedCapacity: 'TOTAL',
            Select: 'ALL_ATTRIBUTES',
            Limit: 1000,
            ExclusiveStartKey: { KeyedAttr: { S: 'someString' } },
            FilterExpression: 'begins_with(Attribute2,:att)',
            ExpressionAttributeValues: {
                ':att': { S: 'prefix' }
            }
        })), groupTest('Level3 Tests', test('exmaple - adding stacked Filters', index_1.mocoQuery('table1')
            .filter(['Attribute1', '>', 6])
            .filter(['AND', ['Date', '<', 2025]])
            .extract(), {
            TableName: 'table1',
            ReturnConsumedCapacity: 'TOTAL',
            Select: 'ALL_ATTRIBUTES',
            FilterExpression: 'Attribute1 > :att AND #dat < :dat',
            ExpressionAttributeValues: {
                ':att': { N: '6' },
                ':dat': { N: '2025' }
            },
            ExpressionAttributeNames: {
                '#dat': 'Date'
            }
        }), test('exmaple - adding stacked Where Clauses', index_1.mocoQuery('table1')
            .filter('Attributè2 <= :att')
            .where('Attribute1 > :att')
            .where(['AND', ['Date', '<', 2025]])
            .expressionAttributeValues({ ':att': 7 })
            .extract(), {
            TableName: 'table1',
            ReturnConsumedCapacity: 'TOTAL',
            Select: 'ALL_ATTRIBUTES',
            KeyConditionExpression: 'Attribute1 > :att AND #dat < :dat',
            FilterExpression: 'Attributè2 <= :att',
            ExpressionAttributeValues: {
                ':att': { N: '7' },
                ':dat': { N: '2025' }
            },
            ExpressionAttributeNames: {
                '#dat': 'Date'
            }
        })), test('exmaple - Code Coverage Sandbag Example', index_1.mocoQuery('table1')
            .descending()
            .expressionAttributeNames({ '#d': 'Date' })
            .expressionAttributeValues({ ':dt': 2020 })
            .filterExpression('#d <= :dt')
            .select(['Attr1.SubA', 'Attr2', 'Attr3'])
            .projectionExpression('Attr1.SubA', 'Attr2', 'Attr3')
            .usingIndex('myIndex')
            .returnConsumedCapacity('NONE')
            .extract(), {
            TableName: 'table1',
            IndexName: 'myIndex',
            ReturnConsumedCapacity: 'NONE',
            Select: 'SPECIFIC_ATTRIBUTES',
            ProjectionExpression: 'Attr1.SubA,Attr2,Attr3',
            ExpressionAttributeValues: {
                ':dt': { N: '2020' }
            },
            ExpressionAttributeNames: {
                '#d': 'Date'
            },
            FilterExpression: '#d <= :dt'
        }), test('Is Error Thrown.1', index_test_1.isErrorThrown(() => index_1.mocoQuery('table1')
            .select('ALL_PROJECTED_ATTRIBUTES')
            .select('BAD INPUT')
            .extract()), true), test('Is Error Thrown.1', index_test_1.isErrorThrown(() => index_1.mocoQuery('table1')
            .select('ALL_PROJECTED_ATTRIBUTES')
            .select('BAD INPUT')
            .extract()), true), test('Expression Attr Values', () => index_1.mocoQuery('table1').expressionAttributeValues({ a: true }).extract(), () => { }), test('Dyanmo Query to URL', () => index_1.mocoQuery('table1')
            .select('COUNT')
            .where(['pk', '=', 'Value1'])
            .where(['AND', ['sk', 'begins_with', 'prefix']])
            .filter(['attr1', 'begins_with', 'prefix'])
            .filter(['AND', ['attr2', '=', null]])
            .filter(['AND', ['attr3Not42', '<>', 42]])
            .consistentRead(true)
            .toUrlString(), () => 'dynamo://table1/pk+=+%22Value1%22/sk+begins_with+%22prefix%22?attr1+begins_with+%22prefix%22&AND+attr2+=+null&AND+attr3Not42+%3C%3E+42#ConsistentRead=true&Select=%22COUNT%22&ReturnConsumedCapacity=%22TOTAL%22'), test('Dyanmo Query from URLstring', () => index_1.mocoQuery('').fromUrl(index_1.mocoQuery('table1')
            .select('COUNT')
            .where(['pk', '=', 'Value1'])
            .where(['AND', ['sk', 'begins_with', 'prefix']])
            .filter(['attr1', '<>', false])
            .filter(['AND', ['attr2', '=', null]])
            .filter(['AND', ['attr3Not42', '<>', 42]])
            .descending()
            .consistentRead(true)
            .toUrlString()).toUrlString(), () => index_1.mocoQuery('table1')
            .select('COUNT')
            .where(['pk', '=', 'Value1'])
            .where(['AND', ['sk', 'begins_with', 'prefix']])
            .filter(['attr1', '<>', false])
            .filter(['AND', ['attr2', '=', null]])
            .filter(['AND', ['attr3Not42', '<>', 42]])
            .descending()
            .consistentRead(true)
            .toUrlString()), test('Dyanmo Query from URL', () => {
            const url = index_1.mocoQuery('table1')
                .select('COUNT')
                .where(['pk', '=', 'Value1'])
                .where(['AND', ['sk', 'begins_with', 'prefix']])
                .filter(['attr1', '<>', false])
                .filter(['AND', ['attr2', '=', null]])
                .filter(['AND', ['attr3Not42', '<>', 42]])
                .consistentRead(true)
                .toURL();
            return index_1.mocoQuery('').fromUrl(url).toUrlString();
        }, () => index_1.mocoQuery('table1')
            .select('COUNT')
            .where(['pk', '=', 'Value1'])
            .where(['AND', ['sk', 'begins_with', 'prefix']])
            .filter(['attr1', '<>', false])
            .filter(['AND', ['attr2', '=', null]])
            .filter(['AND', ['attr3Not42', '<>', 42]])
            .consistentRead(true)
            .toUrlString()), test('Dyanmo Query from URLString', () => {
            const url = index_1.mocoQuery('table1')
                .select('COUNT')
                .where(['pk', '=', 'Value1'])
                .where(['AND', ['sk', 'begins_with', 'prefix']])
                .filter(['attr1', '<>', false])
                .filter(['AND', ['attr2', '=', null]])
                .filter(['AND', ['attr3Not42', '<>', 42]])
                .consistentRead(true)
                .toUrlString();
            return index_1.mocoQuery('').fromUrl(url).toUrlString();
        }, () => index_1.mocoQuery('table1')
            .select('COUNT')
            .where(['pk', '=', 'Value1'])
            .where('AND sk begins_with prefix')
            .filter(['attr1', '<>', false])
            .filter(['AND', ['attr2', '=', null]])
            .filter(['AND', ['attr3Not42', '<>', 42]])
            .consistentRead(true)
            .toUrlString()), test('Out of Order Filters should give equiv URL objects', () => index_1.mocoQuery('table1')
            .select('COUNT')
            .where(['pk', '=', 'Value1'])
            .where(['AND', ['sk', 'begins_with', 'prefix']])
            .filter(['attr1', '<>', false])
            .consistentRead(true)
            .filter(['AND', ['attr3Not42', '<>', 42]])
            .filter(['AND', ['attr2', '=', null]])
            .toURL(), () => index_1.mocoQuery('table1')
            .select('COUNT')
            .where(['pk', '=', 'Value1'])
            .where(['AND', ['sk', 'begins_with', 'prefix']])
            .filter(['attr1', '<>', false])
            .filter(['AND', ['attr2', '=', null]])
            .filter(['AND', ['attr3Not42', '<>', 42]])
            .consistentRead(true)
            .toURL()), test('Basic URL', index_1.mocoQuery('table1').toURL(), new url_1.URL('dynamo://table1#Select=All')), test('dummy', 1, 1));
    };
    (async () => {
        if (module.parent) {
            return allGroups;
        }
        else {
            await allGroups().catch(er => { console.error(er); process.exitCode = 0; });
        }
    })();
    exports.default = allGroups;
});
