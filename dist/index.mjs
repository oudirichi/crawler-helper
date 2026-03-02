import puppeteer from "puppeteer-core";
import envPaths from "env-paths";

//#region src/helper/puppeteer.ts
const paths = envPaths("crawler", { suffix: "" });
const LAUNCH_ARGS = [
	"--no-sandbox",
	"--disable-setuid-sandbox",
	"--disable-blink-features=AutomationControlled"
];
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36";
function launch(args = void 0) {
	return puppeteer.launch({
		headless: true,
		executablePath: process.env.PUPPETEER_EXECUTABLE_PATH ?? "/usr/bin/chromium",
		args: args ?? [...LAUNCH_ARGS],
		userDataDir: paths.cache
	});
}
async function openPage(browser, url, agent = void 0) {
	const [page] = await browser.pages();
	await page.setViewport({
		width: 1024,
		height: 880
	});
	await page.setUserAgent(agent ?? USER_AGENT);
	await page.goto(url, {
		waitUntil: "networkidle2",
		timeout: 0
	});
	return page;
}
async function getContentForAddress(url, callback = void 0) {
	const browser = await launch();
	try {
		const page = await openPage(browser, url);
		if (callback) await callback(page);
		return await page.content();
	} finally {
		await browser.close();
	}
}

//#endregion
export { getContentForAddress, launch, openPage };
//# sourceMappingURL=index.mjs.map