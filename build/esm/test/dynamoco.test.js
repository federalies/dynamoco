import isCI from 'is-ci';
import { groupOfTestsNeedingSetup, testMaker } from './index.test';
import { DynamoDB, SharedIniFileCredentials } from 'aws-sdk';
import { Converter } from 'aws-sdk/clients/dynamodb';
import { promisify } from 'util';
import { exec } from 'child_process';
import { dynamoco, mocoQuery } from '../src';
const execP = promisify(exec);
const toDynamo = Converter.marshall;
const mockMsgId = () => `${Math.random() * 999999999}`;
const runTheLocalService = async () => {
    const pullCmd = 'docker pull amazon/dynamodb-local';
    const runCmd = 'docker run -p 8000:8000 amazon/dynamodb-local &>/dev/null &';
    console.log({ pullCmd });
    await execP(pullCmd);
    console.log({ runCmd });
    await execP(runCmd);
    return null;
};
const deleteTable = async (d) => {
    await d.deleteTable({ TableName: 'Emails' }).promise();
};
const createTables = async (d, tableDefs) => {
    const tbls = await d.listTables().promise();
    if (tbls.TableNames?.includes('Emails')) {
        await d.deleteTable({ TableName: 'Emails' }).promise();
    }
    await d.createTable({
        TableName: 'Emails',
        KeySchema: [
            { KeyType: 'HASH', AttributeName: 'User' },
            { KeyType: 'RANGE', AttributeName: 'Date' }
        ],
        AttributeDefinitions: [
            { AttributeType: 'S', AttributeName: 'User' },
            { AttributeType: 'N', AttributeName: 'Date' },
            { AttributeType: 'S', AttributeName: 'MsgId' }
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
            User: 'myAlias',
            Date: 1589303429255,
            _UserDate: 'myAlias::1589303429255',
            MsgId: '566893153.4859517',
            From: 'someGuy@example.com',
            To: ['myAlias@filters.email'],
            'Reply-To': 'myAlias+23vqewsfvwesvds@filters.email',
            Headers: {
                SPF: 'asdasdsadasd',
                DKIM: 'asdasdasd'
            },
            Subject: 'Fake Data1',
            Body: 'This is the body of the email',
            BodyText: 'This is the body of the email',
            BodyHTML: '<div>This is the body of the email</div>'
        }),
        toDynamo({
            User: 'myAlias',
            Date: 1589303449032,
            _UserDate: 'myAlias::1589303449032',
            MsgId: '684463664.036467',
            From: 'otherPerson@domain.com',
            To: ['myAlias@filters.email'],
            'Reply-To': 'myAlias+23vqewsfvwesvds@filters.email',
            Headers: {
                SPF: 'asdasdsadasd',
                DKIM: 'asdasdasd'
            },
            Subject: 'Fake Data2',
            Body: 'This is second body you will see. Maybe its Heaven to see your second body.',
            BodyText: 'This is second body you will see. Maybe its Heaven to see your second body.',
            BodyHTML: '<div>This is second body you will see. Maybe its Heaven to see your second body.</div>'
        }),
        toDynamo({
            User: 'myAlias',
            Date: 1589303460428,
            _UserDate: 'myAlias::1589303460428',
            MsgId: '987090915.6604751',
            From: 'somePerson@domain.com',
            To: ['myAlias@filters.email'],
            'Reply-To': 'myAlias+23vqewsfvwesvds@filters.email',
            Headers: {
                SPF: 'asdasdsadasd',
                DKIM: 'asdasdasd'
            },
            Subject: 'Fake Data3',
            Body: 'When in the third act what happens?',
            BodyText: 'When in the third act what happens?',
            BodyHTML: '<div>When in the third act what happens?</div>'
        })
    ];
    const RequestItems = { Emails: batch.map(Item => ({ PutRequest: { Item } })) };
    await d.batchWriteItem({ RequestItems }).promise();
    return null;
};
const listTables = async (d) => { };
const setupTableDataBeforeTest = async (d) => {
    !isCI && await runTheLocalService();
    await createTables(d, {}).catch(er => console.error('is Docker Daemon running?\n\n\n', er));
    await listTables(d);
    await fillTable(d);
};
const allGroups = async () => {
    const [test, groupTest] = testMaker(__filename);
    let d;
    if (isCI) {
        console.log('Testing in a CI Environment');
        d = new DynamoDB({
            region: 'us-west-2',
            accessKeyId: 'xxxx_DO_NOT_USE_REAL_VALUES_HERE_xxxx',
            secretAccessKey: 'xxxx_DO_NOT_USE_REAL_VALUES_HERE_xxxx',
            endpoint: 'http://localhost:8000'
        });
    }
    else {
        console.log('Testing in a regular (NON-CI Environment)');
        const credentials = new SharedIniFileCredentials({ profile: 'personal_default' });
        d = new DynamoDB({ credentials, region: 'us-west-2', endpoint: 'http://localhost:8000' });
    }
    const groupContext = groupOfTestsNeedingSetup(d, test, setupTableDataBeforeTest, deleteTable);
    return groupTest('DynaMoco Mock TestsFor Email Table', groupContext({
        name: '1.Simple - GetItem Test',
        actual: async (d) => {
            const r = await dynamoco(d)
                .getItem('Emails', { User: 'myAlias', Date: 1589303449032 });
            return r._Item._UserDate;
        },
        expected: async () => 'myAlias::1589303449032'
    }, {
        name: '2.Simple - GetItem Test',
        actual: async (d) => {
            const r = await dynamoco(d).getItem('Emails', { User: 'myAlias', Date: 1589303460428 });
            return r._Item._UserDate;
        },
        expected: async () => 'myAlias::1589303460428'
    }, {
        name: '3.Simple - Query Test Using Connection',
        actual: async (d) => {
            const queryParam = mocoQuery('Emails')
                .select('COUNT')
                .where(['User', '=', 'myAlias'])
                .where(['AND', ['Date', '<=', 1589303460428 + 1]])
                .extract();
            const regular = await d.query(queryParam).promise();
            return regular.Count;
        },
        expected: async () => 3
    }, {
        name: '4.Simple - Query Test using Dynamoco',
        actual: async (d) => {
            const queryParam = mocoQuery('Emails')
                .select('COUNT')
                .where(['User', '=', 'myAlias'])
                .where(['AND', ['Date', '<=', 1589303460428 + 1]])
                .extract();
            const ez = await dynamoco(d).query('Emails', queryParam);
            return ez.Count;
        },
        expected: async () => 3
    }, {
        name: '5.Simple - Query Test using Dynamoco',
        actual: async (d) => {
            const queryParam = mocoQuery('Emails')
                .select('*')
                .where(['User', '=', 'myAlias'])
                .where(['AND', ['Date', 'BETWEEN', [1589303440000, 1589303459000]]])
                .extract();
            const ez = await dynamoco(d).query('Emails', queryParam);
            return ez.Count;
        },
        expected: async () => 1
    }, {
        name: '6. DBML',
        actual: async (d) => {
            const r = await dynamoco(d).describeTable('Emails');
            return r.DBML.replace(/[\s]+/gi, ' ');
        },
        expected: async () => `Table Emails {
    User text [pk]
    Date numeric [note: Used as Range Key]
    MsgId text
}`.replace(/[\s]+/gi, ' ')
    }, {
        name: '7.Put Item',
        actual: async (d) => {
            const putItemData = {
                User: 'myAlias',
                Date: 1589303460500,
                _UserDate: 'myAlias::1589303460428',
                MsgId: mockMsgId(),
                From: 'somePerson@domain.com',
                To: ['myAlias@filters.email'],
                'Reply-To': 'myAlias+23vqewsfvwesvds@filters.email',
                Subject: 'Fake Data4',
                Body: 'Adding This Dynamically',
                BodyText: 'Adding This Dynamically',
                BodyHTML: '<div>Adding This Dynamically</div>'
            };
            const ez = await dynamoco(d)
                .putItem('Emails', putItemData, {
                ReturnConsumedCapacity: 'TOTAL',
                ReturnItemCollectionMetrics: 'SIZE'
            });
            return ez._Attributes;
        },
        expected: async () => ({})
    }, {
        name: '8. Put Batch',
        actual: async (d) => {
            const batch = [{
                    User: 'myAlias',
                    Date: 1589303460600,
                    _UserDate: 'myAlias::1589303460428',
                    MsgId: mockMsgId(),
                    From: 'somePerson@domain.com',
                    To: ['myAlias@filters.email'],
                    'Reply-To': 'myAlias+23vqewsfvwesvds@filters.email',
                    Subject: 'Fake Data4',
                    Body: 'Adding This Dynamically',
                    BodyText: 'Adding This Dynamically',
                    BodyHTML: '<div>Adding This Dynamically</div>'
                },
                {
                    User: 'myAlias',
                    Date: 1589303460700,
                    _UserDate: 'myAlias::1589303460428',
                    MsgId: mockMsgId(),
                    From: 'somePerson@domain.com',
                    To: ['myAlias@filters.email'],
                    'Reply-To': 'myAlias+23vqewsfvwesvds@filters.email',
                    Subject: 'Fake Data4',
                    Body: 'Adding This Dynamically',
                    BodyText: 'Adding This Dynamically',
                    BodyHTML: '<div>Adding This Dynamically</div>'
                }];
            const ez = await dynamoco(d)
                .putBatch({ Emails: batch });
            return ez;
        },
        expected: async () => ({ UnprocessedItems: {} })
    }, {
        name: '9. Get Batch',
        actual: async () => {
            const ez = await dynamoco(d).getBatch({
                Emails: [
                    {
                        User: 'myAlias',
                        Date: 1589303429255
                    },
                    {
                        User: 'myAlias',
                        Date: 1589303449032
                    }
                ]
            });
            return ez._Responses?.Emails.length;
        },
        expected: async () => 2
    }, {
        name: '10. Delete Batch',
        actual: async (d) => dynamoco(d)
            .deleteBatch({
            Emails: [
                { User: 'myAlias', Date: 1589303460500 }
            ]
        }),
        expected: async () => ({ UnprocessedItems: {} })
    }, {
        name: '11. Scan',
        actual: async (d) => {
            const r = await dynamoco(d)
                .scan('Emails', [
                'Date', 'BETWEEN', [1589303429254, 1589303460429]
            ], { ReturnConsumedCapacity: 'TOTAL' });
            return r._Items.length;
        },
        expected: async () => 3
    }, {
        name: '12. Paginate',
        actual: async (d) => {
            const pager = dynamoco(d).paginate(mocoQuery('Emails')
                .select('*')
                .filter(['Date', '=', 1589303429255]).extract());
            let collect = [];
            for await (const pagedData of pager) {
                const _Items = pagedData._Items || [];
                collect = [..._Items];
            }
            return collect.length;
        },
        expected: async () => 1
    }, {
        name: '13. Update Table',
        actual: async (d) => {
            const r = await dynamoco(d).updateTable('Emails', true);
            return r.TableDescription?.BillingModeSummary?.BillingMode;
        },
        expected: async () => 'PAY_PER_REQUEST'
    }));
};
export default allGroups;
(async () => {
    if (!module.parent) {
        const r = await allGroups();
    }
})();
