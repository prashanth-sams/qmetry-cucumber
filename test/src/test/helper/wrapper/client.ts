import { pageFixture as fixture } from "../../hooks/pageFixture";

export default class Client {

    static async getNetworkRequests(page: string) {
        /**
         * @description: This method is used to intercept network requests
         * @returns {Promise<void>}
         **/

        const requests = [];

        fixture.logger.info(`Requests on page ${page}:\n`);

        fixture.page.on('request', (request) => {
            fixture.logger.info(`Request: ${request.url()}`);
            fixture.logger.info(`Method: ${request.method()}`);
            fixture.logger.info(`Headers: ${request.headers()}`);
            fixture.logger.info(`Post Data: ${request.postData()}`);
            requests.push({
              url: request.url(),
              method: request.method(),
              headers: request.headers(),
              postData: request.postData(),
            });
        });

        
    }

    static async getNetworkResponses(page: string) {
        /**
         * @description: This method is used to intercept network responses
         * @returns {Promise<void>}
         **/

        const responses = [];

        await fixture.page.route('**/api/**', route => {
            route.continue();
        });

        fixture.logger.info(`Responses on page ${page}:\n`);
    
        await fixture.page.on('response', async (response) => {
            fixture.logger.info(`Response: ${response.url()}`);
            fixture.logger.info(`Status: ${response.status()}`);
            fixture.logger.info(`Headers: ${response.headers()}`);
            fixture.logger.info(`Body: ${await response.text()}`);
            responses.push({
              url: response.url(),
              status: response.status(),
              headers: response.headers(),
              body: await response.text()
            });
        }); 

        fixture.logger.info(`\nResponses on page ${page}: ${responses}`);
    }

    static async getConsoleErrors(page: string) {
        /**
         * @description: This method is used to get the console errors
         * @returns {Promise<void>}
         **/

        fixture.logger.info(`Console Errors on ${page}:\n`);

        fixture.page.on('console', async (msg) => {
            if (msg.type() === 'error') {
                fixture.logger.info(`Error: ${msg.text()}`);
            }
        });
    }
}
