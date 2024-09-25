import { expect } from "@playwright/test";
import { pageFixture as fixture } from "../../hooks/pageFixture";

export default class Assert {

    static async title(title: string) {
        /**
         * @description: This method is used to assert the title of the page
         * @param {string} title - The title of the page
         * @returns {Promise<void>}
         */
        await expect(fixture.page).toHaveTitle(title);
    }

    static async titleContains(title: string) {
        /**
         * @description: This method is used to assert the title of the page contains the given title
         * @param {string} title - The title of the page
         * @returns {Promise<void>}
         */
        const pageTitle = await fixture.page.title();
        expect(pageTitle).toContain(title);
    }

    static async url(url: string) {
        /**
         * @description: This method is used to assert the URL of the page
         * @param {string} url - The URL of the page
         * @returns {Promise<void>}
         */
        await expect(fixture.page).toHaveURL(url);
    }

    static async urlContains(url: string) {
        /**
         * @description: This method is used to assert the URL of the page contains the given string
         * @param {string} url - The url of the page
         * @returns {Promise<void>}
         */
        const pageURL = await fixture.page.url();
        expect(pageURL).toContain(url);
    }
}