/* global BigInt */
import { deepEqual } from 'assert'
import chalk from 'chalk'
import { diff } from 'deep-diff'
import globby from 'globby'
import { join } from 'path'
// import pSeries from 'p-series'

// one to many `-<:`
// many to one `:>-`
//
// File -<: Groups -<: Tests
//

const { isArray } = Array
const isPrimitive = (value:any) => (typeof value !== 'object' && typeof value !== 'function') || value === null
export const deepEq = (a:unknown, e:unknown) => {
  try {
    deepEqual(a, e, '')
  } catch (e) {
    return false
  }
  return true
}
export const eq = (a:unknown, e:unknown) => a === e
export const isErrorThrown = (f:Function):boolean => {
  try {
    f()
  } catch (er) {
    return true
  }
  return false
}
export const findErrorThrown = (f:Function): Error | null => {
  try {
    f()
  } catch (er) {
    return er
  }
  return null
}
export const isPrimitiveInstance = (input:any) => {
  return isPrimitive(input) ||
        input instanceof String ||
        input instanceof Number ||
        input instanceof Boolean ||
        input instanceof BigInt
}

export const isObject = (input:any) => {
  if (isPrimitive(input)) {
    return false
  } else if (isArray(input)) {
    return false
  } else {
    return true
  }
}

export const pruneUndefined = (input:any) => {
  if (isObject(input)) {
    return Object.entries(input).reduce((acc, [key, value]) => {
      const skipKey = acc
      const withKey = {
        ...acc,
        [key]: pruneUndefined(value)
      } as {[key:string]:unknown}
      return value ? withKey : skipKey
    }, {} as {[key:string]:unknown})
  } else {
    return input
  }
}
// export const jsonify = (input:any) => JSON.parse(JSON.stringify(input))

export const isGroupReturn = (i: IGroupReturn | ITestReturn | IGroupReturn[] | ITestReturn[]):i is IGroupReturn => {
  return isArray(i)
    ? false
    : 'setName' in i &&
        'fileName' in i &&
        'groupPassed' in i &&
        'numPass' in i &&
        'numFail' in i &&
        'testDetails' in i
}
export const isGroupReturnArr = (i: IGroupReturn | ITestReturn | IGroupReturn[] | ITestReturn[]):i is IGroupReturn[] => {
  return Array.isArray(i)
    ? i.length === 0
      ? true
      : 'setName' in i[0] &&
            'fileName' in i[0] &&
            'groupPassed' in i[0] &&
            'numPass' in i[0] &&
            'numFail' in i[0] &&
            'testDetails' in i[0]
    : false
}

// TestReturn[] -> GrpReturn[]
const groupUpTests = (group:IGroupReturn | {setName: string}, ...tests: ITestReturn[]):IGroupReturn => {
  const copy = { fileName: '', groupPassed: true, numPass: 0, numFail: 0, testDetails: [] as ITestReturn[], ...group }

  for (const t of tests) {
    copy.groupPassed = copy.groupPassed && t.passed
    copy.fileName = t.fileName
    copy.numPass = t.passed ? copy.numPass + 1 : copy.numPass
    copy.numFail = t.passed ? copy.numFail : copy.numFail + 1
    copy.testDetails = [...copy.testDetails, t]
  }
  return copy
}

export const groupOfTestsNeedingSetup = <T>(
  ctx:T,
  testFn: ITestFn,
  before:((ctx:T, ...others:unknown[])=>Promise<void>),
  after:((ctx:T, ...others:unknown[])=>Promise<void>)) =>

    async (...testsConfigs: ITestConfig<T>[]) => {
      await before(ctx)
      const testResults = await Promise.all(
        testsConfigs.map(async t => {
          try {
            const actual = typeof t.actual === 'function' ? await t.actual(ctx) : t.actual
            const expected = typeof t.expected === 'function' ? await t.expected(ctx) : t.expected
            return testFn(t.name, actual, expected)
          } catch (err) {
            console.error(t.name)
            console.error(err)
            return testFn(t.name, err, undefined)
          }
        })
      )
      // console.log(JSON.stringify(testResults,null,2))
      await after(ctx)
      return testResults as ITestReturn[]
    }

