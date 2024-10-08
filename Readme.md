![NPM Version](https://img.shields.io/npm/v/qmetry-cucumber)
![NPM Downloads](https://img.shields.io/npm/dy/qmetry-cucumber)

# qmetry-cucumber
![qmetry-cucumber](https://github.com/user-attachments/assets/e2634d60-e8f6-4739-8d07-f67b90742376)

<p align="center"><b>Sync cucumber automation test results with Qmetry Test Cycle</b></p>

## Getting Started
```
npm install --save-dev qmetry-cucumber
```

## How to use

#### Case #1 Open API

> Create `qmetry.config.json` file in the test project's root folder and add the below configurations.

##### qmetry.config.json
```
{
    "baseUrl": "https://<your base url>",
    "apiKey": "<project api key>",
    "authorization": "<jira auth creds encoded by base64>",
    "projectId": <your project id>,
    "testCycleId": <your test cycle id>,
    "summary": "<test summary>",
    "description": "<test description>"
}
```
Here, `testCycleId`, `summary` and `description` fields are optional.

##### Feature
```
Scenario: [PRO-TC-1] [PRO-TC-2] User logs in with valid credentials
        When User login with the username "<USERNAME>" and password "<PASSWORD>"
        Then User should be logged in successfully

        Examples:
        |   USERNAME   |   PASSWORD       |
        |   admin      |   amin           |
```

##### hooks.ts
```
import { updateQmetryStatus } from "qmetry-cucumber";

After(async function ({ pickle, result }){
    updateQmetryStatus(pickle.name, result.status);
});
```


#### Case #2 Automation API

> Submit the Cucumber test output in JSON format to QMetry using the Automation API. To achieve this, create a `qmetry.config.json` file in the root directory of your test project and add the following configurations.

##### qmetry.config.json
```
{
    "baseUrl": "https://<your base url>",
    "authorization": "<jira auth creds encoded by base64>",
    
    "automationApiKey": "<automation api key>",
    "automation": {
        "format": "cucumber"
    }
}
```
Here, `baseUrl`, `authorization`, `projectId`, `automationApiKey`, and `automation > format` are the only mandatory fields. For more optional fields, check below:

```
{
    "baseUrl": "https://<your base url>",
    "authorization": "<jira auth creds encoded by base64>",
    "projectId": 0,
    
    "automationApiKey": "<automation api key>",
    "automation": {
        "format": "cucumber",
        "attachFile": true,
        "isZip":false,
        "build":"",
        "fields":{ 
            "testCycle":{ 
                "labels": ["<your label>"],
                "status":"Done",
                "summary": "<test cycle summary>",
                "description": "<test cycle description>",
                "customFields": [
                    {
                        "name": "<field name; say., Environment>",
                        "value": "<field value; say., DEV>"
                    }
                ]
            },
            "testCase":{ 
                "labels": ["<your label>"],
                "description": "<test case description>",
                "customFields": [
                    {
                        "name": "<field name; say., Environment>",
                        "value": "<field value; say., DEV>"
                    }
                ]
            }
        }
    }
}
```

##### <your_custom_file>.ts
Invoke the `sendTestResultToQmetry` function immediately after executing the cucumber tests.
```
import { sendTestResultToQmetry } from "qmetry-cucumber";

execSync(`npx cucumber-js --config=config/cucumber.js --tags "@smoke"`, { stdio: 'inherit' });
sendTestResultToQmetry(process.cwd() + '/test-result/reports/cucumber-report.json');
```

## Test
```
npm test
```