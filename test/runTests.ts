import { execSync } from 'child_process';

const TEST = process.env.TEST || 'smoke';

const runCucumber = (tag: string) => {

  try {
    execSync(`npx cucumber-js --config=config/cucumber.js --tags "${tag}"`, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Tests with tag ${tag} failed.`);
    process.exit(1);
  }
};

const smoke_priorities = ['@auth', '@smoke'];
const regression_priorities = ['@auth', '@regression'];
const local_priorities = ['@auth', '@smoke'];

const args = process.argv.slice(2);

const priorityMap: { [key: string]: string[] } = {
  smoke: smoke_priorities,
  regression: regression_priorities,
  local: local_priorities,
};

const priorities = priorityMap[TEST];

if (priorities) {
  priorities.forEach((priority) => {
    runCucumber(priority);
  });
} else {
  process.exit(1);
}
