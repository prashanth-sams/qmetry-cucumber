// src/qmetry-cucumber.ts
import axios from "axios";

// src/config.ts
import fs, { constants } from "fs/promises";
import path from "path";
var jsonHandler = async () => {
  const configFilePath = path.join(process.cwd(), "qmetry.config.json");
  try {
    await fs.access(configFilePath, constants.F_OK);
    const data = await fs.readFile(configFilePath, "utf-8");
    const config = JSON.parse(data);
    return config;
  } catch (error) {
    console.error(`Error accessing or reading the file: ${error.message}`);
    return null;
  }
};
var getConfig = async () => {
  try {
    const data = await jsonHandler();
    return {
      baseUrl: data?.baseUrl,
      apiKey: data?.apiKey,
      authorization: data?.authorization,
      projectId: data?.projectId,
      testCycleId: data?.testCycleId,
      summary: data?.summary || "Test Cycle Summary",
      description: data?.description || "Automated status update using qmetry-cucumber",
      automationApiKey: data?.automationApiKey,
      automation: {
        format: data?.automation?.format,
        attachFile: data?.automation?.attachFile,
        isZip: data?.automation?.isZip,
        build: data?.automation?.build,
        fields: {
          testCycle: {
            labels: data?.automation?.fields?.testCycle?.labels,
            status: data?.automation?.fields?.testCycle?.status,
            summary: data?.automation?.fields?.testCycle?.summary,
            description: data?.automation?.fields?.testCycle?.description,
            customFields: data?.automation?.fields?.testCycle?.customFields || []
          },
          testCase: {
            labels: data?.automation?.fields?.testCase?.labels,
            description: data?.automation?.fields?.testCase?.description,
            customFields: data?.automation?.fields?.testCase?.customFields || []
          }
        }
      }
    };
  } catch (error) {
    console.error("Error fetching configuration:", error);
    throw error;
  }
};

// src/utils.ts
function checkStatusId(result, status) {
  if (!status) return 0;
  const statusName = status.toString().toLowerCase();
  const statusMapping = {
    passed: (name) => name.includes("pass"),
    failed: (name) => name.includes("fail"),
    pending: (name) => name.includes("pending") || name === "wip" || name === "work in progress",
    unknown: (name) => name.includes("unknown") || name === "not executed",
    undefined: (name) => name.includes("block") || name === "undefined",
    skipped: (name) => name.includes("skip") || name === "not executed",
    ambiguous: (name) => name.includes("ambiguous")
  };
  const checkCondition = statusMapping[statusName];
  if (!checkCondition) return 0;
  for (const [id, name] of result) {
    if (checkCondition(name)) {
      return id;
    }
  }
  return 0;
}