// main lib
export const testMaker = (fileName:string, i = 1) => {
  console.log(chalk.bgWhite.black(`STARTING:  ${fileName} `))

  return [

        // test = () => {}
        (async (name:string, actual:unknown, expected:unknown, comparFn:IComparitorFn = deepEq) => {
          const [act, exp] = await Promise.all([actual, expected])
          const a = pruneUndefined(act)
          const e = pruneUndefined(exp)

          let passed:boolean
          if (comparFn(a, e)) {
            console.log(chalk.green(`✅: ${i.toString().padStart(4, '0')}: ${fileName} - ${name}`))
            passed = true
          } else {
            console.error(chalk.red(`❌: ${i} - ${name}`))
            console.error(chalk.white(`Expected: ${JSON.stringify(e, null, 2)}`))
            console.error(chalk.yellow(`Actual: ${JSON.stringify(a, null, 2)}`))
            console.error(chalk.white(`look at : ${JSON.stringify(diff(a, e), null, 2)}`))
            // incase you are setting up some parallel stuff and kicking this off as an exec/child_process
            // if any fail then they all fail
            process.exitCode = 1 // err out the process
            passed = false
          }
          i++
          return {
            testName: name,
            fileName,
            passed,
            actual: a,
            expected: e,
            lookat: diff(a, e)
          }
        }) as ITestFn,

        // GroupingExample -
        // ƒ 'Name1' ([  {Test} {PreGroupedTestsB} {Test} {Test} {TestArr.1} {PreGroupedTestsA} ]) =>
        // [ {PreGroupedTestsA} {PreGroupedTestsB}, {Test, Test, Test, TestArr.1}]
        //
        // groupTest = () => {}
        (async (setName:string, ...i: PromiseLike< ITestReturn | ITestReturn [] | IGroupReturn | IGroupReturn[]>[]): Promise<IGroupReturn[]> => {
          // const _i = await Promise.all(i)
          // console.log({setName}, JSON.stringify({_i},null, 2))
          const pregroupedAndFreshGrp = (await Promise.all(i)).reduce(
            async (prior, testCollection) => {
              const [acc, grp] = await prior
              if (isArray(testCollection)) {
                // console.log({testCollection})
                if (isGroupReturnArr(testCollection)) {
                  // Pre-Grpd[] -> GrpReturn[]
                  // console.log(`>> Pre-Grpd[] -> GrpReturn[]`)
                  const pregrouped = [...acc, ...testCollection] as IGroupReturn[]
                  return [pregrouped, grp] as [IGroupReturn[], {setName: string} | IGroupReturn]
                } else {
                  // TestReturn[] -> GrpReturn[]
                  // console.log(`>> TestReturn[] -> GrpReturn[]`)
                  const testIntoGrp = groupUpTests(grp, ...testCollection) as IGroupReturn
                  // console.log({testCollection, testIntoGrp})
                  return [acc, testIntoGrp] as [ IGroupReturn[], {setName: string} | IGroupReturn]
                }
              } else {
                if (isGroupReturn(testCollection)) {
                  // single GrpReturn -> GrpReturn[]
                  // console.log(`>> single GrpReturn -> GrpReturn[]`)
                  const preGroupedSet = [...acc, testCollection] as IGroupReturn[]
                  return [preGroupedSet, grp] as [ IGroupReturn[], {setName: string} | IGroupReturn]
                } else {
                  // single test -> GrpReturn[]
                  // console.log(`>> single test -> GrpReturn[]`)
                  const testIntoGrp = groupUpTests(grp, testCollection) as IGroupReturn
                  return [acc, testIntoGrp] as [ IGroupReturn[], IGroupReturn ]
                }
              }
            }, Promise.all([[], { setName }]) as Promise<[ IGroupReturn[], {setName: string} | IGroupReturn ]>
          )

          const [list, grp] = await pregroupedAndFreshGrp

          // console.log(
          //     JSON.stringify({list}, null, 2),
          //     JSON.stringify({grp}, null, 2)
          // )
          const ret = [...list, grp as IGroupReturn] as IGroupReturn[]
          // console.log(list, grp)
          // console.log(ret)
          return ret
        }) as IGroupTestFn
  ] as [ITestFn, IGroupTestFn]
}

