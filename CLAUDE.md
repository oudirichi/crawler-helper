# crawler-helper — project context for Claude Code

## Project shape

A TypeScript library + CLI for Puppeteer-based crawling.

- **Library entry**: `src/index.ts` re-exports `src/helper/puppeteer.ts` (low-level `launch`, `openPage`) and `src/helper/scrape.ts` (high-level `scrape(url, options)`).
- **CLI binary** (`domscrape`): `src/bin/cli.ts` — Commander-based; single `visit <url>` subcommand; all schema/validation lives in the helper, not in the CLI.
- **Build**: `tsdown` (config in `tsdown.config.ts`); emits CJS + ESM to `dist/`. The CLI JS lands at `dist/cli.js`.
- **Runtime**: Node 20, Chromium via `PUPPETEER_EXECUTABLE_PATH` (default `/usr/bin/chromium`).

## External reference: Zyte API actions

We intentionally mirror Zyte's `actions[]` JSON shape so inputs are portable between `domscrape` and the Zyte API.

- Full spec: https://docs.zyte.com/zyte-api/usage/reference.html#operation/extract/request/actions
- Browser automation guide: https://docs.zyte.com/zyte-api/usage/browser.html
- Runnable examples: https://docs.zyte.com/zyte-api/ide/examples/index.html

## Currently supported actions

| action            | key fields                              | puppeteer call                                       |
|-------------------|-----------------------------------------|------------------------------------------------------|
| `click`           | `selector`, `button?`, `delay?`         | `page.click(css, { button, delay })`                 |
| `type`            | `selector`, `text`, `delay?`            | `page.type(css, text, { delay })`                    |
| `select`          | `selector`, `values`                    | `page.select(css, ...values)`                        |
| `waitForSelector` | `selector`, `timeout?` (default 30 000) | `page.waitForSelector(css, { timeout })`             |
| `hover`           | `selector`                              | `page.hover(css)`                                    |
| `scroll`          | `selector`                              | `page.$eval(css, el => el.scrollIntoView(...))`      |

Selector object: `{ type: "css", value: "..." }`. `waitForSelector` additionally accepts
`state: "attached"` on the selector (attached = element exists in DOM, which is puppeteer's
default wait behaviour).

## Zyte actions NOT yet implemented

When extending, keep these Zyte names/shapes to preserve portability:

- `waitForRequest` — wait until a request URL matches
- `waitForResponse` — wait until a response URL matches
- `waitForNavigation` — wait for a page navigation event (useful after `click` on links)
- `waitForTimeout` — unconditional sleep (`{ "action": "waitForTimeout", "timeout": 500 }`)
- `evaluate` — run arbitrary JS in the page context (`{ "action": "evaluate", "source": "..." }`)
- `reload` — reload the current page
- `goto` — navigate to a new URL mid-sequence (`{ "action": "goto", "url": "..." }`)
- `goBack` / `goForward` — browser history navigation
- `dispatchEvent` — fire a synthetic DOM event
- `keyboard` — low-level key press/release
- `setViewport` — resize the viewport mid-sequence
- `screenshot` (action form) — capture a screenshot at a specific point in the action sequence

## Known surface restrictions (intentional for now)

- **Selectors**: CSS only. XPath (`type: "xpath"`) is not supported. When adding it, note that puppeteer's `waitForXPath` is deprecated; prefer `waitForSelector('xpath/...')` or `page.$x`.
- **`waitForSelector` states**: only `attached`. Zyte also defines `visible`, `hidden`, `detached`. `visible`/`hidden` map to puppeteer's `{ visible: true }` / `{ hidden: true }` options. `detached` requires `waitForFunction` or polling.
- **Failure policy**: fail-fast only. No per-action `onError` field. First failing action exits 1.
- **`waitForNavigation` after `click`**: not automatic. Callers must chain an explicit `waitForSelector` for a post-navigation element.

## Design decisions worth preserving

- All input validation (`validateFilters`, `validateActions`) runs up-front in `scrape()` before the browser launches — cheap errors fail fast without consuming a Chrome process.
- The network listener (`page.on('response', ...)`) is attached before `page.goto()` and stays active during actions, so XHRs triggered by `click → submit → fetch` are captured.
- The CLI (`src/bin/cli.ts`) is a thin pass-through: it resolves `--data` to a `ScrapeOptions` object and calls `scrape()`. No schema knowledge in the CLI.
- The library exports all public types from `src/index.ts` via `src/helper/scrape.ts` so consumers can type their own inputs/outputs.

## Where to look when extending

| What you want to change          | Where to look                       |
|----------------------------------|-------------------------------------|
| Add a new action type            | `src/helper/scrape.ts` — `Action` union, `SUPPORTED_ACTIONS`, `validateActions`, `runActions` |
| Add a new network filter type    | `src/helper/scrape.ts` — `SUPPORTED_FILTER_TYPES`, `SUPPORTED_MATCH_TYPES`, `validateFilters`, `filterMatches` |
| Add a new CLI flag/subcommand    | `src/bin/cli.ts`                    |
| Change browser launch behaviour  | `src/helper/puppeteer.ts`           |
| Update user-facing docs          | `README.md` (keep in sync with code) |