// src/qmetry-cucumber.ts
import FormData from "form-data";
import fs2 from "fs";
async function updateQmetryStatus(name, status) {
  const config = await getConfig();
  let testCycleId;
  let testCycleKey;
  if (config.testCycleId && (await validateTestCycleId(config.testCycleId.trim())).status === 200) {
    testCycleId = config.testCycleId.trim();
  } else {
    try {
      const data = await createTestCycle().then((response) => {
        return response.json();
      });
      [testCycleId, testCycleKey] = [data.id, data.key];
    } catch (error) {
      console.error("Error creating test cycle:", error);
    }
  }
  if (testCycleId) {
    await linkAllTestCases(testCycleId);
    const matches = name.match(/\[.*?\]/g);
    const testCaseKeys = matches ? matches.map((match) => match.replace(/[\[\]]/g, "")) : [];
    const testCaseIds = [];
    try {
      const jsonData = await testCaseExecutionIDJsonData(testCycleId).then((response) => {
        return response.json();
      });
      jsonData.data.forEach((testCase) => {
        if (testCaseKeys.includes(testCase.key)) {
          testCaseIds.push([testCase.id, testCase.testCaseExecutionId]);
        }
      });
    } catch (error) {
      console.error("Error:", error.message);
    }
    for (const [id, testCaseExecutionId] of testCaseIds) {
      const executionResultProps = await getExecutionResultId(status).then((response) => {
        return response.json();
      });
      const resultNameId = [];
      executionResultProps.forEach((results) => {
        resultNameId.push([results.id, results.name.toLowerCase()]);
      });
      await updateTestCaseStatus(id, testCaseExecutionId, resultNameId, status, testCycleId);
    }
    ;
  } else {
    console.error("testCycleId is not assigned, cannot link test cases");
  }
}
async function getIdsByKey(keys, testCycleId) {
  const matchingIds = [];
  try {
    const jsonData = await testCaseExecutionIDJsonData(testCycleId).then((response) => {
      return response.json();
    });
    jsonData.data.forEach((testCase) => {
      if (keys.includes(testCase.key)) {
        matchingIds.push([testCase.id, testCase.testCaseExecutionId]);
      }
    });
  } catch (error) {
    console.error("Error:", error.message);
  }
  return matchingIds;
}
async function testCaseExecutionIDJsonData(testCycleId) {
  const config = await getConfig();
  const url = `${config.baseUrl}/rest/qtm4j/ui/latest/testcycles/${testCycleId}/testcases/search?maxResults=200`;
  const headers = {
    "Content-Type": "application/json",
    "apiKey": `${config.apiKey}`,
    "Authorization": `${config.authorization}`
  };
  const body = {
    filter: {}
  };
  const requestOptions = {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  };
  return fetch(url, requestOptions);
}
async function updateTestCaseStatus(id, testCaseExecutionId, resultNameId, status, testCycleId) {
  const config = await getConfig();
  const url = `${config.baseUrl}/rest/qtm4j/ui/latest/testcycles/${testCycleId}/testcase-executions/${testCaseExecutionId}`;
  const headers = {
    "Content-Type": "application/json",
    "apiKey": `${config.apiKey}`,
    "Authorization": `${config.authorization}`
  };
  const body = {
    executionResultId: checkStatusId(resultNameId, status)
  };
  const requestOptions = {
    method: "PUT",
    headers,
    body: JSON.stringify(body)
  };
  return fetch(url, requestOptions);
}
async function getExecutionResultId(status) {
  const config = await getConfig();
  const url = `${config.baseUrl}/rest/qtm4j/ui/latest/projects/${config.projectId}/execution-results`;
  const headers = {
    "Content-Type": "application/json",
    "apiKey": `${config.apiKey}`,
    "Authorization": `${config.authorization}`
  };
  const requestOptions = {
    method: "GET",
    headers
  };
  return fetch(url, requestOptions);
}
async function createTestCycle() {
  const config = await getConfig();
  const url = `${config.baseUrl}/rest/qtm4j/qapi/latest/testcycles`;
  const headers = {
    "Content-Type": "application/json",
    "apiKey": `${config.apiKey}`,
    "Authorization": `${config.authorization}`
  };
  const body = {
    projectId: config.projectId,
    summary: config.summary,
    description: config.description
  };
  const requestOptions = {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  };
  return fetch(url, requestOptions);
}
async function fetchTestCases() {
  const config = await getConfig();
  const url = `${config.baseUrl}/rest/qtm4j/ui/latest/testcases/search?maxResults=200`;
  const headers = {
    "Content-Type": "application/json",
    "apiKey": `${config.apiKey}`,
    "Authorization": `${config.authorization}`
  };
  const body = {
    filter: {
      projectId: `${config.projectId}`,
      folderId: -1
    }
  };
  const requestOptions = {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  };
  return fetch(url, requestOptions);
}
async function linkAllTestCases(testCycleId) {
  const config = await getConfig();
  const url = `${config.baseUrl}/rest/qtm4j/qapi/latest/testcycles/${testCycleId}/testcases`;
  const headers = {
    "Content-Type": "application/json",
    "apiKey": `${config.apiKey}`,
    "Authorization": `${config.authorization}`
  };
  const body = {
    testCases: [],
    filter: {
      projectId: config.projectId
    }
  };
  const requestOptions = {
    method: "PUT",
    headers,
    body: JSON.stringify(body)
  };
  return fetch(url, requestOptions);
}
async function linkTestCases(testCycleId) {
  const config = await getConfig();
  const url = `${config.baseUrl}/rest/qtm4j/qapi/latest/testcycles/${testCycleId}/testcases`;
  const headers = {
    "Content-Type": "application/json",
    "apiKey": `${config.apiKey}`,
    "Authorization": `${config.authorization}`
  };
  const body = {
    testCases: [],
    filter: {
      projectId: config.projectId
    }
  };
  let testCases = [];
  try {
    const testCasesResponse = await fetchTestCases().then((response) => {
      return response.json();
    });
    testCases = testCasesResponse.data.map((testCaseList) => {
      return {
        id: testCaseList.id,
        versionNo: testCaseList.version.versionNo
      };
    });
  } catch (error) {
    console.error("Error fetching test cases:", error);
  }
  body.testCases = testCases;
  const requestOptions = {
    method: "PUT",
    headers,
    body: JSON.stringify(body)
  };
  return fetch(url, requestOptions);
}
async function validateTestCycleId(testCycleId) {
  const config = await getConfig();
  const url = `${config.baseUrl}/rest/qtm4j/ui/latest/testcycles/${testCycleId}`;
  const headers = {
    "Content-Type": "application/json",
    "apiKey": `${config.apiKey}`,
    "Authorization": `${config.authorization}`
  };
  const requestOptions = {
    method: "GET",
    headers
  };
  return fetch(url, requestOptions);
}
async function sendTestResultToQmetry(jsonData) {
  const importResultResponse = await importresult().then((response2) => response2.json());
  const config = await getConfig();
  const form = new FormData();
  const headers = {
    "Content-Type": "multipart/form-data",
    "apiKey": `${config.automationApiKey}`,
    "Authorization": `${config.authorization}`
  };
  form.append("file", fs2.createReadStream(jsonData));
  let response;
  try {
    response = await axios({
      method: "post",
      url: importResultResponse.url,
      headers: {
        ...headers,
        ...form.getHeaders()
      },
      data: form
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
  ;
  return response;
}
async function importresult() {
  const config = await getConfig();
  const url = `${config.baseUrl}/rest/qtm4j/automation/latest/importresult`;
  const headers = {
    "Content-Type": "application/json",
    "apiKey": `${config.automationApiKey}`,
    "Authorization": `${config.authorization}`
  };
  if (!config?.automation?.format) {
    throw new Error("Format is a required field but was not provided.");
  }
  const body = {
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
        customFields: config?.automation?.fields?.testCycle?.customFields || []
      },
      testCase: {
        labels: config?.automation?.fields?.testCase?.labels,
        description: config?.automation?.fields?.testCase?.description,
        customFields: config?.automation?.fields?.testCase?.customFields || []
      }
    }
  };
  const requestOptions = {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  };
  return fetch(url, requestOptions);
}
export {
  createTestCycle,
  fetchTestCases,
  getExecutionResultId,
  getIdsByKey,
  importresult,
  linkAllTestCases,
  linkTestCases,
  sendTestResultToQmetry,
  testCaseExecutionIDJsonData,
  updateQmetryStatus,
  updateTestCaseStatus,
  validateTestCycleId
};
