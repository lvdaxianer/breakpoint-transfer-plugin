# Breakpoint Transfer Plugin

[![npm version](https://img.shields.io/npm/v/breakpoint-transfer-plugin.svg)](https://www.npmjs.com/package/breakpoint-transfer-plugin)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)
[![GitHub stars](https://img.shields.io/github/stars/lvdaxianer/breakpoint-transfer-plugin)](https://github.com/lvdaxianer/breakpoint-transfer-plugin)

---

**GitHub**: https://github.com/lvdaxianer/breakpoint-transfer-plugin

## 简介

`breakpoint-transfer-plugin` 是一个用于实现文件断点续传功能的 JavaScript/TypeScript SDK 插件。主要用于大文件上传场景，支持断点续传、秒传、并发控制、进度追踪等功能。

### 项目说明

本项目分为 **前端** 和 **后端** 两部分：

- **前端**：即本文档描述的 `breakpoint-transfer-plugin`，负责文件分片、进度追踪、上传控制等前端逻辑
- **后端**：负责文件接收、分片合并、持久化存储等服务端逻辑

**后端文档参照**：
- 国外：https://github.com/lvdaxianer/spring-boot-launcher/tree/main/breakpoint-transfer-launcher
- 国内：https://gitee.com/breakpoint-transfer-launcher/spring-boot-launcher/tree/main/breakpoint-transfer-launcher

## 核心特性

- **断点续传**: 支持网络中断后从上次断开的位置继续上传
- **秒传功能**: 通过文件 hash 快速判断是否已上传，避免重复上传
- **并发控制**: 支持配置同时上传的文件数量限制
- **进度追踪**: 实时显示上传进度，支持多种状态展示
- **多语言支持**: 支持中文、英文、日文三种语言
- **持久化存储**: 使用 IndexedDB 持久化上传进度，支持页面刷新后恢复
- **Web Worker**: 支持使用 Web Worker 计算文件 hash，不阻塞主线程

## 项目亮点

### 架构设计

- **事件驱动架构**: 采用发布订阅模式，实现模块间松耦合
- **TypeScript 优先**: 完整的类型定义，提供良好的开发体验
- **模块化设计**: 清晰的功能划分，存储、事件、工具、状态管理各司其职

### 核心能力

- **智能分片**: 根据网络速度动态调整分片大小
- **自动重试**: 可配置的重试机制，支持指数退避
- **状态管理**: 全面的上传状态跟踪
- **暂停/恢复/取消**: 完全控制上传生命周期

### 性能优化

- **Web Worker 卸载**: 文件 hash 计算在后台线程执行
- **IndexedDB 缓存**: 优化的键值索引持久化存储
- **并发限制器**: PLimit 实现控制并行上传数量
- **网速检测**: 基于实时网络条件动态调整分片大小

### 开发体验

- **Promise API**: 现代异步/await 兼容接口
- **回调支持**: 可选的进度回调函数
- **国际化支持**: 内置多语言 (中文、英文、日文)
- **零依赖核心**: 轻量级集成，最小化核心依赖

## 功能支持矩阵

| 功能 | HTTP | HTTPS | localhost |
|------|:----:|:-----:|:---------:|
| 大文件切割上传 | ✅ | ✅ | ✅ |
| 秒传 | ❌ | ✅ | ✅ |
| 断点续传 | ❌ | ✅ | ✅ |
| 基于漏斗算法的并发控制 | ✅ | ✅ | ✅ |
| 暂停 | ✅ | ✅ | ✅ |
| 相同文件互斥上传 | ✅ | ✅ | ✅ |
| 删除 | ✅ | ✅ | ✅ |
| 基于 Web Worker 的 Hash 摘要算法 | ❌ | ✅ | ✅ |
| 失败重试 | ✅ | ✅ | ✅ |
| Hash 摘要算法队列 | ✅ | ✅ | ✅ |
| 持久化方案 (IndexedDB) | ✅ | ✅ | ✅ |
| 刷新留存 | ✅ | ✅ | ✅ |
| 异常反馈提示 | ✅ | ✅ | ✅ |
| 国际化 (汉/英/日) | ✅ | ✅ | ✅ |
| 监听网络，动态调整上传速度 | ✅ | ✅ | ✅ |

**说明**：
- ❌ 表示不支持：秒传、断点续传、Web Worker 需要 Secure Context (HTTPS 或 localhost)
- ✅ 表示支持：其他功能在所有环境下均可正常使用

## 安装

```bash
npm install breakpoint-transfer-plugin
# 或
pnpm add breakpoint-transfer-plugin
```

## 快速开始

```typescript
import { uploadHandler } from "breakpoint-transfer-plugin";

// 1. 配置上传参数
uploadHandler.config({
  // 请求接口配置（必填）
  req: {
    // 分片上传
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
    // 合并分片
    mergeUploadReq: async (calculationHashCode, fileName) => {
      const res = await fetch(
        `/breakpoint/transfer/upload/merge/${calculationHashCode}/${fileName}`,
        { method: "GET" },
      );
      return res.json();
    },
    // 检查文件是否已存在（秒传验证）
    verifyFileExistReq: async (calculationHashName) => {
      const res = await fetch(
        `/breakpoint/transfer/upload/verify/${calculationHashName}`,
        { method: "GET" },
      );
      return res.json();
    },
    // 查询已上传的分片
    listFilesReq: async (calculationHashCode) => {
      const res = await fetch(
        `/breakpoint/transfer/upload/list/${calculationHashCode}`,
        { method: "GET" },
      );
      return res.json();
    },
  },
  // 最大重试次数（默认: 3）
  maxRetryTimes: 3,
  // 并发限制（默认: 2）
  concurrentLimit: 2,
  // 基础网速 Bytes/s（默认: 1024）
  baseNetworkSpeed: 1024,
  // 是否持久化（默认: false）
  persist: true,
  // 语言设置（默认: ZH）
  language: "zh",
});

// 2. 开始上传文件
const fileInput = document.getElementById("fileInput") as HTMLInputElement;
fileInput.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    const [baseDir, fileName] = await uploadHandler(file);
    console.log("上传成功:", baseDir, fileName);
  } catch (error) {
    console.error("上传失败:", error);
  }
});
```

## API 参考

### 上传配置 `uploadHandler.config(config)`

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| req | Object | 是 | - | 请求接口配置 |
| req.verifyFileExistReq | Function | 是 | - | 秒传验证接口 |
| req.sectionUploadReq | Function | 是 | - | 分片上传接口 |
| req.mergeUploadReq | Function | 是 | - | 合并分片接口 |
| req.listFilesReq | Function | 是 | - | 查询已上传分片接口 |
| maxRetryTimes | Number | 否 | 3 | 最大重试次数 |
| concurrentLimit | Number | 否 | 2 | 并发上传限制 |
| baseNetworkSpeed | Number | 否 | 1024 | 基础网速 Bytes/s |
| persist | Boolean | 否 | false | 是否启用持久化 |
| language | String | 否 | "zh" | 语言设置 |

### 上传状态 `UploadProgressState`

| 状态 | 说明 |
|------|------|
| Prepare | 准备中 |
| HashCalculationWaiting | 计算 hash 中 |
| Waiting | 排队等待中 |
| Uploading | 上传中 |
| Merge | 合并文件中 |
| Done | 上传完成 |
| QuickUpload | 秒传成功 |
| BreakPointUpload | 断点续传中 |
| Pause | 已暂停 |
| PauseRetry | 暂停重试 |
| Retry | 重试中 |
| RetryFailed | 重试失败 |
| Canceled | 已取消 |
| RequestError | 请求错误 |
| NetworkDisconnected | 网络断开 |
| RefreshRetry | 刷新重试 |

### 语言设置 `uploadHandler.lng(language)`

支持的语言:
- `zh` - 中文
- `en` - 英文
- `ja_JP` - 日文

## 项目结构

```
src/
├── core/
│   ├── constant.ts      # 常量定义
│   ├── types/           # 类型定义
│   │   └── index.ts
│   ├── tools.ts         # 工具函数
│   ├── subscriber.ts    # 事件订阅
│   ├── store.ts         # 存储管理
│   ├── variable.ts      # 全局变量
│   ├── Logger.ts        # 日志工具
│   ├── PLimit.ts        # 并发控制
│   ├── language.ts       # 多语言
│   └── index.ts         # 核心导出
├── index.ts             # 主入口
└──
```

## 依赖

- `i18next` - 多语言支持
- `jsmethod-extra` - JavaScript 工具库
- `localforage` - IndexedDB 封装

## 构建

```bash
# 安装依赖
pnpm install

# 构建
pnpm build

# 代码检查
pnpm lint
```

---

## License

ISC
