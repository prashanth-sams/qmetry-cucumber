declare enum TestStepResultStatus {
    UNKNOWN = "UNKNOWN",
    PASSED = "PASSED",
    SKIPPED = "SKIPPED",
    PENDING = "PENDING",
    UNDEFINED = "UNDEFINED",
    AMBIGUOUS = "AMBIGUOUS",
    FAILED = "FAILED"
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
}

declare function updateQmetryStatus(name: string, status?: TestStepResultStatus): Promise<void>;
declare function updateTestCaseStatus(id: string, testCaseExecutionId: number, status: TestStepResultStatus | undefined, testCycleId: string): Promise<void>;
declare function getExecutionResultId(status: TestStepResultStatus | undefined): Promise<number>;
declare function createTestCycle(): Promise<any>;
declare function fetchTestCases(): Promise<{
    id: string;
    versionNo: number;
}[]>;
declare function linkAllTestCases(testCycleId: string): Promise<void>;
declare function validateTestCycleId(testCycleId: string): Promise<boolean>;

export { type ExecutionResult, type ExecutionResultProps, type Keys, type QmetryConfig, type ResponseData, type ResultPair, type TestCase, type TestCaseList, TestStepResultStatus, createTestCycle, fetchTestCases, getExecutionResultId, linkAllTestCases, updateQmetryStatus, updateTestCaseStatus, validateTestCycleId };
