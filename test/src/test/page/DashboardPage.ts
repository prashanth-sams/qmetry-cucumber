import { BasePage } from "./BasePage";
import { pageFixture as fixture } from "../hooks/pageFixture";

export class DashboardPage extends BasePage {

    element = {
        header:() => fixture.page.locator(this.locator('header').selectorValue),
        logo:() => fixture.page.locator(this.locator('logo').selectorValue),
        dashboardWidget:() => fixture.page.locator(this.locator('dashboardWidget').selectorValue),
    };

};