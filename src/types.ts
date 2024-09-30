
export declare enum TestStepResultStatus {
    UNKNOWN = "UNKNOWN",
    PASSED = "PASSED",
    SKIPPED = "SKIPPED",
    PENDING = "PENDING",
    UNDEFINED = "UNDEFINED",
    AMBIGUOUS = "AMBIGUOUS",
    FAILED = "FAILED"
}

export interface ExecutionResultProps {
    executionResultId: number
};

export interface ResponseData {
    total: number;
    data: TestCase[];
}

export interface Keys {
    key: string;
    id: string;
    testCaseExecutionId: number;
}

export interface TestCase {
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

export interface ExecutionResult {
    id: number;
    name: string;
    systemDefaultName: string;
    description: string;
    color: string;
    seqNo: number;
    isDefault: boolean;
}

export interface ResultPair {
    id: number;
    name: string;
}

export interface TestCaseList {
    id: string;
    key: string;
    archived: boolean;
    shareable: boolean;
    executionPlannedDate: null;
    projectId: number;
    version: {
        isLatestVersion: boolean;
        versionNo: number;
    }
}

export interface QmetryConfig {
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

export interface Automation {
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
        }
    }
}

export interface CustomField {
    name: string;
    value: string;
}

export interface ImportResultResponse {
    url: string;
    trackingId: string;
}

export interface importResultProps {
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
        }
    }
}