const localTests = async () => {
  const [test, groupTest] = testMaker(__filename) as [ITestFn, IGroupTestFn]
  return [
    groupTest('allLocalTests',
      test('primitive.1', isPrimitive(1), true, eq),
      test('primitive.2', isPrimitive(true), true, eq),
      test('primitive.3', isPrimitive(null), true, eq),
      test('primitive.4', isPrimitive(undefined), true, eq),
      test('primitive.5', isPrimitive('string'), true, eq),
      test('primitive.6', isPrimitive([1, true, 'tree']), false, eq),
      test('primitive.7', isPrimitive({ a: 1 }), false, eq),
      test('primitive.8', isPrimitive({ a: 1, b: undefined }), false, eq),
      test('primitive.9', isPrimitive(BigInt(12345678901234567890)), true),
      test('isObject.1', isObject({ a: 1 }), true, eq),
      test('isObject.2', isObject({}), true, eq),
      test('isObject.3', isObject([1, true, 'tree']), false, eq),
      test('isObject.4', isObject(1), false, eq),
      test('isObject.5', isObject(null), false, eq),
      test('isObject.6', isObject(undefined), false, eq),
      test('isObject.7', isObject('null'), false, eq),
      test('isObject.8', isObject(BigInt(12345678901234567890)), false, eq),
      test('prune undefined.1', pruneUndefined({ a: 1, b: 2, c: undefined }), { a: 1, b: 2 }),
      test('prune undefined.2 - recursive', pruneUndefined({ a: 1, b: 2, c: { a: undefined } }), { a: 1, b: 2, c: {} }),
      test('prune undefined.3 - really recursive', pruneUndefined({ a: 1, b: 2, c: { a: { f: 6, e: undefined } } }), { a: 1, b: 2, c: { a: { f: 6 } } })
    )
  ]
}

/**
 * @description Discover Tests
 * @param globs
 */
const findTestPaths = async (...globs:string[]) => {
  if (globs.length > 0) {
    return globby(globs)
  } else {
    return globby(['./test/**/*test.ts', '!./test/index.test.ts'])
  }
}

/**
 * @description Import external code into this mod for execution
 * @param pathForTests
 */
const importTests = async (pathForTests: string[] | Promise<string[]>) => {
  return Promise.all(
    (await pathForTests)
      .map(p => {
        const fullPath = join(__dirname, '../', p)
        // console.log({p, fullPath})
        return import(fullPath).then(importedTest => importedTest.default)
      })
  ) as Promise<Array<(()=>ITestReturn | ITestReturn[] | IGroupReturn[])>>
}

/**
 * @description Each module might result in a testReturn, an array of testReturns,
 *       a groupTest, groupTestArray, or some combo of all of that.
 *       and for sake of managing complexity down stream,
 *       we combine all that to just 1 flattened GroupReturn Array
 * @param i
 */
// eslint-disable-next-line no-unused-vars
const flattenToGrpReturns = (...i: (ITestReturn | ITestReturn[] | IGroupReturn[])[]):IGroupReturn[] => {
  return i.reduce((acc:IGroupReturn[], t) => {
    if (isGroupReturnArr(t)) {
      return [...acc, ...t]
    } else if (isArray(t)) {
      return [...acc, groupUpTests({ setName: 'Group From TestArr' }, ...t)]
    } else {
      return [...acc, groupUpTests({ setName: '1 Test GroupArr' }, t)]
    }
  }, [] as IGroupReturn[])
}

// eslint-disable-next-line no-unused-vars
const print = (...i: IGroupReturn[]) => {
  console.log(JSON.stringify(i, null, 2))
  return i
}

// actual test runner
;(async () => {
  if (!module.parent) {
    const testsPaths = await findTestPaths()
    console.log({ testsPaths })

    // eslint-disable-next-line no-unused-vars
    const tests = await importTests(testsPaths)

    // eslint-disable-next-line no-unused-vars
    const fileResultsArr = await Promise.all(tests.map(t => t()))

    // eslint-disable-next-line no-unused-vars
    // const results = flattenToGrpReturns(...fileResultsArr)

    // console.log(JSON.stringify(fileResultsArr, null, 2))
    // print(...results)
    // console.log(JSON.stringify(arrTestResults,null, 2))
  }
})()

export default localTests

// #region types

export type IComparitorFn = (a:unknown, e:unknown)=>boolean
export interface ITestReturn extends ITestDetails{
    testName:string
    fileName:string
}
export interface ITestDetails{
    passed:boolean
    actual: unknown
    expected: unknown
    lookat: unknown
}
export interface IGroupReturn{
    setName:string
    fileName:string
    groupPassed: boolean
    numPass: number
    numFail: number
    testDetails: ITestDetails[]
}
export type ITestFn = (name:string, actual:unknown, expected:unknown, comparFn?:IComparitorFn) => Promise<ITestReturn>
export type IGroupTestFn = (name:string, ...i: PromiseLike<ITestReturn | IGroupReturn | ITestReturn [] | IGroupReturn[]>[]) => Promise<IGroupReturn[]>

export interface ITestConfig<T> {
    name:string
    actual: (ctx:T)=>unknown | unknown
    expected: (ctx:T)=>unknown | unknown
    compareFn?: IComparitorFn

}

// #endregion types
