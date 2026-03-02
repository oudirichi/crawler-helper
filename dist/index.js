//#region rolldown:runtime
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));

//#endregion
const puppeteer_core = __toESM(require("puppeteer-core"));
const env_paths = __toESM(require("env-paths"));

//#region src/helper/puppeteer.ts
const paths = (0, env_paths.default)("crawler", { suffix: "" });
const LAUNCH_ARGS = [
	"--no-sandbox",
	"--disable-setuid-sandbox",
	"--disable-blink-features=AutomationControlled"
];
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36";
function launch(args = void 0) {
	return puppeteer_core.default.launch({
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
exports.getContentForAddress = getContentForAddress;
exports.launch = launch;
exports.openPage = openPage;
//# sourceMappingURL=index.js.map