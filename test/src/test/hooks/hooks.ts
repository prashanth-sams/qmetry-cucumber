import { After, AfterAll, Before, BeforeAll, BeforeStep, AfterStep, Status, setDefaultTimeout } from "@cucumber/cucumber";
import { Browser, chromium, Page, BrowserContext, firefox, webkit } from "@playwright/test";
import { pageFixture as fixture } from "./pageFixture";
import { config } from "../../../playwright.config";
import { getEnv } from "../helper/env/env";
import { createLogger } from "winston";
import { options } from "../helper/utils/logger";
import { updateQmetryStatus } from "../../../../src/qmetry-cucumber";

export let context: BrowserContext;
let browser: Browser;

const fs = require('fs');

BeforeAll(async function (){
    getEnv();
    setDefaultTimeout(60 * 1000);

    browser = await chromium.launch(config); 

});

Before(async function({ pickle }){
    const scenarioName = pickle.name + pickle.id
    const tags = pickle.tags.map(tag => tag.name);

    const contextOptions = {
        javaScriptEnabled: true,
        ignoreHTTPSErrors: true,
        viewport: { width: 1680, height: 1080 },
        recordVideo: { dir: 'test-result/videos/' }
    };
    
    if (!tags.includes("@auth")) {
        const storageState = JSON.parse(fs.readFileSync('src/test/helper/auth/admin.json', 'utf8'));
        contextOptions["storageState"] = storageState;
    }
    
    context = await browser.newContext(contextOptions);

    const page = await context.newPage();

    await context.tracing.start({
        screenshots: true,    // Capture screenshots
        snapshots: true,      // Capture DOM snapshots
        sources: true         // Capture JS and CSS source files
    });

    fixture.page = page;
    fixture.logger = createLogger(options(scenarioName));
});

After(async function ({ pickle, result }){
    try {
        if (result && result.status) {
            updateQmetryStatus(pickle.name, result.status);
        }
    } catch (error) {
        console.error('Error updating status:', error.message);
    }

    if(result?.status != Status.PASSED){
        const timeStamp = () => new Date().toISOString().replace(/:/g, '-');
        const img = await fixture.page.screenshot({ path: `./test-result/screenshots/${pickle.name}-${timeStamp()}.png`,type:"png"});
        await this.attach(img, "image/png");
        await fixture.page?.close();

        await context.close();
    }
});

AfterAll(async function (){
    await browser.close();
});