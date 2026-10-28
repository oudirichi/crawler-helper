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
const zod = __toESM(require("zod"));

//#region src/helper/puppeteer.ts
const paths = (0, env_paths.default)("crawler", { suffix: "" });
const LAUNCH_ARGS = [
	"--no-sandbox",
	"--disable-setuid-sandbox",
	"--disable-blink-features=AutomationControlled"
];
const USER_AGENT$1 = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36";
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
	await page.setUserAgent(agent ?? USER_AGENT$1);
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
//#region src/helper/scrape/network-capture.ts
const NetworkFilterSchema = zod.z.object({
	filterType: zod.z.literal("url"),
	matchType: zod.z.literal("contains"),
	value: zod.z.string(),
	httpResponseBody: zod.z.boolean().optional()
});
const MATCHERS = { "url/contains": (v, url) => url.includes(v) };
function formatPath$1(path) {
	return path.reduce((acc, key) => typeof key === "number" ? `${acc}[${key}]` : `${acc}.${String(key)}`, "");
}
function validateFilters(filters) {
	const result = zod.z.array(NetworkFilterSchema).safeParse(filters);
	if (!result.success) {
		const issues = result.error.issues.map((issue) => `networkCapture${formatPath$1(issue.path)}: ${issue.message}`).join("; ");
		throw new Error(issues);
	}
}
function matches(filter, url) {
	const key = `${filter.filterType}/${filter.matchType}`;
	return MATCHERS[key]?.(filter.value, url) ?? false;
}
function attachNetworkCapture(page, filters) {
	const captured = [];
	if (filters.length === 0) return captured;
	page.on("response", async (response) => {
		const url = response.url();
		const matched = filters.filter((f) => matches(f, url));
		if (matched.length === 0) return;
		const entry = {
			url,
			status: response.status()
		};
		if (matched.some((f) => f.httpResponseBody === true)) try {
			const buf = await response.buffer();
			entry.httpResponseBody = buf.toString("base64");
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			process.stderr.write(`warn: failed to read body for ${url}: ${msg}\n`);
		}
		captured.push(entry);
	});
	return captured;
}

//#endregion
//#region src/helper/scrape/actions/command.ts
const CssSelectorSchema = zod.z.preprocess((val) => typeof val === "string" ? {
	type: "css",
	value: val
} : val, zod.z.object({
	type: zod.z.literal("css"),
	value: zod.z.string().min(1),
	state: zod.z.literal("attached").optional()
}));

//#endregion
//#region src/helper/scrape/actions/shorthand.ts
/** Parse a shorthand numeric field, throwing a labelled error on non-numbers. */
function toNumber(label, raw) {
	const n = Number(raw);
	if (raw.trim() === "" || !Number.isFinite(n)) throw new Error(`${label} must be a number, got "${raw}"`);
	return n;
}
/** Split a shorthand tail into a leading selector token + the remaining payload. */
function splitSelectorPayload(rest) {
	const m = rest.match(/^(\S+)(?:\s+([\s\S]*))?$/);
	if (!m) return {
		selector: "",
		payload: ""
	};
	return {
		selector: m[1],
		payload: (m[2] ?? "").trim()
	};
}
/** Shorthand parser shared by selector-only actions (no `:` modifier allowed). */
function parseSelectorOnly(name, { modifier, rest }) {
	if (modifier !== void 0) throw new Error(`${name} takes no ":" modifier`);
	if (!rest) throw new Error(`${name} requires a selector`);
	return {
		action: name,
		selector: rest
	};
}

//#endregion
//#region src/helper/scrape/actions/commands/click.ts
const schema$6 = zod.z.object({
	action: zod.z.literal("click"),
	selector: CssSelectorSchema,
	button: zod.z.enum([
		"left",
		"right",
		"middle"
	]).optional(),
	delay: zod.z.number().optional()
});
const clickCommand = {
	name: "click",
	schema: schema$6,
	parseShorthand({ modifier, rest }) {
		if (!rest) throw new Error("click requires a selector");
		return modifier === void 0 ? {
			action: "click",
			selector: rest
		} : {
			action: "click",
			selector: rest,
			delay: toNumber("click delay", modifier)
		};
	},
	execute(page, a) {
		return page.click(a.selector.value, {
			button: a.button ?? "left",
			delay: a.delay
		});
	}
};

