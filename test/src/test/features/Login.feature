@auth
Feature: Authentication

    Background: The user lands on the OrangeHRM login page
        Given User is on the login page

    Scenario: [SMTV-TC-1] [SMTV-TC-2] User logs in with valid credentials and fills out the onboarding process storing cookies for the upcoming test executions
        When User login with the username "<USERNAME>" and password "<PASSWORD>"
        Then User should be logged in successfully

        Examples:
        |   USERNAME        |   PASSWORD       |
        |   admin_user      |   admin_pwd      |
