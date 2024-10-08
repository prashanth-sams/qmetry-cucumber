import axios from 'axios';
import { TestStepResultStatus, ResponseData, ExecutionResultProps, ExecutionResult, ResultPair, TestCaseList, importResultProps, CreateTestCycleResponse, Keys, TestCasesResponse } from './types';
import { getConfig } from './config';
import { delay, checkStatusId } from './utils';
import FormData from 'form-data';
import fs from 'fs';

/**
 * Update the status of a test case in QMetry
 * 
 * @param name 
 * @param status 
 */
export async function updateQmetryStatus (name: string, status?: TestStepResultStatus) {
    const config = await getConfig();

    let testCycleId: string | undefined;
    let testCycleKey: string | undefined;

    if (config.testCycleId && ((await validateTestCycleId(config.testCycleId.trim())).status === 200)) {
        testCycleId = config.testCycleId.trim();
    } else {
        try {
            const data: CreateTestCycleResponse = await createTestCycle().then((response) => {
                return response.json();
            });
            
            [testCycleId, testCycleKey] = [data.id, data.key];
        } catch (error) {
            console.error('Error creating test cycle:', error);
        }
    }

    if (testCycleId) {
        await linkAllTestCases(testCycleId);

        const matches = name.match(/\[.*?\]/g);
        const testCaseKeys = matches ? matches.map(match => match.replace(/[\[\]]/g, '')) : [];

        const testCaseIds: [string, number][] = [];

        try {
            const jsonData: ResponseData = await testCaseExecutionIDJsonData(testCycleId).then((response) => {
                return response.json();
            });

            jsonData.data.forEach((testCase: Keys) => {
                if (testCaseKeys.includes(testCase.key)) {
                    testCaseIds.push([testCase.id, testCase.testCaseExecutionId]);
                }
            });

        } catch (error) {
            console.error('Error:', error.message);
        }

        for (const [id, testCaseExecutionId] of testCaseIds) {
            const executionResultProps = await getExecutionResultId(status).then((response) => {
                return response.json();
            });

            const resultNameId: [number, string][] = [];

            executionResultProps.forEach((results: ResultPair) => {
                resultNameId.push([results.id, results.name.toLowerCase()]);
            });

            await updateTestCaseStatus(id, testCaseExecutionId, resultNameId, status, testCycleId);
        };
    } else {
        console.error('testCycleId is not assigned, cannot link test cases');
    }    
}

/**
 * Get the IDs of test cases by key
 * 
 * @param keys 
 * @param testCycleId 
 * @returns 
 */
export async function getIdsByKey(keys: string[], testCycleId: string): Promise<[string, number][]> {
    const matchingIds: [string, number][] = [];

    try {
        const jsonData: ResponseData = await testCaseExecutionIDJsonData(testCycleId).then((response) => {
            return response.json();
        });

        jsonData.data.forEach((testCase: Keys) => {
            if (keys.includes(testCase.key)) {
                matchingIds.push([testCase.id, testCase.testCaseExecutionId]);
            }
        });
    } catch (error) {
        console.error('Error:', error.message);
    }

    return matchingIds;
}

/**
 * This function is used to get the test case execution ID
 * 
 * @param testCycleId 
 * @returns 
 */
export async function testCaseExecutionIDJsonData(testCycleId: string): Promise<Response> {
    const config = await getConfig();

    const url = `${config.baseUrl}/rest/qtm4j/ui/latest/testcycles/${testCycleId}/testcases/search?maxResults=200`;

    const headers = {
        'Content-Type': 'application/json',
        'apiKey': `${config.apiKey}`,
        'Authorization': `${config.authorization}`
    };

    const body = {
        filter: {}
    };

    const requestOptions = {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    };

    return fetch(url, requestOptions);
}

/**
 * Update the status of a test case in QMetry
 * 
 * @param id 
 * @param testCaseExecutionId 
 * @param resultNameId 
 * @param status 
 * @param testCycleId 
 * @returns 
 */
export async function updateTestCaseStatus (id: string, testCaseExecutionId: number, resultNameId: [number, string][], status: TestStepResultStatus | undefined,
    testCycleId: string): Promise<Response> {
    const config = await getConfig();

    const url = `${config.baseUrl}/rest/qtm4j/ui/latest/testcycles/${testCycleId}/testcase-executions/${testCaseExecutionId}`;

    const headers = {
        'Content-Type': 'application/json',
        'apiKey': `${config.apiKey}`,
        'Authorization': `${config.authorization}`
    };

    const body: ExecutionResultProps = {
        executionResultId: checkStatusId(resultNameId, status),
    };

    const requestOptions = {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(body)
    };
    
    return fetch(url, requestOptions);
}

/**
 * Get the execution result ID
 * 
 * @param status 
 * @returns 
 */
export async function getExecutionResultId(status: TestStepResultStatus | undefined): Promise<Response> {
    const config = await getConfig();

    const url = `${config.baseUrl}/rest/qtm4j/ui/latest/projects/${config.projectId}/execution-results`;

    const headers = {
        'Content-Type': 'application/json',
        'apiKey': `${config.apiKey}`,
        'Authorization': `${config.authorization}`
    };

    const requestOptions = {
        method: 'GET',
        headers: headers
    };

    return fetch(url, requestOptions);
};

/**
 * Create a test cycle in QMetry
 * 
 * @returns 
 */
