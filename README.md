# Breakpoint Transfer Plugin

[![npm version](https://img.shields.io/npm/v/breakpoint-transfer-plugin.svg)](https://www.npmjs.com/package/breakpoint-transfer-plugin)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)

---

## Introduction

`breakpoint-transfer-plugin` is a JavaScript/TypeScript SDK plugin for implementing file breakpoint continuation. It is primarily designed for large file upload scenarios, supporting breakpoint continuation, quick upload, concurrent control, progress tracking, and more.

### Project Overview

This project consists of **frontend** and **backend** parts:

- **Frontend**: This documentation describes `breakpoint-transfer-plugin`, handling file chunking, progress tracking, upload control, and other frontend logic
- **Backend**: Handles file receiving, chunk merging, persistent storage, and other server-side logic

**Backend Documentation**:
- International: https://github.com/lvdaxianer/spring-boot-launcher/tree/main/breakpoint-transfer-launcher
- China: https://gitee.com/breakpoint-transfer-launcher/spring-boot-launcher/tree/main/breakpoint-transfer-launcher

## Key Features

- **Breakpoint Continuation**: Supports resuming uploads from the last break point after network interruption
- **Quick Upload (Instant Transmission)**: Quickly checks if a file has been uploaded via file hash to avoid duplicate uploads
- **Concurrent Control**: Supports configuring the number of simultaneous file uploads
- **Progress Tracking**: Real-time upload progress display with multiple status indicators
- **Multi-language Support**: Supports Chinese, English, and Japanese
- **Persistent Storage**: Uses IndexedDB to persist upload progress, supporting recovery after page refresh
- **Web Worker**: Supports using Web Workers to calculate file hash without blocking the main thread

## Installation

```bash
npm install breakpoint-transfer-plugin
# or
pnpm add breakpoint-transfer-plugin
```

## Quick Start

```typescript
import { uploadHandler } from "breakpoint-transfer-plugin";

// 1. Configure upload parameters
uploadHandler.config({
  // Request interface configuration (required)
  req: {
    // Chunk upload
    sectionUploadReq: async (calculationHashCode, chunkFileName, formData) => {
      const res = await fetch(
        `/breakpoint/transfer/upload/section/${calculationHashCode}/${chunkFileName}`,
        {
          method: "POST",
          body: formData,
        },
      );
      return res.json();
    },
    // Merge chunks
    mergeUploadReq: async (calculationHashCode, fileName) => {
      const res = await fetch(
        `/breakpoint/transfer/upload/merge/${calculationHashCode}/${fileName}`,
        { method: "GET" },
      );
      return res.json();
    },
    // Check if file exists (instant upload verification)
    verifyFileExistReq: async (calculationHashName) => {
      const res = await fetch(
        `/breakpoint/transfer/upload/verify/${calculationHashName}`,
        { method: "GET" },
      );
      return res.json();
    },
    // List uploaded chunks
    listFilesReq: async (calculationHashCode) => {
      const res = await fetch(
        `/breakpoint/transfer/upload/list/${calculationHashCode}`,
        { method: "GET" },
      );
      return res.json();
    },
  },
  // Maximum retry attempts (default: 3)
  maxRetryTimes: 3,
  // Concurrent limit (default: 2)
  concurrentLimit: 2,
  // Base network speed Bytes/s (default: 1024)
  baseNetworkSpeed: 1024,
  // Enable persistence (default: false)
  persist: true,
  // Language setting (default: ZH)
  language: "zh",
});

// 2. Start uploading file
const fileInput = document.getElementById("fileInput") as HTMLInputElement;
fileInput.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    const [baseDir, fileName] = await uploadHandler(file);
    console.log("Upload successful:", baseDir, fileName);
  } catch (error) {
    console.error("Upload failed:", error);
  }
});
```

## API Reference

### Upload Configuration `uploadHandler.config(config)`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| req | Object | Yes | - | Request interface configuration |
| req.verifyFileExistReq | Function | Yes | - | Instant upload verification API |
| req.sectionUploadReq | Function | Yes | - | Chunk upload API |
| req.mergeUploadReq | Function | Yes | - | Chunk merge API |
| req.listFilesReq | Function | Yes | - | List uploaded chunks API |
| maxRetryTimes | Number | No | 3 | Maximum retry attempts |
| concurrentLimit | Number | No | 2 | Concurrent upload limit |
| baseNetworkSpeed | Number | No | 1024 | Base network speed Bytes/s |
| persist | Boolean | No | false | Enable persistence |
| language | String | No | "zh" | Language setting |

### Upload Status `UploadProgressState`

| Status | Description |
|--------|-------------|
| Prepare | In preparation |
| HashCalculationWaiting | Calculating hash |
| Waiting | Waiting in queue |
| Uploading | Uploading |
| Merge | Merging files |
| Done | Upload complete |
| QuickUpload | Instant upload successful |
| BreakPointUpload | Breakpoint continuation |
| Pause | Paused |
| PauseRetry | Pause retry |
| Retry | Retrying |
| RetryFailed | Retry failed |
| Canceled | Canceled |
| RequestError | Request error |
| NetworkDisconnected | Network disconnected |
| RefreshRetry | Refresh retry |

### Language Setting `uploadHandler.lng(language)`

Supported languages:
- `zh` - Chinese
- `en` - English
- `ja_JP` - Japanese

## Project Structure

```
src/
├── core/
│   ├── constant.ts      # Constant definitions
│   ├── types/           # Type definitions
│   │   └── index.ts
│   ├── tools.ts         # Utility functions
│   ├── subscriber.ts    # Event subscription
│   ├── store.ts         # Storage management
│   ├── variable.ts      # Global variables
│   ├── Logger.ts        # Logging utility
│   ├── PLimit.ts        # Concurrency control
│   ├── language.ts       # Multi-language
│   └── index.ts         # Core exports
├── index.ts             # Main entry
└──
```

## Dependencies

- `i18next` - Multi-language support
- `jsmethod-extra` - JavaScript utility library
- `localforage` - IndexedDB wrapper

## Build

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Lint
pnpm lint
```

---

## License

ISC
