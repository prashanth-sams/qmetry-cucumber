import { pageFixture as fixture } from "../../hooks/pageFixture";

export default class Actions {

    static async goto(url: string) {
        /**
         * @description: This method is used to navigate to the given URL
         * @param {string} url - The URL to navigate
         * @returns {Promise<void>}
         */
        await fixture.page.goto(url, {
            waitUntil: "domcontentloaded",
            timeout: 30000
        });
    }

    static async getUrl() {
        /**
         * @description: This method is used to get the current URL
         * @returns {Promise<string>}
         */
        return fixture.page.url();
    }

    static async waitAndClick(locator: string) {
        /**
         * @description: This method is used to wait for the element to be visible and then click on it
         * @param {string} locator - The locator of the element to click
         * @returns {Promise<void>}
         */
        const element = fixture.page.locator(locator);
        await element.waitFor({
            state: "visible"
        });
        await element.click();
    }
}