export async function createTestCycle(): Promise<Response> {
    const config = await getConfig();

    const url = `${config.baseUrl}/rest/qtm4j/qapi/latest/testcycles`;

    const headers = {
        'Content-Type': 'application/json',
        'apiKey': `${config.apiKey}`,
        'Authorization': `${config.authorization}`
    };

    const body = {
        projectId: config.projectId,
        summary: config.summary,
        description: config.description,
    };

    const requestOptions = {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    };

    return fetch(url, requestOptions);
}

/**
 * Fetch all test cases
 * 
 * @returns 
 */
export async function fetchTestCases(): Promise<Response> {
    const config = await getConfig();

    const url = `${config.baseUrl}/rest/qtm4j/ui/latest/testcases/search?maxResults=200`;

    const headers = {
        'Content-Type': 'application/json',
        'apiKey': `${config.apiKey}`,
        'Authorization': `${config.authorization}`
    };

    const body = {
        filter: {
            projectId: `${config.projectId}`,
            folderId: -1,
        }
    };

    const requestOptions = {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    };
    
    return fetch(url, requestOptions);
}

/**
 * Link all test cases to a test cycle
 * 
 * @param testCycleId 
 * @returns 
 */
export async function linkAllTestCases(testCycleId: string): Promise<Response> {
    const config = await getConfig();

    const url = `${config.baseUrl}/rest/qtm4j/qapi/latest/testcycles/${testCycleId}/testcases`;

    const headers = {
        'Content-Type': 'application/json',
        'apiKey': `${config.apiKey}`,
        'Authorization': `${config.authorization}`
    };

    const body = {
        testCases: [] as { id: string; versionNo: number; }[],
        filter: {
            projectId: config.projectId,
        }
    };

    const requestOptions = {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(body)
    };
    
    return fetch(url, requestOptions);
}

/**
 * Link test cases to a test cycle
 * 
 * @param testCycleId 
 * @returns 
 */
export async function linkTestCases(testCycleId: string): Promise<Response> {
    const config = await getConfig();

    const url = `${config.baseUrl}/rest/qtm4j/qapi/latest/testcycles/${testCycleId}/testcases`;

    const headers = {
        'Content-Type': 'application/json',
        'apiKey': `${config.apiKey}`,
        'Authorization': `${config.authorization}`
    };

    const body = {
        testCases: [] as { id: string; versionNo: number; }[],
        filter: {
            projectId: config.projectId,
        }
    };

    let testCases: { id: string; versionNo: number; }[] = [];
    
    try {
        const testCasesResponse: TestCasesResponse = await fetchTestCases().then((response) => {
            return response.json();
        });

        testCases = testCasesResponse.data.map((testCaseList: TestCaseList) => {
            return { 
                id: testCaseList.id, 
                versionNo: testCaseList.version.versionNo 
            };
        });

    } catch (error) {
        console.error('Error fetching test cases:', error);
    }

    body.testCases = testCases;

    const requestOptions = {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(body)
    };
    
    return fetch(url, requestOptions);
}

/**
 * Validate the test cycle ID
 * 
 * @param testCycleId 
 * @returns 
 */
export async function validateTestCycleId(testCycleId: string): Promise<Response> {
    const config = await getConfig();

    const url = `${config.baseUrl}/rest/qtm4j/ui/latest/testcycles/${testCycleId}`;

    const headers = {
        'Content-Type': 'application/json',
        'apiKey': `${config.apiKey}`,
        'Authorization': `${config.authorization}`
    };

    const requestOptions = {
        method: 'GET',
        headers: headers
    };

    return fetch(url, requestOptions);
}

/**
 * Send test results to QMetry
 * 
 * @param jsonData 
 * @returns 
 */
export async function sendTestResultToQmetry(jsonData: any): Promise<Response> {

    const importResultResponse = await importresult().then(response => response.json());

    const config = await getConfig();
    const form = new FormData();

    const headers = {
        'Content-Type': 'multipart/form-data',
        'apiKey': `${config.automationApiKey}`,
        'Authorization': `${config.authorization}`
    };

    form.append('file', fs.createReadStream(jsonData));

    let response: Response;

    try {
        response = await axios({
            method: 'post',
            url: importResultResponse.url,
            headers: { 
                ...headers,
                ...form.getHeaders()
            }, data: form
        });
    } catch(error) {
        console.log(error);
        throw error
    };

    return response;
}

/**
 * Import the test results to QMetry
 * 
 * @returns
 */
export async function importresult(): Promise<Response> {
    const config = await getConfig();

    const url = `${config.baseUrl}/rest/qtm4j/automation/latest/importresult`;

    const headers = {
        'Content-Type': 'application/json',
        'apiKey': `${config.automationApiKey}`,
        'Authorization': `${config.authorization}`
    };

    if (!config?.automation?.format) {
        throw new Error('Format is a required field but was not provided.');
    }

    const body: importResultProps = {
        format: config.automation.format,
        attachFile: config?.automation.attachFile,
        isZip: config?.automation.isZip,
        build: config?.automation.build,
        fields: {
            testCycle: {
                labels: config?.automation?.fields?.testCycle?.labels,
                status: config?.automation?.fields?.testCycle?.status,
                summary: config?.automation?.fields?.testCycle?.summary,
                description: config?.automation?.fields?.testCycle?.description,
                customFields: config?.automation?.fields?.testCycle?.customFields || [],
            },
            testCase: {
                labels: config?.automation?.fields?.testCase?.labels,
                description: config?.automation?.fields?.testCase?.description,
                customFields: config?.automation?.fields?.testCase?.customFields || [],
            }
        }
    };

    const requestOptions = {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    };

    return fetch(url, requestOptions);
}