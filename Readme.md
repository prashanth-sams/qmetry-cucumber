# qmetry-cucumber

![qmetry-cucumber](https://github.com/user-attachments/assets/e2634d60-e8f6-4739-8d07-f67b90742376)

<p align="center"><b>Sync cucumber automation test results with Qmetry Test Cycle</b></p>

## Getting Started
```
npm install --save-dev qmetry-cucumber
```

## How to use

#### qmetry.config.json
Create `qmetry.config.json` file in the test project's root folder and add the below configurations.
```
{
    "baseUrl": "https://<your base url>",
    "apiKey": "<project api key>",
    "authorization": "<jira auth creds encoded by base64>",
    "projectId": <your project id>
    "summary": "<test summary>",
    "description": "<test description>"
}
```
Here, `summary` and `description` fields are optional.

#### Feature
```
Scenario: [PRO-TC-1] [PRO-TC-2] User logs in with valid credentials
        When User login with the username "<USERNAME>" and password "<PASSWORD>"
        Then User should be logged in successfully

        Examples:
        |   USERNAME   |   PASSWORD       |
        |   admin      |   amin           |
```

#### Cucumber Hooks
```
import { updateQmetryStatus } from "qmetry-cucumber";

After(async function ({ pickle, result }){
    updateQmetryStatus(pickle.name, result.status);
});
```

## Test
```
cd tests/ && npm test
```