import { Given, Then, When } from "@cucumber/cucumber"
import { pageFixture as fixture } from "../hooks/pageFixture";
import { LoginPage } from "../page/LoginPage";
import page from "../helper/wrapper/actions";


let login = new LoginPage(fixture.page);

Given('User is on the login page', { timeout: 60 * 1000 }, async function () {
  await page.goto(process.env.BASEURL);
  fixture.logger.info("Successfully navigated to the OrangeHRM application")
});

When('User login with the username {string} and password {string}', { timeout: 60 * 1000 }, async function (username: string, password: string) {
  await login.loginUser(username, password);
});
