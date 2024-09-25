# qmetry-cucumber
> Sync cucumber automation test results with Qmetry Test Cycle

## Getting started
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
**Notes:** `summary` and `description` fields are optional.

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