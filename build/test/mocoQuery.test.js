(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../src/index", "./index.test"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const index_1 = require("../src/index");
    const index_test_1 = require("./index.test");
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
            .filter(['Attribute1', '>', 3]).extract(), {
            TableName: 'table1',
            Select: "ALL_ATTRIBUTES",
            ReturnConsumedCapacity: 'TOTAL',
            ScanIndexForward: true,
            ConsistentRead: true,
            FilterExpression: 'Attribute1 > :att',
            ExpressionAttributeValues: {
                ':att': { 'N': '3' }
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
                ':attLo': { 'S': 'A' },
                ':attHi': { 'S': 'D' }
            }
        }), test('Using Limit', index_1.mocoQuery('table1')
            .select('*')
            .startKey({ KeyedAttr: { 'S': 'someString' } })
            .filter(['Attribute2', 'begins_with', 'prefix'])
            .limit(1000)
            .extract(), {
            TableName: 'table1',
            ReturnConsumedCapacity: 'TOTAL',
            Select: 'ALL_ATTRIBUTES',
            Limit: 1000,
            ExclusiveStartKey: { KeyedAttr: { 'S': 'someString' } },
            FilterExpression: `begins_with(Attribute2,:att)`,
            ExpressionAttributeValues: {
                ':att': { S: 'prefix' }
            },
        })), groupTest('Level3 Tests', test('exmaple - adding stacked Filters', index_1.mocoQuery('table1')
            .filter(['Attribute1', '>', 6])
            .filter(['AND', ['Date', '<', 2025]])
            .extract(), {
            TableName: 'table1',
            ReturnConsumedCapacity: 'TOTAL',
            Select: "ALL_ATTRIBUTES",
            FilterExpression: 'Attribute1 > :att AND #dat < :dat',
            ExpressionAttributeValues: {
                ':att': { 'N': '6' },
                ':dat': { 'N': '2025' }
            },
            ExpressionAttributeNames: {
                '#dat': 'Date'
            }
        }), test('exmaple - adding stacked Where Clauses', index_1.mocoQuery('table1')
            .where(['Attribute1', '>', 7])
            .where(['AND', ['Date', '<', 2025]])
            .extract(), {
            TableName: 'table1',
            ReturnConsumedCapacity: 'TOTAL',
            Select: "ALL_ATTRIBUTES",
            KeyConditionExpression: 'Attribute1 > :att AND #dat < :dat',
            ExpressionAttributeValues: {
                ':att': { 'N': '7' },
                ':dat': { 'N': '2025' }
            },
            ExpressionAttributeNames: {
                '#dat': 'Date'
            }
        })));
    };
    (async () => {
        if (!module.parent) {
            const r = await allGroups();
        }
    })();
    exports.default = allGroups;
});
