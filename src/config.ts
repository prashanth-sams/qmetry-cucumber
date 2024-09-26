
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
            description: data?.description || 'Automated status update using qmetry-cucumber'
        };
    } catch (error) {
        console.error('Error fetching configuration:', error);
        throw error;
    }
};
