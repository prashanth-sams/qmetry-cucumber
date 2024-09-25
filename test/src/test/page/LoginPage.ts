import { BasePage } from "./BasePage";
import { pageFixture as fixture } from "../hooks/pageFixture";
import Business from "../helper/utils/business";

export class LoginPage extends BasePage {

    element = {
        username:() => fixture.page.getByPlaceholder(this.locator('username').selectorValue),
        password:() => fixture.page.getByPlaceholder(this.locator('password').selectorValue),
        login:() => fixture.page.getByRole('button', { name: this.locator('login').selectorValue }),
    };

    public async loginUser(username: string, password: string):Promise<void> {
        const { username: user, password: pwd } = await Business.credentials(username, password);
        
        await this.element.username().fill(user);
        await this.element.password().fill(pwd);
        await this.element.login().click();
    };  
};