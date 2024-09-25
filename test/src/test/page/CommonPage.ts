import { pageFixture as fixture } from "../hooks/pageFixture";
import { BasePage } from "./BasePage";

export class CommonPage extends BasePage {

    element = {
        sidePanel:() => fixture.page.locator(this.locator('sidePanel').selectorValue),
    };

};