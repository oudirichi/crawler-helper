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

### Output schema

```json
{
  "screenshot": "iVBORw0KGgoAAAANSUhEUgAA...",
  "networkCapture": [
    {
      "url": "https://example.com/api/test",
      "status": 200,
      "httpResponseBody": "..."
    }
  ]
}
```

- `screenshot` — base64-encoded PNG of the viewport (1024×880). Omitted entirely
  when `screenshot` was not requested.
- `networkCapture` — always an array (possibly empty). `httpResponseBody` is only
  present when a matching filter requested it and the body was read successfully.

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
  "screenshot": "iVBORw0KGgoAAAANSUhEUgAA...",
  "networkCapture": [
    { "url": "https://example.com/api/test", "status": 200, "httpResponseBody": "..." }
  ]
}
```

### Notes

- Response bodies that cannot be read (binary streams, cancelled requests, etc.)
  are skipped; the URL/status entry is still emitted and a one-line warning is
  written to stderr.
- The Chromium executable path can be overridden with the `PUPPETEER_EXECUTABLE_PATH`
  environment variable (defaults to `/usr/bin/chromium`).
- Errors (invalid URL, unreadable `--data` file, malformed JSON, unsupported filter)
  exit with status 1 and write `Error: <message>` to stderr.
