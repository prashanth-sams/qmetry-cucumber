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
var delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
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
  testCycleId = config.testCycleId?.trim() || (await createTestCycle())[0];
  const isValid = await validateTestCycleId(testCycleId);
  if (!isValid) testCycleId = (await createTestCycle())[0];
  linkAllTestCases(testCycleId);
  const matches = name.match(/\[.*?\]/g);
  const testCaseKeys = matches ? matches.map((match) => match.replace(/[\[\]]/g, "")) : [];
  const testCaseIds = getIdsByKey(testCaseKeys, testCycleId);
  testCaseIds.then((ids) => {
    ids.forEach(async ([id, testCaseExecutionId]) => {
      updateTestCaseStatus(id, testCaseExecutionId, status, testCycleId);
    });
  });
}
async function getIdsByKey(keys, testCycleId) {
  const matchingIds = [];
  const jsonData = await testCaseExecutionIDJsonData(testCycleId);
  jsonData.data.forEach((testCase) => {
    if (keys.includes(testCase.key)) {
      matchingIds.push([testCase.id, testCase.testCaseExecutionId]);
    }
  });
  return matchingIds;
}
async function testCaseExecutionIDJsonData(testCycleId) {
  const config = await getConfig();
  try {
    const url = `${config.baseUrl}/rest/qtm4j/ui/latest/testcycles/${testCycleId}/testcases/search?maxResults=200`;
    const headers = {
      "Content-Type": "application/json",
      "apiKey": `${config.apiKey}`,
      "Authorization": `${config.authorization}`
    };
    const body = {
      filter: {}
    };
    for (let attempt = 1; attempt <= 10; attempt++) {
      try {
        const response = await axios.post(url, body, { headers });
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
    console.error("Error fetching data:", error);
    throw error;
  }
}
async function updateTestCaseStatus(id, testCaseExecutionId, status, testCycleId) {
  const config = await getConfig();
  const url = `${config.baseUrl}/rest/qtm4j/ui/latest/testcycles/${testCycleId}/testcase-executions/${testCaseExecutionId}`;
  const headers = {
    "Content-Type": "application/json",
    "apiKey": `${config.apiKey}`,
    "Authorization": `${config.authorization}`
  };
  const body = {
    executionResultId: await getExecutionResultId(status)
  };
  axios.put(url, body, { headers }).then((response) => {
  }).catch((error) => {
    console.error("Error updating test case:", error);
  });
}
async function getExecutionResultId(status) {
  const config = await getConfig();
  const url = `${config.baseUrl}/rest/qtm4j/ui/latest/projects/${config.projectId}/execution-results`;
  const headers = {
    "Content-Type": "application/json",
    "apiKey": `${config.apiKey}`,
    "Authorization": `${config.authorization}`
  };
  const response = await axios.get(url, { headers });
  const resultNameId = [];
  response.data.forEach((results) => {
    resultNameId.push([results.id, results.name.toLowerCase()]);
  });
  return checkStatusId(resultNameId, status);
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
  const testCycleData = axios.post(url, body, { headers }).then((response) => {
    return [response.data.id, response.data.key];
  }).catch((error) => {
    console.error("Error creating test cycle:", error);
  });
  return testCycleData;
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
  const response = await axios.post(url, body, { headers }).then((response2) => {
    const testCaseIDVersion = response2.data.data.map((testCaseList) => {
      return {
        id: testCaseList.id,
        versionNo: testCaseList.version.versionNo
      };
    });
    return testCaseIDVersion;
  }).catch((error) => {
    console.error("Error fetching test cases:", error);
  });
  return response;
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
  const testCases = await fetchTestCases();
  body.testCases = testCases;
  axios.put(url, body, { headers }).then((response) => {
  }).catch((error) => {
    console.error("Error linking test cases:", error);
  });
}
async function validateTestCycleId(testCycleId) {
  const config = await getConfig();
  const url = `${config.baseUrl}/rest/qtm4j/ui/latest/testcycles/${testCycleId}`;
  const headers = {
    "Content-Type": "application/json",
    "apiKey": `${config.apiKey}`,
    "Authorization": `${config.authorization}`
  };
  const response = await axios.get(url, { headers }).then((response2) => {
    return response2.status === 200;
  }).catch((error) => {
    return false;
  });
  return response;
}
async function sendTestResultToQmetry(jsonData) {
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
  const response = await axios.post(url, body, { headers }).then((resp) => {
    return resp.data.url;
  });
  submitFile(response, jsonData);
}
async function submitFile(url, jsonData) {
  const config = await getConfig();
  const form = new FormData();
  const headers = {
    "Content-Type": "multipart/form-data",
    "apiKey": `${config.automationApiKey}`,
    "Authorization": `${config.authorization}`
  };
  form.append("file", fs2.createReadStream(jsonData));
  axios.post(url, form, { headers }).then((response) => {
  }).catch((error) => {
    console.error("Error submitting file:", error);
  });
}
export {
  createTestCycle,
  fetchTestCases,
  getExecutionResultId,
  linkAllTestCases,
  sendTestResultToQmetry,
  submitFile,
  updateQmetryStatus,
  updateTestCaseStatus,
  validateTestCycleId
};
