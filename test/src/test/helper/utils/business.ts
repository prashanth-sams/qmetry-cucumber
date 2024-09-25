
export default class Business {

    static async credentials(username: string, password: string) {
        /**
         * @description: This method is used to get the user credentials
         * @param {string} username - The username of the user
         * @param {string} password - The password of the user
         * @returns {Promise<{username: string, password: string}>}
         **/
        if (username.includes('admin')) {
            username = process.env.ADMIN_USER;
            password = process.env.ADMIN_PWD;
        }

        return { username, password };
    }
}