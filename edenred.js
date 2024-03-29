// Sorry for the horrible code.

const puppeteer = require("puppeteer-core");
const fs = require("fs");
const express = require("express");
const winston = require("winston");

const COOKIES_FILE =
    process.env["EDENRED_COOKIE_FILE"] != null
        ? process.env["EDENRED_COOKIE_FILE"]
        : "/tmp/.edenred_cookies";
const UDPATE_INTERVAL =
    process.env["EDENRED_UPDATE_INTERVAL"] != null
        ? process.env["EDENRED_UPDATE_INTERVAL"]
        : 300000;
const PORT = 8080;

const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [new winston.transports.Console()],
});

logger.info(
    `Starting edenred updater - UDPATE_INTERVAL=${UDPATE_INTERVAL}, COOKIES_FILE=${COOKIES_FILE}, PORT=${PORT}.`
);

const app = express();

let trValues = {
    total: 0,
    today: 0,
    lastUpdated: 0,
};

app.get("/tr", (_req, res) => {
    if (trValues["lastUpdated"] === 0) {
        res.sendStatus(404);
    } else {
        res.status(200).json(trValues);
    }
});

app.get("/health", (_req, res) => {
    const healthcheck = {
        message: "UP",
        uptime: process.uptime(),
        timestamp: Date.now(),
    };
    res.status(200).json(healthcheck);
});

(function loop() {
    setTimeout(async () => {
        await update();
        loop();
    }, UDPATE_INTERVAL);
})();

const server = app.listen(PORT);

process.on("SIGINT", () => {
    server.close();
});

async function injectCookies(page) {
    return new Promise((resolve) => {
        logger.info("Reading existing cookies.");
        fs.readFile(COOKIES_FILE, async (err, data) => {
            if (!err) {
                let cookies = JSON.parse(data.toString("utf8"));
                const client = await page.target().createCDPSession();
                await client.send("Network.setCookies", { cookies: cookies });
            }
            resolve();
        });
    });
}

async function saveCookies(page) {
    const client = await page.target().createCDPSession();
    let cookies = await client.send("Network.getAllCookies");
    return new Promise((resolve, reject) => {
        let data = JSON.stringify(cookies["cookies"]);
        logger.info("Writing cookies.");
        fs.writeFile(COOKIES_FILE, data, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(COOKIES_FILE);
            }
        });
    });
}

async function update() {
    const browser = await puppeteer.launch({
        headless: true,
        slowMo: 25,
        timeout: 300000,
        executablePath: "/usr/bin/chromium-browser",
    });

    try {
        logger.info("Begin update.");

        if (
            process.env["EDENRED_COOKIE"] != null &&
            !fs.existsSync(COOKIES_FILE)
        ) {
            logger.info("Reading provided cookie from env var.");
            fs.writeFile(COOKIES_FILE, process.env["EDENRED_COOKIE"], (err) => {
                if (err) {
                    logger.error("Cannot write initial cookie.");
                }
            });
        }

        const page = await browser.newPage();

        page.on("error", (err) => {
            logger.error("Page error: " + err);
            browser.close();
        });

        await injectCookies(page);

        page.setDefaultNavigationTimeout(300000);
        await page.setViewport({ width: 1366, height: 768 });

        // needed because headless mode doesn't send them
        await page.setExtraHTTPHeaders({
            "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
        });

        // needed because headless mode sends HeadlessChrome
        await page.setUserAgent(
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36"
        );

        await page.goto("https://www.myedenred.fr/carte/");

        let isLoggedIn = false;
        try {
            await page.waitForSelector(
                "div.carte-body > div.carte-body-left > span.carte-body_solde",
                { visible: true, timeout: 30000 }
            );
            isLoggedIn = true;
        } catch (err) {
            logger.info("Cannot see card values right away.");
        }

        if (!isLoggedIn) {
            try {
                await page.waitForSelector("#Username", {
                    visible: true,
                    timeout: 120000,
                });
                await page.type("#Username", process.env["EDENRED_USER"]);
                await page.type("#Password", process.env["EDENRED_PASS"]);
                await page.click("#RememberLogin");
                await page.click("#login");
                await page.waitForNavigation({ waitUntil: "networkidle2" });
            } catch (err) {
                logger.info("Possibly already logged in, skipping login step.");
            }
        }

        try {
            await page.waitForSelector(
                "div.carte-body > div.carte-body-left > span.carte-body_solde",
                { visible: true, timeout: 300000 }
            );
        } catch (err) {
            logger.info("Selector didn't show up. Skipping update.");
            return;
        }

        await saveCookies(page);

        logger.info("Attempting to read data...");

        let remaining = "--";
        let today = "--";

        while (remaining.includes("--") || today.includes("--")) {
            remaining = await page.$eval(
                "div.carte-body > div.carte-body-right > span.carte-body_solde",
                (el) => el.innerText
            );
            today = await page.$eval(
                "div.carte-body > div.carte-body-left > span.carte-body_solde",
                (el) => el.innerText
            );
        }

        logger.info(`Remaining = ${remaining}, Today = ${today}`);

        trValues["total"] = parseFloat(remaining.split(" ")[0]);
        trValues["today"] = parseFloat(today.split(" ")[0]);
        trValues["lastUpdated"] = Date.now();

        logger.info("End update.");
    } finally {
        await browser.close();
    }
}
