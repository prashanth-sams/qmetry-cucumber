import axios, { AxiosResponse } from 'axios';
import { TestStepResultStatus, ResponseData, ExecutionResultProps, ExecutionResult, ResultPair, TestCaseList, Keys } from './types';
import { getConfig } from './config';
import { delay, checkStatusId } from './utils';

export async function updateQmetryStatus (name: string, status?: TestStepResultStatus) {
    const config = await getConfig();

    let testCycleId;

    testCycleId = config.testCycleId?.trim() || (await createTestCycle())[0];
    const isValid = await validateTestCycleId(testCycleId);

    if (!isValid) testCycleId = (await createTestCycle())[0];

    linkAllTestCases(testCycleId);

    const matches = name.match(/\[.*?\]/g);
    const testCaseKeys = matches ? matches.map(match => match.replace(/[\[\]]/g, '')) : [];

    const testCaseIds = getIdsByKey(testCaseKeys, testCycleId);

    testCaseIds.then((ids) => {
        ids.forEach(async ([id, testCaseExecutionId]) => {
            updateTestCaseStatus(id, testCaseExecutionId, status, testCycleId);
        });

    });
}

async function getIdsByKey(keys: string[], testCycleId: string): Promise<[string, number][]> {
    const matchingIds: [string, number][] = [];

    const jsonData = await testCaseExecutionIDJsonData(testCycleId);

    jsonData.data.forEach((testCase: Keys) => {
        if (keys.includes(testCase.key)) {
            matchingIds.push([testCase.id, testCase.testCaseExecutionId]);
        }
    });

    return matchingIds;
}

async function testCaseExecutionIDJsonData(testCycleId: string): Promise<ResponseData> {
    const config = await getConfig();

    try {
      const url = `${config.baseUrl}/rest/qtm4j/ui/latest/testcycles/${testCycleId}/testcases/search?maxResults=200`;

      const headers = {
        'Content-Type': 'application/json',
        'apiKey': `${config.apiKey}`,
        'Authorization': `${config.authorization}`
      };
  
      const body = {
        filter: {}
      };

      for (let attempt = 1; attempt <= 10; attempt++) {
        try {
            const response: AxiosResponse<ResponseData> = await axios.post(url, body, { headers });

            if (response.data.total > 0) {
                return response.data;
            } else {
            }
        } catch (error) {
            console.error(`Attempt ${attempt}: Error creating test cycle`, error);
        }
        await delay(500);
    }
    return { total: 0, data: [] };
  
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  }

export async function updateTestCaseStatus(
    id: string, testCaseExecutionId: number,
    status: TestStepResultStatus | undefined,
    testCycleId: string,
    ): Promise<void> {

    const config = await getConfig();

    const url = `${config.baseUrl}/rest/qtm4j/ui/latest/testcycles/${testCycleId}/testcase-executions/${testCaseExecutionId}`;

    const headers = {
        'Content-Type': 'application/json',
        'apiKey': `${config.apiKey}`,
        'Authorization': `${config.authorization}`
    };

    const body: ExecutionResultProps = {
        executionResultId: await getExecutionResultId(status),
    };

    axios.put(url, body, { headers })
        .then((response) => {
        })
        .catch((error) => {
            console.error('Error updating test case:', error);
        });
}

export async function getExecutionResultId(status: TestStepResultStatus | undefined): Promise<number> {
    const config = await getConfig();

    const url = `${config.baseUrl}/rest/qtm4j/ui/latest/projects/${config.projectId}/execution-results`;

    const headers = {
        'Content-Type': 'application/json',
        'apiKey': `${config.apiKey}`,
        'Authorization': `${config.authorization}`
    };

    const response: AxiosResponse<ExecutionResult[]> = await axios.get(url, { headers });

    const resultNameId: [number, string][] = [];

    response.data.forEach((results: ResultPair) => {
        resultNameId.push([results.id, results.name.toLowerCase()]);
    });

    return checkStatusId(resultNameId, status);
};

export async function createTestCycle(): Promise<any> {
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

    const testCycleData = axios.post(url, body, { headers })
        .then((response) => {
            return [response.data.id, response.data.key];
        })
        .catch((error) => {
            console.error('Error creating test cycle:', error);
        });
    
    return testCycleData;
}


export async function fetchTestCases(): Promise<{ id: string; versionNo: number; }[]> {
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

    const response = await axios.post(url, body, { headers })
        .then((response) => {

            const testCaseIDVersion = response.data.data.map((testCaseList: TestCaseList) => {
                return { 
                    id: testCaseList.id, 
                    versionNo: testCaseList.version.versionNo 
                };
            });

            return testCaseIDVersion;
        })
        .catch((error) => {
            console.error('Error fetching test cases:', error);
        });
    
    return response;
}

export async function linkAllTestCases(testCycleId: string): Promise<void> {
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

    const testCases = await fetchTestCases();
    body.testCases = testCases;

    axios.put(url, body, { headers })
        .then((response) => {
        })
        .catch((error) => {
            console.error('Error linking test cases:', error);
        });
}

export async function validateTestCycleId(testCycleId: string): Promise<boolean> {
    const config = await getConfig();

    const url = `${config.baseUrl}/rest/qtm4j/ui/latest/testcycles/${testCycleId}`;

    const headers = {
        'Content-Type': 'application/json',
        'apiKey': `${config.apiKey}`,
        'Authorization': `${config.authorization}`
    };

    const response = await axios.get(url, { headers })
        .then((response) => {
            return response.status === 200;
        })
        .catch((error) => {
            return false;
        });
    
    return response;
}
