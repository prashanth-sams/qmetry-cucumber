import { TestStepResultStatus } from './types';

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function checkStatusId(result: [number, string][], status: TestStepResultStatus | undefined): number {
    if (!status) return 0;

    const statusName = status.toString().toLowerCase();

    const statusMapping: { [key: string]: (name: string) => boolean } = {
        passed: (name) => name.includes('pass'),
        failed: (name) => name.includes('fail'),
        pending: (name) => name.includes('pending') || name === 'wip' || name === 'work in progress',
        unknown: (name) => name.includes('unknown') || name === 'not executed',
        undefined: (name) => name.includes('block') || name === 'undefined',
        skipped: (name) => name.includes('skip') || name === 'not executed',
        ambiguous: (name) => name.includes('ambiguous'),
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
