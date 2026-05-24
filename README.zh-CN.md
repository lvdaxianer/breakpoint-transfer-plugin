# Breakpoint Transfer Plugin

[![npm version](https://img.shields.io/npm/v/breakpoint-transfer-plugin.svg)](https://www.npmjs.com/package/breakpoint-transfer-plugin)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)
[![GitHub stars](https://img.shields.io/github/stars/lvdaxianer/breakpoint-transfer-plugin)](https://github.com/lvdaxianer/breakpoint-transfer-plugin)

[中文](README.zh-CN.md) | [English](README.md)

`breakpoint-transfer-plugin` 是 Breakpoint Transfer 方案中的前端 SDK，推荐与配套后端 `breakpoint-transfer-spring-boot3-starter` 一起使用，组合成完整的大文件断点续传方案。

## 套件说明

整套方案由两个仓库组成：

- 前端 SDK：`breakpoint-transfer-plugin`
- 后端 Starter：`breakpoint-transfer-spring-boot3-starter`
- Vue 测试项目：`breakpoint-transfer-launcher-page`

推荐后端文档：

- GitHub: [spring-boot-launcher / breakpoint-transfer-launcher](https://github.com/lvdaxianer/spring-boot-launcher/tree/main/breakpoint-transfer-launcher)
- Gitee: [spring-boot-launcher / breakpoint-transfer-launcher](https://gitee.com/breakpoint-transfer-launcher/spring-boot-launcher/tree/main/breakpoint-transfer-launcher)
- Gitee 测试项目: [breakpoint-transfer-launcher-page](https://gitee.com/breakpoint-transfer-launcher/breakpoint-transfer-launcher-page)

如果你是从后端 Starter 文档进入的，请继续安装这个前端插件，它负责分片、进度、重试、秒传校验和断点续传恢复。

## 核心能力

- 大文件分片上传
- 断点续传与失败重试
- 秒传校验
- 并发上传控制
- 上传进度与状态跟踪
- IndexedDB 持久化恢复
- 基于 Web Worker 的哈希计算
- 内置中英日多语言

## 环境兼容

| 功能 | HTTP | HTTPS | localhost |
| --- | :---: | :---: | :---: |
| 分片上传 | ✅ | ✅ | ✅ |
| 秒传 | ❌ | ✅ | ✅ |
| 断点续传 | ❌ | ✅ | ✅ |
| Worker 哈希计算 | ❌ | ✅ | ✅ |
| 重试 / 暂停 / 恢复 | ✅ | ✅ | ✅ |
| IndexedDB 持久化 | ✅ | ✅ | ✅ |

说明：

- 秒传、断点续传、Worker 哈希依赖安全上下文，即 `https` 或 `localhost`
- 其他基础上传能力在普通 `http` 下也可工作

## 安装

```bash
npm install breakpoint-transfer-plugin
# 或
pnpm add breakpoint-transfer-plugin
```

## 推荐后端搭配

该插件默认围绕以下后端接口契约设计：

- `POST /breakpoint/transfer/upload/section/{baseDir}/{filename-index}`
- `GET /breakpoint/transfer/upload/list/{baseDir}`
- `GET /breakpoint/transfer/upload/verify/{filename}`
- `GET /breakpoint/transfer/upload/merge/{baseDir}/{filename}`

这与配套后端 Starter 完全对应：

- Maven 坐标：`io.github.lvdaxianer:breakpoint-transfer-spring-boot3-starter`
- 后端文档： [spring-boot-launcher / breakpoint-transfer-launcher](https://github.com/lvdaxianer/spring-boot-launcher/tree/main/breakpoint-transfer-launcher)

## 快速开始

### 1. 配置后端 Starter

后端建议使用默认路由前缀：

```yaml
io:
  lvdaxianer:
    upload:
      file:
        context-prefix: /breakpoint/transfer
```

### 2. 配置前端插件

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
  language: "zh",
});
```

### 2.1 配置 `calculateNameWorker.js`

`calculateNameWorker.js` 是插件配套的 Web Worker 脚本，主要负责在独立线程中计算文件哈希，并生成后续上传会用到的文件标识。

它主要解决这几个问题：

- 避免大文件哈希计算阻塞主线程，减少页面卡顿
- 为秒传校验生成稳定的文件名，一般是 `{hash}.{ext}`
- 为断点续传生成稳定的 `baseDir` / 文件标识，方便刷新后继续上传

如果没有正确引入这个文件，插件仍然可以工作，但会退化为 `MessageChannel` 兼容模式：

- 普通分片上传仍可使用
- 秒传能力会受影响
- 部分断点续传体验会变弱
- 大文件场景下的主线程体验不如 Worker 模式稳定

如果你希望启用 Web Worker 计算哈希，请同时把 `doc/calculateNameWorker.js` 发布到前端静态资源目录，并在页面初始化前声明：

```html
<script>
  window.uploadJdk = {
    publicPath: "/你的静态资源目录",
  };
</script>
<script src="/你的静态资源目录/calculateNameWorker.js"></script>
```

如果未引入该文件，插件会自动退化为 `MessageChannel` 兼容模式，基础上传仍可使用，但秒传与部分断点续传体验会受影响。

如果你不确定应该怎么配置，可以直接参考测试项目：

- 仓库地址: [breakpoint-transfer-launcher-page](https://gitee.com/breakpoint-transfer-launcher/breakpoint-transfer-launcher-page)

建议重点看这几个位置：

- `public/` 或静态资源目录里如何放置 `calculateNameWorker.js`
- 页面初始化阶段如何声明 `window.uploadJdk.publicPath`
- `src/views/Test/index.vue` 如何调用插件
- `src/hooks/useBigFileUploadForVue.ts` 如何接收上传状态并驱动页面

可以把这个测试项目当成完整接入样例：它不只是演示上传按钮怎么调，还演示了 Worker、上传状态、进度条、暂停和取消是如何串起来的。

### 3. 发起上传

```typescript
const fileInput = document.getElementById("fileInput") as HTMLInputElement;

fileInput.addEventListener("change", async (event) => {
  const file = event.target instanceof HTMLInputElement
    ? event.target.files?.[0]
    : undefined;
  if (!file) return;

  try {
    const [storedFileName, originalFileName] = await uploadHandler(file);
    console.log("上传完成", { storedFileName, originalFileName });
  } catch (error) {
    console.error("上传失败", error);
  }
});
```

`uploadHandler(file)` 的返回值含义：

- `storedFileName`：后端最终保存的文件名，通常是 `{hash}.{ext}`
- `originalFileName`：浏览器中的原始文件名

## 端到端流程

推荐接入顺序如下：

1. 用户在浏览器中选择文件
2. 插件计算稳定哈希，并把它作为后端 `baseDir`
3. 插件基于该哈希生成 `storedFileName`，再调用 `verify`
4. 插件调用 `list` 获取已上传分片进度
5. 插件仅上传缺失分片到 `section`
6. 插件调用 `merge`
7. 后端把成品文件保存到 `public/{storedFileName}`

## API 参考

### `uploadHandler.config(config)`

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `req` | `object` | 是 | - | 请求适配器集合 |
| `req.verifyFileExistReq` | `function` | 是 | - | 检查 `storedFileName` 对应成品是否已存在 |
| `req.sectionUploadReq` | `function` | 是 | - | 上传单个分片 |
| `req.mergeUploadReq` | `function` | 是 | - | 触发后端合并 |
| `req.listFilesReq` | `function` | 是 | - | 获取已上传分片数量和已消费字节数 |
| `maxRetryTimes` | `number` | 否 | `3` | 最大重试次数 |
| `concurrentLimit` | `number` | 否 | `2` | 最大并发上传数 |
| `baseNetworkSpeed` | `number` | 否 | `1024` | 基础网速，单位字节每秒 |
| `persist` | `boolean` | 否 | `false` | 是否启用 IndexedDB 持久化 |
| `language` | `zh \| en \| ja_JP` | 否 | `zh` | 语言设置 |
| `maxHashNameCount` | `number` | 否 | 内部默认值 | 本地缓存哈希条目上限 |

### 后端响应契约

插件兼容如下结构的响应：

```json
{
  "success": true,
  "data": true,
  "code": "200",
  "message": null
}
```

补充说明：

- `code` 可以是 `"200"`，也可以是 `200`
- 如果响应里没有 `success`，插件会退化为只检查 `code`
- 后端错误消息可能直接来自服务端异常文本

### 上传状态

| 状态 | 说明 |
| --- | --- |
| `Prepare` | 准备中 |
| `HashCalculationWaiting` | 正在计算文件哈希 |
| `WaitAddQueue` | 等待进入上传队列 |
| `Waiting` | 等待并发槽位 |
| `Uploading` | 正在上传分片 |
| `Merge` | 等待后端合并 |
| `Done` | 上传完成 |
| `QuickUpload` | 服务端已存在同文件 |
| `BreakPointUpload` | 基于分片记录继续上传 |
| `OtherUploading` | 同一文件正在其他任务中上传 |
| `Pause` | 已暂停 |
| `PauseRetry` | 暂停重试状态 |
| `Retry` | 重试中 |
| `RetryFailed` | 重试耗尽 |
| `Canceled` | 已取消 |
| `RequestError` | 后端请求失败 |
| `NetworkDisconnected` | 网络中断 |
| `RefreshRetry` | 刷新后恢复重试 |

## Vue Hook 示例

如果你想看一个完整的 Vue 侧状态接入方式，可以参考测试项目 `breakpoint-transfer-launcher-page`：

- 仓库地址: [breakpoint-transfer-launcher-page](https://gitee.com/breakpoint-transfer-launcher/breakpoint-transfer-launcher-page)

- `src/hooks/useBigFileUploadForVue.ts`
- `src/views/Test/index.vue`

这个 Hook 主要演示了 3 件事：

- 如何通过 `UPLOADING_FILE_SUBSCRIBE_DEFINE` 订阅插件内部的上传状态变更
- 如何把插件状态转换成页面可直接消费的响应式数据，例如 `progress`、`stateDesc`、`downSize`、`remainingTime`
- 如何通过 `REVERSE_CONTAINER_ACTION` 主动控制上传任务，例如暂停和取消

这个文件里值得重点关注的逻辑：

- `allProgress`：维护整个上传队列的响应式列表，适合直接绑定表格、列表或进度条组件
- `Uploading` 状态：根据插件回传的 `progress` 计算百分比，并同步换算已上传大小
- `BreakPointUpload` 状态：用于处理断点续传恢复时的进度展示
- `Retry` / `RequestError` 状态：用于显示重试次数、错误提示等文案
- `cancelProgressHandler` / `pauseProgressHandler`：演示了外部页面如何反向通知插件控制任务状态

`src/views/Test/index.vue` 则展示了这个 Hook 在真实页面中的用法：

- 通过 `const [allProgress, cancelProgressHandler, pauseProgressHandler] = useBigFileUploadForVue()` 接收响应式上传队列和控制方法
- 通过 `uploadHandler.config(...)` 注入后端请求实现
- 通过 `beforeUploadHandler(file)` 触发上传
- 通过 `a-progress`、状态文案、网速、剩余时间等 UI 组件消费 `allProgress`
- 通过暂停和取消按钮调用 Hook 返回的方法，控制具体上传任务

如果你的页面需要展示“当前上传到多少了”“还剩多久”“当前是暂停、重试还是秒传完成”，这个 Hook 就是一个比较直接的接入参考。

## 实践建议

- 插件内部使用计算出的哈希值作为后端 `baseDir`
- 与当前插件配套时，后端成品文件名通常是 `{hash}.{ext}`，而不是原始文件名
- 如果你修改了后端 `context-prefix`，前端请求地址也要同步调整
- 如果你不用 Spring Boot Starter，而是自定义后端，也请保持相同的路由与响应契约

## 开发

```bash
pnpm install
pnpm exec tsc --noEmit
pnpm build
```

## 更新日志

### v0.1.0

- 补充与后端 Starter 的配套接入文档
- 增加 `calculateNameWorker.js` 的作用说明、静态资源配置方式和测试项目参考地址
- 增加 Vue Hook 与测试页面示例说明，展示上传状态接收、进度展示、暂停与取消控制方式
- 修复相同文件等待队列在失败场景下的释放逻辑
- 补充响应契约、Worker 哈希和相同文件失败流转测试

### v0.0.1

- 初始版本发布
- 提供分片上传、秒传校验、断点续传、上传状态跟踪能力
- 提供 IndexedDB 持久化和多语言支持

## License

ISC
