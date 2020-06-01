export declare const deepEq: (a: unknown, e: unknown) => boolean;
export declare const eq: (a: unknown, e: unknown) => boolean;
export declare const isErrorThrown: (f: Function) => boolean;
export declare const findErrorThrown: (f: Function) => Error | null;
export declare const isPrimitiveInstance: (input: any) => boolean;
export declare const isObject: (input: any) => boolean;
export declare const pruneUndefined: (input: any) => any;
export declare const isGroupReturn: (i: IGroupReturn | ITestReturn | IGroupReturn[] | ITestReturn[]) => i is IGroupReturn;
export declare const isGroupReturnArr: (i: IGroupReturn | ITestReturn | IGroupReturn[] | ITestReturn[]) => i is IGroupReturn[];
export declare const groupOfTestsNeedingSetup: <T>(ctx: T, testFn: ITestFn, before: (ctx: T, ...others: unknown[]) => Promise<void>, after: (ctx: T, ...others: unknown[]) => Promise<void>) => (...testsConfigs: ITestConfig<T>[]) => Promise<ITestReturn[]>;
export declare const testMaker: (fileName: string, i?: number) => [ITestFn, IGroupTestFn];
declare const localTests: () => Promise<Promise<IGroupReturn[]>[]>;
export default localTests;
export declare type IComparitorFn = (a: unknown, e: unknown) => boolean;
export interface ITestReturn extends ITestDetails {
    testName: string;
    fileName: string;
}
export interface ITestDetails {
    passed: boolean;
    actual: unknown;
    expected: unknown;
    lookat: unknown;
}
export interface IGroupReturn {
    setName: string;
    fileName: string;
    groupPassed: boolean;
    numPass: number;
    numFail: number;
    testDetails: ITestDetails[];
}
export declare type ITestFn = (name: string, actual: unknown, expected: unknown, comparFn?: IComparitorFn) => Promise<ITestReturn>;
export declare type IGroupTestFn = (name: string, ...i: PromiseLike<ITestReturn | IGroupReturn | ITestReturn[] | IGroupReturn[]>[]) => Promise<IGroupReturn[]>;
export interface ITestConfig<T> {
    name: string;
    actual: (ctx: T) => unknown | unknown;
    expected: (ctx: T) => unknown | unknown;
    compareFn?: IComparitorFn;
}
