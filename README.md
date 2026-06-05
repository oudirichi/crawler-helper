# Crawler helper
This project is exporting somes utilities functions to simplify crawling.

## CLI: `domscrape`

Visit a URL with a headless Chromium and emit a JSON document on stdout containing
an optional screenshot and any captured network responses. Designed to be composed
in shell pipelines.

### Install / run

After building locally:

```bash
npm install
npm run build
node dist/cli.js visit https://example.com --data '{"screenshot":true}'
```

Once published, the `bin` is exposed as `domscrape`:

```bash
npx domscrape visit https://example.com --data @input.json
```

### Usage

```
domscrape visit <url> [-d|--data <value>]
```

`--data` accepts three forms (curl-style):

- `@path/to/file.json` — read JSON from a file
- `@-` — read JSON from stdin
- inline JSON string, e.g. `'{"screenshot":true}'`

If `--data` is omitted, the page is just loaded and an empty result is emitted.

### Input schema

```json
{
  "screenshot": true,
  "networkCapture": [
    {
      "filterType": "url",
      "matchType": "contains",
      "value": "/api/",
      "httpResponseBody": true
    }
  ]
}
```

- `screenshot` (boolean, optional) — when `true`, capture a viewport PNG.
- `networkCapture` (array, optional) — list of filters. A response is captured if
  it matches **any** filter.
  - `filterType` — currently only `"url"` is supported.
  - `matchType` — currently only `"contains"` is supported.
  - `value` — substring to match against the response URL.
  - `httpResponseBody` (boolean, optional) — when `true`, include the response body
    in the output for matching entries.

Unknown `filterType` / `matchType` values cause the command to exit with status 1
and an explanatory error on stderr.

### Actions

An optional `actions` array runs sequentially after the page loads and before the
screenshot is captured. The JSON shape mirrors the [Zyte API actions](https://docs.zyte.com/zyte-api/usage/reference.html#operation/extract/request/actions) spec.

```json
{
  "actions": [
    { "action": "select",          "selector": "#author",                                                           "values": ["Albert Einstein"] },
    { "action": "waitForSelector", "selector": { "type": "css", "value": "[value='world']", "state": "attached" } },
    { "action": "type",            "selector": "#q",                                                                "text": "hello", "delay": 25 },
    { "action": "click",           "selector": "[type='submit']",                                                   "button": "left" },
    { "action": "hover",           "selector": ".tooltip-target" },
    { "action": "scroll",          "selector": "#footer" },
    { "action": "waitForTimeout",  "timeout": 2 }
  ]
}
```

| action              | required fields              | optional fields                                      |
|---------------------|------------------------------|------------------------------------------------------|
| `click`             | `selector`                   | `button` (`"left"` \| `"right"` \| `"middle"`), `delay` (ms) |
| `type`              | `selector`, `text`           | `delay` (ms)                                         |
| `select`            | `selector`, `values`         | —                                                    |
| `waitForSelector`   | `selector`                   | `timeout` (ms, default 30 000)                       |
| `waitForTimeout`    | `timeout` (seconds)          | —                                                    |
| `hover`             | `selector`                   | —                                                    |
| `scroll`            | `selector`                   | —                                                    |

**Selector**: either a plain CSS string `"#my-id"` or the full object
`{ "type": "css", "value": "<css-selector>" }`. Only `type: "css"` is supported.
`waitForSelector` additionally accepts `"state": "attached"` on the object form.

#### String shorthand

Each action may instead be written as a single string `"<verb>[:<number>] <rest>"`.
String and object forms can be mixed freely in the same `actions` array. The example
above is equivalent to:

```json
{
  "actions": [
    "select #author Albert Einstein",
    "waitForSelector [value='world']",
    "type:25 #q hello",
    "click [type='submit']",
    "hover .tooltip-target",
    "scroll #footer",
    "waitForTimeout:2"
  ]
}
```

| shorthand                       | rest             | `:N` modifier   | equivalent to                                          |
|---------------------------------|------------------|-----------------|--------------------------------------------------------|
| `click <selector>`              | selector         | `delay` (ms)    | `{ "action": "click", "selector", "delay"? }`          |
| `hover <selector>`              | selector         | —               | `{ "action": "hover", "selector" }`                    |
| `scroll <selector>`             | selector         | —               | `{ "action": "scroll", "selector" }`                   |
| `waitForSelector <selector>`    | selector         | `timeout` (ms)  | `{ "action": "waitForSelector", "selector", "timeout"? }` |
| `type <selector> <text>`        | selector + text  | `delay` (ms)    | `{ "action": "type", "selector", "text", "delay"? }`   |
| `select <selector> <value>`     | selector + value | —               | `{ "action": "select", "selector", "values": [value] }` |
| `waitForTimeout <n>`            | seconds (or `:N`)| —               | `{ "action": "waitForTimeout", "timeout": n }`         |

For `type` and `select`, the **first whitespace-delimited token is the selector** and
the remainder is the text/value. Use the object form for anything the shorthand can't
express: selectors containing spaces (e.g. `#form input[name=q]`), `click`'s `button`,
`select` with multiple values, or `waitForSelector`'s `"state": "attached"`.

**Failure policy**: the first action that errors stops execution immediately. The process exits 1
and writes `Error: action[<i>] <action>: <message>` to stderr. Network capture (if configured)
still reports any responses collected up to that point. After clicking a submit button that
triggers navigation, add an explicit `waitForSelector` for a post-navigation element rather than
relying on implicit waiting.

### Output schema

```json
{
  "browserHtml": "<!doctype html>...",
  "screenshot": "iVBORw0KGgoAAAANSUhEUgAA...",
  "networkCapture": [
    {
      "url": "https://example.com/api/test",
      "status": 200,
      "httpResponseBody": "eyJ0ZXN0IjoidmFsdWUifQ=="
    }
  ]
}
```

- `browserHtml` — always present. Full HTML of the page as rendered by the browser
  (post-JavaScript, after all actions have run).
- `screenshot` — base64-encoded PNG of the viewport (1024×880). Omitted entirely
  when `screenshot` was not requested.
- `networkCapture` — always an array (possibly empty). `httpResponseBody` is only
  present when a matching filter requested it and the body was read successfully.
  The value is base64-encoded, preserving binary responses faithfully.

### Worked example

`input.json`:

```json
{
  "screenshot": true,
  "networkCapture": [
    { "filterType": "url", "matchType": "contains", "value": "/api/", "httpResponseBody": true }
  ]
}
```

```bash
domscrape visit https://example.com --data @input.json
```

Stdout (truncated):

```json
{
  "browserHtml": "<!doctype html>...",
  "screenshot": "iVBORw0KGgoAAAANSUhEUgAA...",
  "networkCapture": [
    { "url": "https://example.com/api/test", "status": 200, "httpResponseBody": "eyJ0ZXN0IjoidmFsdWUifQ==" }
  ]
}
```

### Decode screenshot
```bash
... | jq --raw-output .screenshot | base64 --decode > screenshot.png
```

### Decode a network response body
```bash
... | jq --raw-output '.networkCapture[0].httpResponseBody' | base64 --decode
```

### Notes

- Response bodies that cannot be read (binary streams, cancelled requests, etc.)
  are skipped; the URL/status entry is still emitted and a one-line warning is
  written to stderr.
- The Chromium executable path can be overridden with the `PUPPETEER_EXECUTABLE_PATH`
  environment variable (defaults to `/usr/bin/chromium`).
- Errors (invalid URL, unreadable `--data` file, malformed JSON, unsupported filter)
  exit with status 1 and write `Error: <message>` to stderr.
