#!/usr/bin/env node
import { scrape } from "./scrape-B1jle9Jo.mjs";
import { readFileSync } from "node:fs";
import { Command } from "commander";

//#region src/bin/cli.ts
async function readStdin() {
	const chunks = [];
	for await (const chunk of process.stdin) chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
	return Buffer.concat(chunks).toString("utf8");
}
async function resolveDataArg(value) {
	if (value === void 0 || value === "") return {};
	let raw;
	if (value === "@-") raw = await readStdin();
	else if (value.startsWith("@")) {
		const path = value.slice(1);
		try {
			raw = readFileSync(path, "utf8");
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			throw new Error(`cannot read --data file "${path}": ${message}`, { cause: err });
		}
	} else raw = value;
	try {
		return JSON.parse(raw);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		throw new Error(`invalid --data JSON: ${message}`, { cause: err });
	}
}
function fail(message) {
	process.stderr.write(`Error: ${message}\n`);
	process.exit(1);
}
async function runVisit(url, opts) {
	try {
		new URL(url);
	} catch {
		fail(`invalid URL "${url}"`);
	}
	const options = await resolveDataArg(opts.data);
	const result = await scrape(url, options);
	process.stdout.write(JSON.stringify(result) + "\n");
}
const program = new Command();
program.name("domscrape").description("Visit a page and emit screenshot / network capture as JSON");
program.command("visit <url>").description("Open <url> and capture data per --data spec").option("-d, --data <value>", "JSON spec: inline string, @file path, or @- for stdin").action(async (url, opts) => {
	try {
		await runVisit(url, opts);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		fail(message);
	}
});
program.parseAsync(process.argv).catch((err) => {
	const message = err instanceof Error ? err.message : String(err);
	fail(message);
});

//#endregion
//# sourceMappingURL=cli.mjs.map