//#endregion
//#region src/helper/scrape/actions/commands/type.ts
const schema$5 = zod.z.object({
	action: zod.z.literal("type"),
	selector: CssSelectorSchema,
	text: zod.z.string(),
	delay: zod.z.number().optional()
});
const typeCommand = {
	name: "type",
	schema: schema$5,
	parseShorthand({ modifier, rest }) {
		const { selector, payload } = splitSelectorPayload(rest);
		if (!selector) throw new Error("type requires a selector");
		if (!payload) throw new Error("type requires text");
		return modifier === void 0 ? {
			action: "type",
			selector,
			text: payload
		} : {
			action: "type",
			selector,
			text: payload,
			delay: toNumber("type delay", modifier)
		};
	},
	execute(page, a) {
		return page.type(a.selector.value, a.text, { delay: a.delay });
	}
};

//#endregion
//#region src/helper/scrape/actions/commands/select.ts
const schema$4 = zod.z.object({
	action: zod.z.literal("select"),
	selector: CssSelectorSchema,
	values: zod.z.string().array().min(1)
});
const selectCommand = {
	name: "select",
	schema: schema$4,
	parseShorthand({ modifier, rest }) {
		if (modifier !== void 0) throw new Error("select takes no \":\" modifier");
		const { selector, payload } = splitSelectorPayload(rest);
		if (!selector) throw new Error("select requires a selector");
		if (!payload) throw new Error("select requires a value");
		return {
			action: "select",
			selector,
			values: [payload]
		};
	},
	execute(page, a) {
		return page.select(a.selector.value, ...a.values);
	}
};

//#endregion
//#region src/helper/sleep.ts
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

//#endregion
//#region src/helper/scrape/actions/commands/wait-for-timeout.ts
const schema$3 = zod.z.object({
	action: zod.z.literal("waitForTimeout"),
	timeout: zod.z.number()
});
const waitForTimeoutCommand = {
	name: "waitForTimeout",
	schema: schema$3,
	parseShorthand({ modifier, rest }) {
		const raw = modifier !== void 0 ? modifier : rest;
		if (raw.trim() === "") throw new Error("waitForTimeout requires a number");
		return {
			action: "waitForTimeout",
			timeout: toNumber("waitForTimeout", raw)
		};
	},
	execute(_page, a) {
		return sleep(a.timeout * 1e3);
	}
};

//#endregion
//#region src/helper/scrape/actions/commands/wait-for-selector.ts
const DEFAULT_TIMEOUT_MS = 3e4;
const schema$2 = zod.z.object({
	action: zod.z.literal("waitForSelector"),
	selector: CssSelectorSchema,
	timeout: zod.z.number().optional()
});
const waitForSelectorCommand = {
	name: "waitForSelector",
	schema: schema$2,
	parseShorthand({ modifier, rest }) {
		if (!rest) throw new Error("waitForSelector requires a selector");
		return modifier === void 0 ? {
			action: "waitForSelector",
			selector: rest
		} : {
			action: "waitForSelector",
			selector: rest,
			timeout: toNumber("waitForSelector timeout", modifier)
		};
	},
	execute(page, a) {
		return page.waitForSelector(a.selector.value, { timeout: a.timeout ?? DEFAULT_TIMEOUT_MS });
	}
};

//#endregion
//#region src/helper/scrape/actions/commands/hover.ts
const schema$1 = zod.z.object({
	action: zod.z.literal("hover"),
	selector: CssSelectorSchema
});
const hoverCommand = {
	name: "hover",
	schema: schema$1,
	parseShorthand: (parts) => parseSelectorOnly("hover", parts),
	execute(page, a) {
		return page.hover(a.selector.value);
	}
};

//#endregion
//#region src/helper/scrape/actions/commands/scroll.ts
const schema = zod.z.object({
	action: zod.z.literal("scroll"),
	selector: CssSelectorSchema
});
const scrollCommand = {
	name: "scroll",
	schema,
	parseShorthand: (parts) => parseSelectorOnly("scroll", parts),
	execute(page, a) {
		return page.$eval(a.selector.value, (el) => el.scrollIntoView({
			behavior: "instant",
			block: "center"
		}));
	}
};

