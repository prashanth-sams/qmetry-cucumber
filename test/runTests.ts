import { execSync } from 'child_process';
import { sendTestResultToQmetry } from "../src/qmetry-cucumber";

const TEST = process.env.TEST || 'local';  // Default to 'local' if TEST is not set

const smoke_priorities = ['@auth', '@data', '@smoke'];
const regression_priorities = ['@auth', '@data', '@regression'];
const local_priorities = ['@auth'];

export async function runCucumber(tag: string) {

  try {
    execSync(`npx cucumber-js --config=config/cucumber.js --tags "${tag}"`, { stdio: 'inherit' });
    await sendTestResultToQmetry(process.cwd() + '/test-result/reports/cucumber-report.json');
  } catch (error) {
    console.error(`Tests with tag ${tag} failed.`);
    process.exit(1);
  }
}

let priorities: string[] = [];

switch (TEST) {
  case 'smoke':
    priorities = smoke_priorities;
    break;
  case 'regression':
    priorities = regression_priorities;
    break;
  case 'local':
    priorities = local_priorities;
    break;
  default:
    console.error(`Unknown TEST value: ${TEST}`);
    process.exit(1);
}

if (priorities.length > 0) {
  (async () => {
    for (const priority of priorities) {
      await runCucumber(priority);
    }
  })();
} else {
  process.exit(1);
}