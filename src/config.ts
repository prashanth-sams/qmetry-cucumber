
import fs, { constants } from 'fs/promises';
import path from 'path';
import { QmetryConfig } from './types';

export const jsonHandler = async (): Promise<QmetryConfig | null> => {
    const configFilePath = path.join(process.cwd(), 'qmetry.config.json');

    try {
        await fs.access(configFilePath, constants.F_OK);

        const data = await fs.readFile(configFilePath, 'utf-8');

        const config: QmetryConfig = JSON.parse(data);
        return config;
    } catch (error) {
        console.error(`Error accessing or reading the file: ${error.message}`);
        return null;
    }
};

export const getConfig = async () => {
    try {
        const data = await jsonHandler();
        return {
            baseUrl: data?.baseUrl,
            apiKey: data?.apiKey,
            authorization: data?.authorization, 
            projectId: data?.projectId,
            testCycleId: data?.testCycleId,
            summary: data?.summary || 'Test Cycle Summary',
            description: data?.description || 'Automated status update using qmetry-cucumber',
            
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
                        customFields: data?.automation?.fields?.testCycle?.customFields || [],
                    },
                    testCase: {
                        labels: data?.automation?.fields?.testCase?.labels,
                        description: data?.automation?.fields?.testCase?.description,
                        customFields: data?.automation?.fields?.testCase?.customFields || [],
                    },
                },
            }
        };
    } catch (error) {
        console.error('Error fetching configuration:', error);
        throw error;
    }
};
