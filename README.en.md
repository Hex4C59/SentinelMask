# SentinelMask

[中文](./README.md)

SentinelMask is a browser extension (Manifest V3) that detects and masks sensitive text before users send prompts on web-based LLM chat sites.

## Features

- Unified send gateway `preSendGuard` for keyboard/button/submit/programmatic paths
- Built-in rules: name (weak hint), phone, bank card, email, common API keys
- Risk-based actions: `allow` / `confirm` / `block`
- Local anonymous logs only (no raw user text)
- Options page for rule toggles and log view/clear

## Supported Sites

- `chatgpt.com`
- `chat.openai.com`
- `claude.ai`
- `gemini.google.com`
- `chat.deepseek.com`

## Install for End Users

If you only want to install the extension, go to GitHub Releases and download the packaged asset named `sentinelmask-vX.Y.Z.zip`.
Do not download GitHub's auto-generated `Source code (zip)` or `Source code (tar.gz)` assets. They are source archives and cannot be installed as a browser extension directly.

### Chrome / Edge

1. Download `sentinelmask-vX.Y.Z.zip`
2. Unzip the archive
3. Open `chrome://extensions` or `edge://extensions`
4. Enable Developer Mode
5. Click "Load unpacked"
6. Select the unzipped directory

### Firefox (Temporary Add-on)

1. Download and unzip `sentinelmask-vX.Y.Z.zip`
2. Open `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select `manifest.json` inside the unzipped directory

## Developer Quick Start

### Requirements

- Node.js 20+
- npm 10+

### Install

```bash
npm ci
```

### Dev and Build

```bash
# watch mode
npm run dev

# production build (outputs to dist/)
npm run build

# type check + lint + tests
npx tsc --noEmit
npm run lint
npm run test
```

### Package Extension Zip

```bash
npm run package
```

Example output:

- `artifacts/sentinelmask-v0.2.0.zip`

## Load the Extension Locally

### Chrome / Edge

1. Open `chrome://extensions` or `edge://extensions`
2. Enable Developer Mode
3. Click "Load unpacked"
4. Select the `dist/` directory

### Firefox (Temporary Add-on)

1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select `dist/manifest.json`

## Project Layout

```text
content/     # site adapters, interception, gateway integration
background/  # service worker, settings storage, log aggregation
core/        # rules, masking, risk decision, input abstraction
options/     # extension options UI
shared/      # shared types, error codes, message contracts
tests/       # unit tests (and future integration tests)
scripts/     # build/dev/package scripts
```

## Privacy & Security

- Local-first processing by default, no raw prompt upload
- Logs contain only anonymized metadata (type/count/time/action/source)
- Least-privilege permissions, no `<all_urls>`
