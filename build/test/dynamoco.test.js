(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./index.test", "aws-sdk", "aws-sdk/clients/dynamodb", "util", "child_process", "../src"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const index_test_1 = require("./index.test");
    const aws_sdk_1 = require("aws-sdk");
    const dynamodb_1 = require("aws-sdk/clients/dynamodb");
    const util_1 = require("util");
    const child_process_1 = require("child_process");
    const src_1 = require("../src");
    const execP = util_1.promisify(child_process_1.exec);
    const toDynamo = dynamodb_1.Converter.marshall;
    const fromDynamo = dynamodb_1.Converter.unmarshall;
    const eq = (a, e) => a === e;
    const mockMsgId = () => `${Math.random() * 999999999}`;
    const runTheLocalService = async () => {
        const ret = await execP('docker run -p 8000:8000 amazon/dynamodb-local &>/dev/null &');
        return null;
    };
    const createTables = async (d, tableDefs) => {
        var _a;
        const tbls = await d.listTables().promise();
        if ((_a = tbls.TableNames) === null || _a === void 0 ? void 0 : _a.includes('Emails')) {
            await d.deleteTable({ TableName: 'Emails' }).promise();
        }
        await d.createTable({
            TableName: 'Emails',
            KeySchema: [
                { KeyType: 'HASH', AttributeName: 'User' },
                { KeyType: 'RANGE', AttributeName: 'Date' },
            ],
            AttributeDefinitions: [
                { AttributeType: 'S', AttributeName: 'User' },
                { AttributeType: 'N', AttributeName: 'Date' },
                { AttributeType: 'S', AttributeName: 'MsgId' },
            ],
            GlobalSecondaryIndexes: [
                {
                    IndexName: 'MsgId',
                    KeySchema: [{ KeyType: 'HASH', AttributeName: 'MsgId' }],
                    Projection: { ProjectionType: 'KEYS_ONLY' },
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 1,
                        WriteCapacityUnits: 1
                    }
                }
            ],
            ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
        }).promise();
        return null;
    };
    const fillTable = async (d) => {
        const batch = [
            toDynamo({
                'User': `myAlias`,
                'Date': 1589303429255,
                '_UserDate': `myAlias::1589303429255`,
                'MsgId': "566893153.4859517",
                'From': 'someGuy@example.com',
                'To': ['myAlias@filters.email'],
                'Reply-To': 'myAlias+23vqewsfvwesvds@filters.email',
                'Headers': {
                    "SPF": 'asdasdsadasd',
                    "DKIM": 'asdasdasd'
                },
                'Subject': 'Fake Data1',
                'Body': 'This is the body of the email',
                'BodyText': 'This is the body of the email',
                'BodyHTML': `<div>This is the body of the email</div>`
            }),
            toDynamo({
                'User': `myAlias`,
                'Date': 1589303449032,
                '_UserDate': `myAlias::1589303449032`,
                'MsgId': "684463664.036467",
                'From': 'otherPerson@domain.com',
                'To': ['myAlias@filters.email'],
                'Reply-To': 'myAlias+23vqewsfvwesvds@filters.email',
                'Headers': {
                    "SPF": 'asdasdsadasd',
                    "DKIM": 'asdasdasd'
                },
                'Subject': 'Fake Data2',
                'Body': 'This is second body you will see. Maybe its Heaven to see your second body.',
                'BodyText': 'This is second body you will see. Maybe its Heaven to see your second body.',
                'BodyHTML': `<div>This is second body you will see. Maybe its Heaven to see your second body.</div>`
            }),
            toDynamo({
                'User': `myAlias`,
                'Date': 1589303460428,
                '_UserDate': `myAlias::1589303460428`,
                'MsgId': "987090915.6604751",
                'From': 'somePerson@domain.com',
                'To': ['myAlias@filters.email'],
                'Reply-To': 'myAlias+23vqewsfvwesvds@filters.email',
                'Headers': {
                    "SPF": 'asdasdsadasd',
                    "DKIM": 'asdasdasd'
                },
                'Subject': 'Fake Data3',
                'Body': 'When in the third act what happens?',
                'BodyText': 'When in the third act what happens?',
                'BodyHTML': `<div>When in the third act what happens?</div>`
            }),
        ];
        const RequestItems = { Emails: batch.map(Item => ({ PutRequest: { Item } })) };
        await d.batchWriteItem({ RequestItems }).promise();
        return null;
    };
    const listTables = async (d) => { };
    const setupTableDataBeforeTest = async (d) => {
        await runTheLocalService();
        await createTables(d, {});
        await listTables(d);
        await fillTable(d);
    };
    const deleteTable = async (d) => {
        await d.deleteTable({ TableName: 'Emails' }).promise();
    };
    const allGroups = async () => {
        const [test, groupTest] = index_test_1.testMaker(__filename);
        const credentials = new aws_sdk_1.SharedIniFileCredentials({ profile: 'personal_default' });
        const d = new aws_sdk_1.DynamoDB({ credentials, region: 'us-west-2', endpoint: 'http://localhost:8000' });
        const groupContext = index_test_1.groupOfTestsNeedingSetup(d, test, setupTableDataBeforeTest, deleteTable);
        return groupTest('DynaMoco Mock TestsFor Email Table', groupContext({
            name: '1.Simple - GetItem Test',
            actual: async (d) => {
                const r = await src_1.dynamoco(d)
                    .getItem('Emails', { 'User': `myAlias`, 'Date': 1589303449032 });
                return r._Item['_UserDate'];
            },
            expected: async () => 'myAlias::1589303449032',
        }, {
            name: '2.Simple - GetItem Test',
            actual: async (d) => {
                const r = await src_1.dynamoco(d).getItem('Emails', { 'User': `myAlias`, 'Date': 1589303460428 });
                return r._Item['_UserDate'];
            },
            expected: async () => 'myAlias::1589303460428',
        }, {
            name: '3.Simple - Query Test Using Connection',
            actual: async (d) => {
                const queryParam = src_1.mocoQuery('Emails')
                    .select('COUNT')
                    .where(['User', '=', `myAlias`])
                    .where(['AND', ['Date', '<=', 1589303460428 + 1]])
                    .extract();
                const regular = await d.query(queryParam).promise();
                return regular.Count;
            },
            expected: async () => 3
        }, {
            name: '4.Simple - Query Test using Dynamoco',
            actual: async (d) => {
                const queryParam = src_1.mocoQuery('Emails')
                    .select('COUNT')
                    .where(['User', '=', `myAlias`])
                    .where(['AND', ['Date', '<=', 1589303460428 + 1]])
                    .extract();
                const ez = await src_1.dynamoco(d).query('Emails', queryParam);
                return ez.Count;
            },
            expected: async () => 3
        }, {
            name: '5.Simple - Query Test using Dynamoco',
            actual: async (d) => {
                const queryParam = src_1.mocoQuery('Emails')
                    .select('*')
                    .where(['User', '=', `myAlias`])
                    .where(['AND', ['Date', 'BETWEEN', [1589303440000, 1589303459000]]])
                    .extract();
                const ez = await src_1.dynamoco(d).query('Emails', queryParam);
                return ez.Count;
            },
            expected: async () => 1
        }, {
            name: '6. DBML',
            actual: async (d) => {
                const r = await src_1.dynamoco(d).describeTable('Emails');
                return r.DBML.replace(/[\s]+/gi, ' ');
            },
            expected: async () => `Table Emails {
    User text [pk]
    Date numeric [note: Used as Range Key]
    MsgId text
}`.replace(/[\s]+/gi, ' ')
        }));
    };
    exports.default = allGroups;
    (async () => {
        if (!module.parent) {
            const r = await allGroups();
        }
    })();
});
