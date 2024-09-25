# qmetry-cucumber
> Sync cucumber automation test results with Qmetry Test Cycle

## Getting started
```
npm install --save-dev qmetry-cucumber
```

## How to use

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