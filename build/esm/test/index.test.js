import { deepEqual } from 'assert';
import chalk from 'chalk';
import { diff } from 'deep-diff';
import globby from 'globby';
import { join } from 'path';
const { isArray } = Array;
const isPrimitive = (value) => (typeof value !== 'object' && typeof value !== 'function') || value === null;
export const deepEq = (a, e) => {
    try {
        deepEqual(a, e, '');
    }
    catch (e) {
        return false;
    }
    return true;
};
export const eq = (a, e) => a === e;
export const isErrorThrown = (f) => {
    try {
        f();
    }
    catch (er) {
        return true;
    }
    return false;
};
export const findErrorThrown = (f) => {
    try {
        f();
    }
    catch (er) {
        return er;
    }
    return null;
};
export const isPrimitiveInstance = (input) => {
    return isPrimitive(input) ||
        input instanceof String ||
        input instanceof Number ||
        input instanceof Boolean ||
        input instanceof BigInt;
};
export const isObject = (input) => {
    if (isPrimitive(input)) {
        return false;
    }
    else if (isArray(input)) {
        return false;
    }
    else {
        return true;
    }
};
export const pruneUndefined = (input) => {
    if (isObject(input)) {
        return Object.entries(input).reduce((acc, [key, value]) => {
            const skipKey = acc;
            const withKey = {
                ...acc,
                [key]: pruneUndefined(value)
            };
            return value ? withKey : skipKey;
        }, {});
    }
    else {
        return input;
    }
};
export const isGroupReturn = (i) => {
    return isArray(i)
        ? false
        : 'setName' in i &&
            'fileName' in i &&
            'groupPassed' in i &&
            'numPass' in i &&
            'numFail' in i &&
            'testDetails' in i;
};
export const isGroupReturnArr = (i) => {
    return Array.isArray(i)
        ? i.length === 0
            ? true
            : 'setName' in i[0] &&
                'fileName' in i[0] &&
                'groupPassed' in i[0] &&
                'numPass' in i[0] &&
                'numFail' in i[0] &&
                'testDetails' in i[0]
        : false;
};
const groupUpTests = (group, ...tests) => {
    const copy = { fileName: '', groupPassed: true, numPass: 0, numFail: 0, testDetails: [], ...group };
    for (const t of tests) {
        copy.groupPassed = copy.groupPassed && t.passed;
        copy.fileName = t.fileName;
        copy.numPass = t.passed ? copy.numPass + 1 : copy.numPass;
        copy.numFail = t.passed ? copy.numFail : copy.numFail + 1;
        copy.testDetails = [...copy.testDetails, t];
    }
    return copy;
};
export const groupOfTestsNeedingSetup = (ctx, testFn, before, after) => async (...testsConfigs) => {
    await before(ctx);
    const testResults = await Promise.all(testsConfigs.map(async (t) => {
        try {
            const actual = typeof t.actual === 'function' ? await t.actual(ctx) : t.actual;
            const expected = typeof t.expected === 'function' ? await t.expected(ctx) : t.expected;
            return testFn(t.name, actual, expected);
        }
        catch (err) {
            console.error(t.name);
            console.error(err);
            return testFn(t.name, err, undefined);
        }
    }));
    await after(ctx);
    return testResults;
};
export const testMaker = (fileName, i = 1) => {
    console.log(chalk.bgWhite.black(`STARTING:  ${fileName} `));
    return [
        (async (name, actual, expected, comparFn = deepEq) => {
            const [act, exp] = await Promise.all([actual, expected]);
            const a = pruneUndefined(act);
            const e = pruneUndefined(exp);
            let passed;
            if (comparFn(a, e)) {
                console.log(chalk.green(`✅: ${i.toString().padStart(4, '0')}: ${fileName} - ${name}`));
                passed = true;
            }
            else {
                console.error(chalk.red(`❌: ${i} - ${name}`));
                console.error(chalk.white(`Expected: ${JSON.stringify(e, null, 2)}`));
                console.error(chalk.yellow(`Actual: ${JSON.stringify(a, null, 2)}`));
                console.error(chalk.white(`look at : ${JSON.stringify(diff(a, e), null, 2)}`));
                process.exitCode = 1;
                passed = false;
            }
            i++;
            return {
                testName: name,
                fileName,
                passed,
                actual: a,
                expected: e,
                lookat: diff(a, e)
            };
        }),
        (async (setName, ...i) => {
            const pregroupedAndFreshGrp = (await Promise.all(i)).reduce(async (prior, testCollection) => {
                const [acc, grp] = await prior;
                if (isArray(testCollection)) {
                    if (isGroupReturnArr(testCollection)) {
                        const pregrouped = [...acc, ...testCollection];
                        return [pregrouped, grp];
                    }
                    else {
                        const testIntoGrp = groupUpTests(grp, ...testCollection);
                        return [acc, testIntoGrp];
                    }
                }
                else {
                    if (isGroupReturn(testCollection)) {
                        const preGroupedSet = [...acc, testCollection];
                        return [preGroupedSet, grp];
                    }
                    else {
                        const testIntoGrp = groupUpTests(grp, testCollection);
                        return [acc, testIntoGrp];
                    }
                }
            }, Promise.all([[], { setName }]));
            const [list, grp] = await pregroupedAndFreshGrp;
            const ret = [...list, grp];
            return ret;
        })
    ];
};
const localTests = async () => {
    const [test, groupTest] = testMaker(__filename);
    return [
        groupTest('allLocalTests', test('primitive.1', isPrimitive(1), true, eq), test('primitive.2', isPrimitive(true), true, eq), test('primitive.3', isPrimitive(null), true, eq), test('primitive.4', isPrimitive(undefined), true, eq), test('primitive.5', isPrimitive('string'), true, eq), test('primitive.6', isPrimitive([1, true, 'tree']), false, eq), test('primitive.7', isPrimitive({ a: 1 }), false, eq), test('primitive.8', isPrimitive({ a: 1, b: undefined }), false, eq), test('primitive.9', isPrimitive(BigInt(12345678901234567890)), true), test('isObject.1', isObject({ a: 1 }), true, eq), test('isObject.2', isObject({}), true, eq), test('isObject.3', isObject([1, true, 'tree']), false, eq), test('isObject.4', isObject(1), false, eq), test('isObject.5', isObject(null), false, eq), test('isObject.6', isObject(undefined), false, eq), test('isObject.7', isObject('null'), false, eq), test('isObject.8', isObject(BigInt(12345678901234567890)), false, eq), test('prune undefined.1', pruneUndefined({ a: 1, b: 2, c: undefined }), { a: 1, b: 2 }), test('prune undefined.2 - recursive', pruneUndefined({ a: 1, b: 2, c: { a: undefined } }), { a: 1, b: 2, c: {} }), test('prune undefined.3 - really recursive', pruneUndefined({ a: 1, b: 2, c: { a: { f: 6, e: undefined } } }), { a: 1, b: 2, c: { a: { f: 6 } } }))
    ];
};
const findTestPaths = async (...globs) => {
    if (globs.length > 0) {
        return globby(globs);
    }
    else {
        return globby(['./test/**/*test.ts', '!./test/index.test.ts']);
    }
};
const importTests = async (pathForTests) => {
    return Promise.all((await pathForTests)
        .map(p => {
        const fullPath = join(__dirname, '../', p);
        return import(fullPath).then(importedTest => importedTest.default);
    }));
};
const flattenToGrpReturns = (...i) => {
    return i.reduce((acc, t) => {
        if (isGroupReturnArr(t)) {
            return [...acc, ...t];
        }
        else if (isArray(t)) {
            return [...acc, groupUpTests({ setName: 'Group From TestArr' }, ...t)];
        }
        else {
            return [...acc, groupUpTests({ setName: '1 Test GroupArr' }, t)];
        }
    }, []);
};
const print = (...i) => {
    console.log(JSON.stringify(i, null, 2));
    return i;
};
(async () => {
    if (!module.parent) {
        const testsPaths = await findTestPaths();
        console.log({ testsPaths });
        const tests = await importTests(testsPaths);
        const fileResultsArr = await Promise.all(tests.map(t => t()));
    }
})();
export default localTests;
