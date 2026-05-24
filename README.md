# Breakpoint Transfer Plugin

[![npm version](https://img.shields.io/npm/v/breakpoint-transfer-plugin.svg)](https://www.npmjs.com/package/breakpoint-transfer-plugin)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)
[![GitHub stars](https://img.shields.io/github/stars/lvdaxianer/breakpoint-transfer-plugin)](https://github.com/lvdaxianer/breakpoint-transfer-plugin)

[English](README.md) | [中文](README.zh-CN.md)

`breakpoint-transfer-plugin` is the frontend SDK in the Breakpoint Transfer suite. It is designed to work with the companion backend starter `breakpoint-transfer-spring-boot3-starter`, giving you a complete resumable upload solution out of the box.

## Suite Overview

This solution is composed of two repositories:

- Frontend SDK: `breakpoint-transfer-plugin`
- Backend starter: `breakpoint-transfer-spring-boot3-starter`
- Vue test project: `breakpoint-transfer-launcher-page`

Recommended backend documentation:

- GitHub: [spring-boot-launcher / breakpoint-transfer-launcher](https://github.com/lvdaxianer/spring-boot-launcher/tree/main/breakpoint-transfer-launcher)
- Gitee: [spring-boot-launcher / breakpoint-transfer-launcher](https://gitee.com/breakpoint-transfer-launcher/spring-boot-launcher/tree/main/breakpoint-transfer-launcher)
- Gitee test project: [breakpoint-transfer-launcher-page](https://gitee.com/breakpoint-transfer-launcher/breakpoint-transfer-launcher-page)

If you are starting from the backend side, make sure to also install this frontend plugin for chunking, progress tracking, retry, and resume behavior.

## Features

- Resumable uploads with chunk retry
- Quick upload verification based on file hash
- Concurrent upload control
- Upload progress and status tracking
- IndexedDB persistence for refresh recovery
- Web Worker based hash calculation
- Built-in i18n: Chinese, English, Japanese

## Compatibility

| Feature | HTTP | HTTPS | localhost |
| --- | :---: | :---: | :---: |
| Chunk upload | ✅ | ✅ | ✅ |
| Quick upload | ❌ | ✅ | ✅ |
| Breakpoint resume | ❌ | ✅ | ✅ |
| Web Worker hash | ❌ | ✅ | ✅ |
| Retry / pause / resume | ✅ | ✅ | ✅ |
| IndexedDB persistence | ✅ | ✅ | ✅ |

Notes:

- Quick upload, breakpoint resume, and Worker-based hashing require a secure context: `https` or `localhost`
- Other upload features can still work over plain `http`

## Installation

```bash
npm install breakpoint-transfer-plugin
# or
pnpm add breakpoint-transfer-plugin
```

## Recommended Backend Pairing

The plugin is designed around the following backend route contract by default:

- `POST /breakpoint/transfer/upload/section/{baseDir}/{filename-index}`
- `GET /breakpoint/transfer/upload/list/{baseDir}`
- `GET /breakpoint/transfer/upload/verify/{filename}`
- `GET /breakpoint/transfer/upload/merge/{baseDir}/{filename}`

This matches the backend starter:

- Artifact: `io.github.lvdaxianer:breakpoint-transfer-spring-boot3-starter`
- Backend README: [spring-boot-launcher / breakpoint-transfer-launcher](https://github.com/lvdaxianer/spring-boot-launcher/tree/main/breakpoint-transfer-launcher)

## Quick Start

### 1. Configure the backend starter

Use the backend starter with its default route prefix:

```yaml
io:
  lvdaxianer:
    upload:
      file:
        context-prefix: /breakpoint/transfer
```

### 2. Configure the frontend plugin

```typescript
import { uploadHandler } from "breakpoint-transfer-plugin";

uploadHandler.config({
  req: {
    sectionUploadReq: async (baseDir, chunkFileName, formData) => {
      const response = await fetch(
        `/breakpoint/transfer/upload/section/${baseDir}/${chunkFileName}`,
        {
          method: "POST",
          body: formData,
        },
      );
      return response.json();
    },
    mergeUploadReq: async (baseDir, fileName) => {
      const response = await fetch(
        `/breakpoint/transfer/upload/merge/${baseDir}/${fileName}`,
        { method: "GET" },
      );
      return response.json();
    },
    verifyFileExistReq: async (storedFileName) => {
      const response = await fetch(
        `/breakpoint/transfer/upload/verify/${storedFileName}`,
        { method: "GET" },
      );
      return response.json();
    },
    listFilesReq: async (baseDir) => {
      const response = await fetch(
        `/breakpoint/transfer/upload/list/${baseDir}`,
        { method: "GET" },
      );
      return response.json();
    },
  },
  maxRetryTimes: 3,
  concurrentLimit: 2,
  baseNetworkSpeed: 1024,
  persist: true,
  language: "en",
});
```

### 2.1 Configure `calculateNameWorker.js`

`calculateNameWorker.js` is the companion Web Worker script used by this plugin. It is responsible for calculating the file hash in a separate thread and producing the stable file identifier used during upload.

It mainly helps with these things:

- preventing large-file hash calculation from blocking the main UI thread
- generating a stable file name for quick upload checks, usually `{hash}.{ext}`
- generating a stable `baseDir` / file identifier for resumable upload and refresh recovery

If this file is not introduced correctly, the plugin can still work, but it will fall back to a `MessageChannel` compatibility mode:

- normal chunk upload still works
- quick upload capability may be degraded
- parts of the resumable upload experience may be weaker
- large-file UI responsiveness is not as stable as in Worker mode

If you want to enable Web Worker based hash calculation, also publish `doc/calculateNameWorker.js` as a frontend static asset and declare it before initialization:

```html
<script>
  window.uploadJdk = {
    publicPath: "/your-static-assets-path",
  };
</script>
<script src="/your-static-assets-path/calculateNameWorker.js"></script>
```

If this file is not introduced, the plugin will automatically fall back to a `MessageChannel` compatibility mode. Basic upload still works, but quick upload and part of the resumable experience may be degraded.

If you are not sure how to configure it, refer to the test project directly:

- Repository: [breakpoint-transfer-launcher-page](https://gitee.com/breakpoint-transfer-launcher/breakpoint-transfer-launcher-page)

Recommended places to check:

- how `calculateNameWorker.js` is placed in the static asset directory
- how `window.uploadJdk.publicPath` is declared before plugin initialization
- how the plugin is used in `src/views/Test/index.vue`
- how upload state is consumed in `src/hooks/useBigFileUploadForVue.ts`

You can treat that test project as a full integration example, not just a button demo. It shows how the Worker, upload status, progress bar, pause, and cancel flow are wired together.

### 3. Start uploading

```typescript
const fileInput = document.getElementById("fileInput") as HTMLInputElement;

fileInput.addEventListener("change", async (event) => {
  const file = event.target instanceof HTMLInputElement
    ? event.target.files?.[0]
    : undefined;
  if (!file) return;

  try {
    const [storedFileName, originalFileName] = await uploadHandler(file);
    console.log("upload done", { storedFileName, originalFileName });
  } catch (error) {
    console.error("upload failed", error);
  }
});
```

Return value of `uploadHandler(file)`:

- `storedFileName`: the file name finally stored by the backend, usually `{hash}.{ext}`
- `originalFileName`: the original file name from the browser

## End-to-End Flow

The recommended integration flow is:

1. User selects a file in the browser
2. The plugin calculates a stable file hash and uses it as `baseDir`
3. The plugin derives `storedFileName` from that hash and calls `verify`
4. The plugin calls `list` to resume from uploaded chunks
5. The plugin uploads missing chunks through `section`
6. The plugin calls `merge`
7. The backend stores the final file in `public/{storedFileName}`

## API Reference

### `uploadHandler.config(config)`

| Field | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `req` | `object` | Yes | - | Request adapter collection |
| `req.verifyFileExistReq` | `function` | Yes | - | Checks whether `storedFileName` already exists |
| `req.sectionUploadReq` | `function` | Yes | - | Uploads one chunk |
| `req.mergeUploadReq` | `function` | Yes | - | Triggers backend merge |
| `req.listFilesReq` | `function` | Yes | - | Returns uploaded chunk count and consumed size |
| `maxRetryTimes` | `number` | No | `3` | Max retry count |
| `concurrentLimit` | `number` | No | `2` | Max concurrent uploads |
| `baseNetworkSpeed` | `number` | No | `1024` | Base network speed in bytes per second |
| `persist` | `boolean` | No | `false` | Enables IndexedDB persistence |
| `language` | `zh \| en \| ja_JP` | No | `zh` | UI language |
| `maxHashNameCount` | `number` | No | internal default | Max cached hash entries |

### Backend Response Contract

The plugin accepts backend responses in this shape:

```json
{
  "success": true,
  "data": true,
  "code": "200",
  "message": null
}
```

Notes:

- `code` can be either `"200"` or `200`
- when `success` is absent, the plugin falls back to checking `code`
- backend error messages may come from server-side exceptions directly

### Upload States

| State | Meaning |
| --- | --- |
| `Prepare` | Preparing upload |
| `HashCalculationWaiting` | Calculating file hash |
| `WaitAddQueue` | Waiting to enter queue |
| `Waiting` | Waiting for available concurrency slot |
| `Uploading` | Uploading chunks |
| `Merge` | Waiting for backend merge |
| `Done` | Upload complete |
| `QuickUpload` | File already exists on server |
| `BreakPointUpload` | Resuming from uploaded chunks |
| `OtherUploading` | Same file is already being uploaded |
| `Pause` | Paused |
| `PauseRetry` | Pause-retry state |
| `Retry` | Retrying |
| `RetryFailed` | Retry exhausted |
| `Canceled` | Upload canceled |
| `RequestError` | Backend request failed |
| `NetworkDisconnected` | Network interrupted |
| `RefreshRetry` | Recovered after page refresh |

## Vue Hook Example

If you want to see a complete Vue-side integration example for upload state handling, check the test project:

- Repository: [breakpoint-transfer-launcher-page](https://gitee.com/breakpoint-transfer-launcher/breakpoint-transfer-launcher-page)

- `src/hooks/useBigFileUploadForVue.ts`
- `src/views/Test/index.vue`

This Hook mainly demonstrates 3 things:

- how to subscribe to internal upload state updates through `UPLOADING_FILE_SUBSCRIBE_DEFINE`
- how to convert plugin state into reactive UI data such as `progress`, `stateDesc`, `downSize`, and `remainingTime`
- how to actively control upload tasks through `REVERSE_CONTAINER_ACTION`, such as pause and cancel

Key parts in that file:

- `allProgress`: maintains the reactive upload queue and can be bound directly to tables, lists, or progress components
- `Uploading` state: updates the progress percentage and uploaded size
- `BreakPointUpload` state: restores progress display when resumable upload continues from existing chunks
- `Retry` / `RequestError` states: helps display retry counters and error messages
- `cancelProgressHandler` / `pauseProgressHandler`: shows how the page can send reverse control actions back to the plugin

`src/views/Test/index.vue` shows how this Hook is actually used in a page:

- it receives the reactive upload queue and control methods through `const [allProgress, cancelProgressHandler, pauseProgressHandler] = useBigFileUploadForVue()`
- it injects backend request adapters through `uploadHandler.config(...)`
- it triggers upload through `beforeUploadHandler(file)`
- it renders `allProgress` through progress bars, state labels, network speed, and remaining time
- it wires pause and cancel buttons to the Hook methods so the UI can control each upload task

If your page needs to show “how much has been uploaded”, “how much time is left”, or whether the current task is paused, retrying, resumed, or already completed by quick upload, this Hook is a practical reference point.

## Practical Notes

- The plugin uses the calculated hash as the backend `baseDir`
- When paired with this plugin, the merged file name on the backend is usually `{hash}.{ext}`, not the original file name
- If you customize backend `context-prefix`, update all frontend request URLs as well
- If you use a backend other than the Spring Boot starter, keep the same route and response contract

## Development

```bash
pnpm install
pnpm exec tsc --noEmit
pnpm build
```

## Changelog

### v0.1.0

- Added clearer integration documentation for pairing with the backend starter
- Added `calculateNameWorker.js` documentation, static asset setup guidance, and a test project reference
- Added Vue Hook and test page documentation for upload state consumption, progress display, pause, and cancel control
- Fixed same-file waiting queue release behavior in failure scenarios
- Added response contract, Worker hash, and same-file failure flow tests

### v0.0.1

- Initial release
- Added chunk upload, quick upload verification, resumable upload, and upload state tracking
- Added IndexedDB persistence and multi-language support

## License

ISC
