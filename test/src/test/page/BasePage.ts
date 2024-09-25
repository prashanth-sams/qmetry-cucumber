import { Page } from "@playwright/test";
import * as commonPageLocators from "../resources/CommonPageLocators.json";
import * as loginPageResources from "../resources/LoginPageLocators.json";
import * as dashboardPageResources from "../resources/DashboardPageLocators.json";
import { PageElement } from "../resources/interfaces/iPageElement";
import { pageFixture } from "../hooks/pageFixture";

export class BasePage {

    constructor(public page: Page){
        pageFixture.page = page;
    };

    public locator(resourceName: string) {
        /**
         * This method is used to get the locator value based on the resource name.
         */
        return this.getPageResources().webElements.find((element: PageElement) => element.elementName == resourceName) as PageElement
    };

    public constant(resourceName: string): string | undefined {
        /**
         * This method is used to get the constant value based on the resource name.
         */
        const constant = this.getPageResources().constants.find((item: any) => item.name === resourceName);
        return constant ? constant.value : undefined;
    };

    public getPageResources() {
        /**
         * This method is used to determine the page resources based on the class name.
         */
        const className = this.constructor.name.toLowerCase().replace('pageresources', '');

        const resourcesMap: { [key: string]: any } = {
          'common': commonPageLocators,
          'login': loginPageResources,
          'dashboard': dashboardPageResources
        };
        
        for (const key in resourcesMap) {
          if (className.includes(key)) {
            return resourcesMap[key];
          }
        }
      
        throw new Error(`Unknown page resource for class name: ${className}`);
    };    
};