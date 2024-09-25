import { LaunchOptions } from '@playwright/test';

export const config:LaunchOptions = {
    timeout: 60000,
    // headless: process.env.ENV === 'ci' ? true : false,
    slowMo: 600,
    args: ['--disable-web-security', '--disable-features=IsolateOrigins,site-per-process', '--disable-site-isolation-trials', '--no-sandbox', '--disable-setuid-sandbox'],
    tracesDir: 'test-result/traces'
};