//#endregion
//#region src/helper/scrape/actions/registry.ts
/**
* The single source of truth for supported actions. Everything else — the
* validation schema, shorthand parsing and execution — is derived from this list,
* so extending the surface is a one-line registration (plus the command file).
*/
const COMMANDS = [
	clickCommand,
	typeCommand,
	selectCommand,
	waitForTimeoutCommand,
	waitForSelectorCommand,
	hoverCommand,
	scrollCommand
];
/**
* Discriminated union over every command's object schema. The members are erased
* to generic `ZodObject` (the commands hold them as `z.ZodType<…>`), so the result
* is re-asserted to `z.ZodType<Action>` — runtime validation is unaffected.
*/
const ActionSchema = zod.z.discriminatedUnion("action", COMMANDS.map((c) => c.schema));
const BY_NAME = new Map(COMMANDS.map((c) => [c.name, c]));
/** Look up the command for an action verb, or `undefined` if none is registered. */
function commandFor(name) {
	return BY_NAME.get(name);
}

//#endregion
//#region src/helper/scrape/actions/index.ts
/**
* Parse the one-line string shorthand (e.g. `"type:120 #q hello world"`) into the
* canonical action object. Splits off the leading verb (and optional `:modifier`)
* then defers to the matching command. Field-level validation is left to the
* schema; this only throws on shorthand-shape errors (unknown verb, missing parts).
*/
function parseActionString(input) {
	const trimmed = input.trim();
	if (trimmed === "") throw new Error("empty action string");
	const firstSpace = trimmed.search(/\s/);
	const head = firstSpace === -1 ? trimmed : trimmed.slice(0, firstSpace);
	const rest = firstSpace === -1 ? "" : trimmed.slice(firstSpace + 1).trimStart();
	const colon = head.indexOf(":");
	const verb = colon === -1 ? head : head.slice(0, colon);
	const modifier = colon === -1 ? void 0 : head.slice(colon + 1);
	const command = commandFor(verb);
	if (!command) throw new Error(`unknown action "${verb}"`);
	return command.parseShorthand({
		modifier,
		rest
	});
}
function formatPath(path) {
	return path.reduce((acc, key) => typeof key === "number" ? `${acc}[${key}]` : `${acc}.${String(key)}`, "");
}
function validateActions(actions) {
	const parsed = actions.map((a, i) => {
		if (typeof a !== "string") return a;
		try {
			return parseActionString(a);
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			throw new Error(`actions[${i}]: ${msg}`, { cause: err });
		}
	});
	const result = zod.z.array(ActionSchema).safeParse(parsed);
	if (!result.success) {
		const issues = result.error.issues.map((issue) => `actions${formatPath(issue.path)}: ${issue.message}`).join("; ");
		throw new Error(issues);
	}
	return result.data;
}
async function runActions(page, actions) {
	for (const [i, a] of actions.entries()) try {
		const command = commandFor(a.action);
		if (!command) throw new Error(`no command registered for "${a.action}"`);
		await command.execute(page, a);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		throw new Error(`action[${i}] ${a.action}: ${msg}`, { cause: err });
	}
}

//#endregion
//#region src/helper/scrape.ts
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36";
async function scrape(url, options = {}) {
	const filters = options.networkCapture ?? [];
	validateFilters(filters);
	const actions = validateActions(options.actions ?? []);
	const browser = await launch();
	try {
		const [page] = await browser.pages();
		await page.setViewport({
			width: 1024,
			height: 880
		});
		await page.setUserAgent(USER_AGENT);
		const captured = attachNetworkCapture(page, filters);
		await page.goto(url, {
			waitUntil: "networkidle2",
			timeout: 0
		});
		await runActions(page, actions);
		const result = {
			networkCapture: captured,
			browserHtml: await page.content()
		};
		if (options.screenshot === true) result.screenshot = await page.screenshot({
			encoding: "base64",
			type: "png"
		});
		return result;
	} finally {
		await browser.close();
	}
}

//#endregion
Object.defineProperty(exports, '__toESM', {
  enumerable: true,
  get: function () {
    return __toESM;
  }
});
Object.defineProperty(exports, 'getContentForAddress', {
  enumerable: true,
  get: function () {
    return getContentForAddress;
  }
});
Object.defineProperty(exports, 'launch', {
  enumerable: true,
  get: function () {
    return launch;
  }
});
Object.defineProperty(exports, 'openPage', {
  enumerable: true,
  get: function () {
    return openPage;
  }
});
Object.defineProperty(exports, 'scrape', {
  enumerable: true,
  get: function () {
    return scrape;
  }
});
//# sourceMappingURL=scrape-DqhiPZak.js.map