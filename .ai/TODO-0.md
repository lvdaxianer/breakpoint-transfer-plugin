---
TODO:
  # task1: 添加 GitHub Releases 关联功能
  ## 需求描述
  - CHANGELOG.md 自动更新（git commit 时）
  - 支持发布到 GitHub Releases
---

# answer1:

√ 完成

## 拆分子任务

- [x] 创建 scripts/update-changelog.js - git 提交时自动更新 CHANGELOG.md
- [x] 配置 .husky/\_/post-commit hook
- [x] 创建 scripts/publish-github-release.js - 发布到 GitHub Releases
- [x] 添加 npm scripts 命令
- [x] 更新 .ai/context.md 文档

## 修改过程

1. `scripts/update-changelog.js` - 每次 git commit 后自动生成 CHANGELOG
2. `.husky/_/post-commit` - hook 触发更新
3. `scripts/publish-github-release.js` - 将 CHANGELOG 发布到 GitHub Releases
4. `package.json` 添加脚本命令

## 使用方法

```bash
# 生成更新日志（自动）
git commit -m "feat: xxx"

# 发布到 GitHub Releases（需要 gh CLI）
npm run release
```

## 前置条件

- 发布到 GitHub Releases 需要安装并登录 gh CLI：

```bash
brew install gh
gh auth login
```

## 修改了哪些地方

- `.husky/_/post-commit` - post-commit hook
- `scripts/update-changelog.js` - 自动生成脚本
- `scripts/publish-github-release.js` - GitHub Releases 发布脚本
- `package.json` - 添加 changelog 和 release 脚本

## 核心关键字

- Keep a Changelog
- GitHub Releases
- gh CLI
- post-commit hook
- CHANGELOG.md
