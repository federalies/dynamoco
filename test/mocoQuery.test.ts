// import {mocoQuery} from 'dynamoco'
import {mocoQuery} from '../src/index'
import type {QueryInput} from 'aws-sdk/clients/dynamodb'
import {testMaker} from './index.test'

// #endregion inline-Micro-Testing-Framework

// main
const allGroups = async () => {   
    const [test, groupTest] = testMaker(__filename)
    return groupTest('MocoQuery Query Builder',
        
        groupTest('Easy Tests', 
            test('Check Defaults',
                mocoQuery('table1').extract(),
                {
                    TableName:'table1', 
                    Select: 'ALL_ATTRIBUTES',
                    ReturnConsumedCapacity: 'TOTAL'
                } as QueryInput
            ),
            test('Using Limit',
                mocoQuery('table1').limit(100).extract(), 
                {
                    TableName:'table1', 
                    Select: 'ALL_ATTRIBUTES',
                    ReturnConsumedCapacity: 'TOTAL',
                    Limit:100} as QueryInput
            ),
        ),
        groupTest('Level2 Tests', 
            test('exmaple - asc.consistent.filter(gt)',
                mocoQuery('table1')
                .ascending()
                .consistentRead(true)
                .filter(['Attribute1','>',3]).extract(),
                {  
                    TableName:'table1', 
                    Select: "ALL_ATTRIBUTES",
                    ReturnConsumedCapacity: 'TOTAL',
                    ScanIndexForward:true,
                    ConsistentRead:true,
                    FilterExpression:'Attribute1 > :att',
                    ExpressionAttributeValues:{
                        ':att':{'N':'3'}
                    }
                } as QueryInput
            ),
            test('exmaple - select.where(BETWEEN)',
                mocoQuery('table1')
                .select('COUNT')
                .where(['Attribute1','BETWEEN',['A','D']])
                .extract(),
                {  
                    TableName:'table1', 
                    Select: 'COUNT',
                    ReturnConsumedCapacity: 'TOTAL',
                    KeyConditionExpression:'Attribute1 BETWEEN :attLo AND :attHi',
                    ExpressionAttributeValues:{
                        ':attLo':{'S':'A'},
                        ':attHi':{'S':'D'}
                    }
                } as QueryInput
            ),
            test('Using Limit',
                mocoQuery('table1')
                .select('*')
                .startKey({KeyedAttr:{'S':'someString'}})
                .filter(['Attribute2','begins_with','prefix'])
                .limit(1000)
                .extract(),
                {
                    TableName:'table1', 
                    ReturnConsumedCapacity:'TOTAL',
                    Select:'ALL_ATTRIBUTES',
                    Limit:1000,
                    ExclusiveStartKey:{KeyedAttr:{'S':'someString'}},
                    FilterExpression: `begins_with(Attribute2,:att)`,
                    ExpressionAttributeValues:{
                        ':att':{S:'prefix'}
                    },
                } as QueryInput
            )            
        ),
        groupTest('Level3 Tests', 
            test('exmaple - adding stacked Filters',
                mocoQuery('table1')
                .filter(['Attribute1','>',6])
                .filter(['AND',['Date','<', 2025]])
                .extract(),
                {
                    TableName:'table1', 
                    ReturnConsumedCapacity: 'TOTAL',
                    Select: "ALL_ATTRIBUTES",
                    FilterExpression:'Attribute1 > :att AND #dat < :dat',
                    ExpressionAttributeValues:{
                        ':att':{'N':'6'},
                        ':dat':{'N':'2025'}
                    },
                    ExpressionAttributeNames:{
                        '#dat':'Date'
                    }
                } as QueryInput
            ),
            test('exmaple - adding stacked Where Clauses',
                mocoQuery('table1')
                .where(['Attribute1','>',7])
                .where(['AND',['Date','<', 2025]])
                .extract(),
                {
                    TableName:'table1', 
                    ReturnConsumedCapacity: 'TOTAL',
                    Select: "ALL_ATTRIBUTES",
                    KeyConditionExpression:'Attribute1 > :att AND #dat < :dat',
                    ExpressionAttributeValues:{
                        ':att':{'N':'7'},
                        ':dat':{'N':'2025'}
                    },
                    ExpressionAttributeNames:{
                        '#dat':'Date'
                    }
                } as QueryInput
            ),
        ),

    )
}

;(async()=>{
    if(!module.parent){
        const r = await allGroups()
        // console.log(JSON.stringify({r},null, 2))
    }
})()




export default allGroups