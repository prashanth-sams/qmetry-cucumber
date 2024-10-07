declare enum TestStepResultStatus {
    UNKNOWN = "UNKNOWN",
    SKIPPED = "SKIPPED",
    PENDING = "PENDING",
    UNDEFINED = "UNDEFINED",
    AMBIGUOUS = "AMBIGUOUS",
    FAILED = "FAILED",
    PASSED = "PASSED"
}
interface CreateTestCycleResponse {
    id: string;
    key: string;
}
interface TestCasesResponse {
    data: TestCycleData[];
}
interface TestCycleData {
    id: string;
    version: Version;
}
interface Version {
    versionNo: number;
}
interface ExecutionResultProps {
    executionResultId: number;
}
interface ResponseData {
    total: number;
    data: TestCase[];
}
interface Keys {
    key: string;
    id: string;
    testCaseExecutionId: number;
}
interface TestCase {
    id: string;
    key: string;
    testCycleTestCaseMapId: number;
    archived: boolean;
    versionNo: number;
    testCaseExecutionId: number;
    enableExecutionResult: boolean;
    isLatestVersion: boolean;
    projectId: number;
}
interface ExecutionResult {
    id: number;
    name: string;
    systemDefaultName: string;
    description: string;
    color: string;
    seqNo: number;
    isDefault: boolean;
}
interface ResultPair {
    id: number;
    name: string;
}
interface TestCaseList {
    id: string;
    key: string;
    archived: boolean;
    shareable: boolean;
    executionPlannedDate: null;
    projectId: number;
    version: {
        isLatestVersion: boolean;
        versionNo: number;
    };
}
interface QmetryConfig {
    baseUrl: string;
    apiKey: string;
    authorization: string;
    projectId: number;
    testCycleId?: string;
    summary?: string;
    description?: string;
    automationApiKey?: string;
    automation?: Automation;
}
interface Automation {
    format: string;
    attachFile?: boolean;
    isZip?: boolean;
    build?: string;
    fields?: {
        testCycle?: {
            labels?: string[];
            status?: string;
            summary?: string;
            description?: string;
            customFields?: CustomField[];
        };
        testCase?: {
            labels?: string[];
            description?: string;
            customFields?: CustomField[];
        };
    };
}
interface ImportResultResponse {
    url: string;
    trackingId: string;
}
interface importResultProps {
    format: string;
    attachFile?: boolean;
    isZip?: boolean;
    build?: string;
    fields: {
        testCycle: {
            labels?: string[];
            status?: string;
            summary?: string;
            description?: string;
            customFields?: CustomField[];
        };
        testCase: {
            labels?: string[];
            description?: string;
            customFields?: CustomField[];
        };
    };
}
interface CustomField {
    name: string;
    value: string;
}

declare function updateQmetryStatus(name: string, status?: TestStepResultStatus): Promise<void>;
declare function getIdsByKey(keys: string[], testCycleId: string): Promise<[string, number][]>;
declare function testCaseExecutionIDJsonData(testCycleId: string): Promise<Response>;
declare function updateTestCaseStatus(id: string, testCaseExecutionId: number, resultNameId: [number, string][], status: TestStepResultStatus | undefined, testCycleId: string): Promise<Response>;
declare function getExecutionResultId(status: TestStepResultStatus | undefined): Promise<Response>;
declare function createTestCycle(): Promise<Response>;
declare function fetchTestCases(): Promise<Response>;
declare function linkAllTestCases(testCycleId: string): Promise<Response>;
declare function linkTestCases(testCycleId: string): Promise<Response>;
declare function validateTestCycleId(testCycleId: string): Promise<Response>;
declare function sendTestResultToQmetry(jsonData: any): Promise<Response>;
declare function importresult(): Promise<Response>;

export { type Automation, type CreateTestCycleResponse, type CustomField, type ExecutionResult, type ExecutionResultProps, type ImportResultResponse, type Keys, type QmetryConfig, type ResponseData, type ResultPair, type TestCase, type TestCaseList, type TestCasesResponse, type TestCycleData, TestStepResultStatus, type Version, createTestCycle, fetchTestCases, getExecutionResultId, getIdsByKey, type importResultProps, importresult, linkAllTestCases, linkTestCases, sendTestResultToQmetry, testCaseExecutionIDJsonData, updateQmetryStatus, updateTestCaseStatus, validateTestCycleId };
