var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "assert", "chalk", "deep-diff", "globby", "path"], factory);
    }
})(function (require, exports) {
    "use strict";
    var __syncRequire = typeof module === "object" && typeof module.exports === "object";
    Object.defineProperty(exports, "__esModule", { value: true });
    const assert_1 = require("assert");
    const chalk_1 = __importDefault(require("chalk"));
    const deep_diff_1 = require("deep-diff");
    const globby_1 = __importDefault(require("globby"));
    const path_1 = require("path");
    const { isArray } = Array;
    const isPrimitive = (value) => (typeof value !== 'object' && typeof value !== 'function') || value === null;
    exports.deepEq = (a, e) => {
        try {
            assert_1.deepEqual(a, e, '');
        }
        catch (e) {
            return false;
        }
        return true;
    };
    exports.eq = (a, e) => a === e;
    exports.isErrorThrown = (f) => {
        try {
            f();
        }
        catch (er) {
            return true;
        }
        return false;
    };
    exports.findErrorThrown = (f) => {
        try {
            f();
        }
        catch (er) {
            return er;
        }
        return null;
    };
    exports.isPrimitiveInstance = (input) => {
        return isPrimitive(input) ||
            input instanceof String ||
            input instanceof Number ||
            input instanceof Boolean ||
            input instanceof BigInt;
    };
    exports.isObject = (input) => {
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
    exports.pruneUndefined = (input) => {
        if (exports.isObject(input)) {
            return Object.entries(input).reduce((acc, [key, value]) => {
                const skipKey = acc;
                const withKey = Object.assign(Object.assign({}, acc), { [key]: exports.pruneUndefined(value) });
                return value ? withKey : skipKey;
            }, {});
        }
        else {
            return input;
        }
    };
    exports.isGroupReturn = (i) => {
        return isArray(i)
            ? false
            : 'setName' in i &&
                'fileName' in i &&
                'groupPassed' in i &&
                'numPass' in i &&
                'numFail' in i &&
                'testDetails' in i;
    };
    exports.isGroupReturnArr = (i) => {
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
        const copy = Object.assign({ fileName: '', groupPassed: true, numPass: 0, numFail: 0, testDetails: [] }, group);
        for (const t of tests) {
            copy.groupPassed = copy.groupPassed && t.passed;
            copy.fileName = t.fileName;
            copy.numPass = t.passed ? copy.numPass + 1 : copy.numPass;
            copy.numFail = t.passed ? copy.numFail : copy.numFail + 1;
            copy.testDetails = [...copy.testDetails, t];
        }
        return copy;
    };
    exports.groupOfTestsNeedingSetup = (ctx, testFn, before, after) => async (...testsConfigs) => {
        await before(ctx);
        const testResults = await Promise.all(testsConfigs.map(async (t) => {
            const actual = typeof t.actual === 'function' ? t.actual(ctx) : t.actual;
            const expected = typeof t.expected === 'function' ? t.expected(ctx) : t.expected;
            return testFn(t.name, actual, expected);
        }));
        await after(ctx);
        return testResults;
    };
    exports.testMaker = (fileName, i = 1) => {
        console.log(chalk_1.default.bgWhite.black(`STARTING:  ${fileName} `));
        return [
            (async (name, actual, expected, comparFn = exports.deepEq) => {
                const [act, exp] = await Promise.all([actual, expected]);
                const a = exports.pruneUndefined(act);
                const e = exports.pruneUndefined(exp);
                let passed;
                if (comparFn(a, e)) {
                    console.log(chalk_1.default.green(`✅: ${i.toString().padStart(4, '0')}: ${fileName} - ${name}`));
                    passed = true;
                }
                else {
                    console.error(chalk_1.default.red(`❌: ${i} - ${name}`));
                    console.error(chalk_1.default.white(`Expected: ${JSON.stringify(e, null, 2)}`));
                    console.error(chalk_1.default.yellow(`Actual: ${JSON.stringify(a, null, 2)}`));
                    console.error(chalk_1.default.white(`look at : ${JSON.stringify(deep_diff_1.diff(a, e), null, 2)}`));
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
                    lookat: deep_diff_1.diff(a, e)
                };
            }),
            (async (setName, ...i) => {
                const pregroupedAndFreshGrp = (await Promise.all(i)).reduce(async (prior, testCollection) => {
                    const [acc, grp] = await prior;
                    if (isArray(testCollection)) {
                        if (exports.isGroupReturnArr(testCollection)) {
                            const pregrouped = [...acc, ...testCollection];
                            return [pregrouped, grp];
                        }
                        else {
                            const testIntoGrp = groupUpTests(grp, ...testCollection);
                            return [acc, testIntoGrp];
                        }
                    }
                    else {
                        if (exports.isGroupReturn(testCollection)) {
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
        const [test, groupTest] = exports.testMaker(__filename);
        return [
            groupTest('allLocalTests', test('primitive.1', isPrimitive(1), true, exports.eq), test('primitive.2', isPrimitive(true), true, exports.eq), test('primitive.3', isPrimitive(null), true, exports.eq), test('primitive.4', isPrimitive(undefined), true, exports.eq), test('primitive.5', isPrimitive('string'), true, exports.eq), test('primitive.6', isPrimitive([1, true, 'tree']), false, exports.eq), test('primitive.7', isPrimitive({ a: 1 }), false, exports.eq), test('primitive.8', isPrimitive({ a: 1, b: undefined }), false, exports.eq), test('primitive.9', isPrimitive(BigInt(12345678901234567890)), true), test('isObject.1', exports.isObject({ a: 1 }), true, exports.eq), test('isObject.2', exports.isObject({}), true, exports.eq), test('isObject.3', exports.isObject([1, true, 'tree']), false, exports.eq), test('isObject.4', exports.isObject(1), false, exports.eq), test('isObject.5', exports.isObject(null), false, exports.eq), test('isObject.6', exports.isObject(undefined), false, exports.eq), test('isObject.7', exports.isObject('null'), false, exports.eq), test('isObject.8', exports.isObject(BigInt(12345678901234567890)), false, exports.eq), test('prune undefined.1', exports.pruneUndefined({ a: 1, b: 2, c: undefined }), { a: 1, b: 2 }), test('prune undefined.2 - recursive', exports.pruneUndefined({ a: 1, b: 2, c: { a: undefined } }), { a: 1, b: 2, c: {} }), test('prune undefined.3 - really recursive', exports.pruneUndefined({ a: 1, b: 2, c: { a: { f: 6, e: undefined } } }), { a: 1, b: 2, c: { a: { f: 6 } } }))
        ];
    };
    const findTestPaths = async (...globs) => {
        if (globs.length > 0) {
            return globby_1.default(globs);
        }
        else {
            return globby_1.default(['./test/**/*test.ts', '!./test/index.test.ts']);
        }
    };
    const importTests = async (pathForTests) => {
        return Promise.all((await pathForTests)
            .map(p => {
            const fullPath = path_1.join(__dirname, '../', p);
            return (__syncRequire ? Promise.resolve().then(() => __importStar(require(fullPath))) : new Promise((resolve_1, reject_1) => { require([fullPath], resolve_1, reject_1); }).then(__importStar)).then(importedTest => importedTest.default);
        }));
    };
    const flattenToGrpReturns = (...i) => {
        return i.reduce((acc, t) => {
            if (exports.isGroupReturnArr(t)) {
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
    exports.default = localTests;
});
