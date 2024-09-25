import { Given, Then, When } from "@cucumber/cucumber"
import { pageFixture as fixture } from "../hooks/pageFixture";
import { CommonPage } from "../page/CommonPage";
import assert from "../helper/wrapper/assert";
import page from "../helper/wrapper/actions";
import { DashboardPage } from "../page/DashboardPage";
import { expect } from "@playwright/test";


let common = new CommonPage(fixture.page);
let dashboard = new DashboardPage(fixture.page);

Given('User is on the dashboard page as an admin', { timeout: 30 * 1000 }, async function () {
    await page.goto(process.env.BASEURL);
    fixture.logger.info("Successfully navigated to the dashboard page");

    await dashboard.element.dashboardWidget().first().waitFor({ state: "visible" });
    expect(await dashboard.element.dashboardWidget().count()).toBeGreaterThan(10);
    await assert.urlContains(common.constant('url'));
});

Then('User should be logged in successfully', { timeout: 30 * 1000 }, async function () {
    await dashboard.element.dashboardWidget().first().waitFor({ state: "visible" });
    expect(await dashboard.element.dashboardWidget().count()).toBeGreaterThan(10);

    await assert.urlContains(common.constant('url'));
});