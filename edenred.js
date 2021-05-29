const puppeteer = require('puppeteer');
const fs = require('fs');

const COOKIES_FILE = '/tmp/.edenred_cookies'

async function injectCookies(page) {
    return new Promise((resolve, reject) => {
        console.log("Reading existing cookies.");
        fs.readFile(COOKIES_FILE, async (err, data) => {
            if (!err) {
                let cookies = JSON.parse(data);
                await page._client.send("Network.setCookies", { cookies: cookies });
            }
            resolve();
        });
    });
}

async function saveCookies(page) {
    let cookies = await page._client.send("Network.getAllCookies", {});
    return new Promise((resolve, reject) => {
        let data = JSON.stringify(cookies['cookies']);
        console.log("Writing cookies.");
        fs.writeFile(COOKIES_FILE, data, (err, text) => {
            if (err) {
                reject(err);
            } else {
                resolve(COOKIES_FILE);
            }
        });
    });
}

(async () => {
    const browser = await puppeteer.launch({ headless: true, slowMo: 25, executablePath: '/usr/bin/chromium-browser' });

    try {
        console.log('Starting.')

        if (process.env['EDENRED_COOKIE'] != null) {
            console.log("Reading provided cookie from env var.");
            fs.writeFile(COOKIES_FILE, process.env['EDENRED_COOKIE'], (err, text) => {
                if (err) {
                    console.log('Cannot write initial cookie.')
                }
            });
        }

        const page = await browser.newPage();

        page.on('error', err => {
            console.log('Page error: ' + err);
            browser.close();
        });

        await injectCookies(page);

        await page.setDefaultNavigationTimeout(300000);
        await page.setViewport({ width: 1366, height: 768 });

        // needed because headless mode doesn't send them
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8'
        });

        // needed because headless mode sends HeadlessChrome
        await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36')

        await page.goto('https://www.myedenred.fr/accueil')

        let isLoggedIn = false
        try {
            await page.waitForSelector('div.carte-body > div.carte-body-left > span.carte-body_solde', { visible: true, timeout: 30000 });
            isLoggedIn = true
        } catch (err) {
            console.log('Cannot see card values right away. Probably need to login.')
        }

        if (!isLoggedIn) {
            try {
                await page.waitForSelector('#Username', { visible: true, timeout: 120000 });
                await page.type('#Username', process.env['EDENRED_USER'])
                await page.type('#Password', process.env['EDENRED_PASS'] )
                await page.click('#RememberLogin')
                await page.click('#login')
                await page.waitForNavigation({ waitUntil: 'networkidle2' });
            } catch (err) {
                console.log('Possibly already logged in, skipping login step.')
            }
        }

        await page.waitForSelector('div.carte-body > div.carte-body-left > span.carte-body_solde', { visible: true, timeout: 300000 });

        await saveCookies(page);

        const remaining = await page.$eval('div.carte-body > div.carte-body-right > span.carte-body_solde', el => el.innerText);
        const today = await page.$eval('div.carte-body > div.carte-body-left > span.carte-body_solde', el => el.innerText);

        console.log('remaining:' + remaining);
        console.log('today:' + today);

        console.log('Done.')
    } finally {
        await browser.close();
    }
})()

