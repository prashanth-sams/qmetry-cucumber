var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  createTestCycle: () => createTestCycle,
  fetchTestCases: () => fetchTestCases,
  getExecutionResultId: () => getExecutionResultId,
  linkAllTestCases: () => linkAllTestCases,
  updateQmetryStatus: () => updateQmetryStatus,
  updateTestCaseStatus: () => updateTestCaseStatus,
  validateTestCycleId: () => validateTestCycleId
});
module.exports = __toCommonJS(src_exports);

// src/qmetry-cucumber.ts
var import_axios = __toESM(require("axios"));

// src/config.ts
var import_promises = __toESM(require("fs/promises"));
var import_path = __toESM(require("path"));
var jsonHandler = async () => {
  const configFilePath = import_path.default.join(process.cwd(), "qmetry.config.json");
  try {
    await import_promises.default.access(configFilePath, import_promises.constants.F_OK);
    const data = await import_promises.default.readFile(configFilePath, "utf-8");
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
      description: data?.description || "Automated status update using qmetry-cucumber"
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
        const response = await import_axios.default.post(url, body, { headers });
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
  import_axios.default.put(url, body, { headers }).then((response) => {
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
  const response = await import_axios.default.get(url, { headers });
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
  const testCycleData = import_axios.default.post(url, body, { headers }).then((response) => {
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
  const response = await import_axios.default.post(url, body, { headers }).then((response2) => {
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
  import_axios.default.put(url, body, { headers }).then((response) => {
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
  const response = await import_axios.default.get(url, { headers }).then((response2) => {
    return response2.status === 200;
  }).catch((error) => {
    return false;
  });
  return response;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createTestCycle,
  fetchTestCases,
  getExecutionResultId,
  linkAllTestCases,
  updateQmetryStatus,
  updateTestCaseStatus,
  validateTestCycleId
});
