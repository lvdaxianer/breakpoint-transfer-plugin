/**
 * 发布到 GitHub Releases 脚本
 * 功能：
 * 1. 获取当前版本对应的 CHANGELOG 内容
 * 2. 创建或更新 GitHub Release
 * @author lihh
 * @date 2024-02-11
 */

import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "..");

function getPackageVersion() {
  const packageJsonPath = join(PROJECT_ROOT, "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
  return packageJson.version;
}

function getChangelogForVersion(version) {
  const changelogPath = join(PROJECT_ROOT, "CHANGELOG.md");
  const content = readFileSync(changelogPath, "utf-8");

  const versionPattern = `## \\[${version}\\]`;
  const lines = content.split("\n");
  let startIndex = -1;
  let endIndex = lines.length;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(new RegExp(`^## \\[${version}\\]`))) {
      startIndex = i;
    } else if (startIndex !== -1 && lines[i].match(/^## \[/)) {
      endIndex = i;
      break;
    }
  }

  if (startIndex === -1) {
    return null;
  }

  return lines.slice(startIndex, endIndex).join("\n").trim();
}

function getRepoInfo() {
  const remoteUrl = execSync("git remote get-url origin", {
    encoding: "utf-8",
  }).trim();
  const match = remoteUrl.match(/github\.com[:/](.+)\/(.+?)(\.git)?$/);
  if (!match) {
    throw new Error("无法解析 GitHub 仓库地址");
  }
  return {
    owner: match[1],
    repo: match[2].replace(".git", ""),
  };
}

function createGitHubRelease(
  tagName,
  releaseName,
  body,
  draft = false,
  prerelease = false,
) {
  const { owner, repo } = getRepoInfo();

  console.log(`\n📦 GitHub Release 信息：`);
  console.log(`   仓库: ${owner}/${repo}`);
  console.log(`   Tag: ${tagName}`);
  console.log(`   标题: ${releaseName}`);
  console.log(`   草稿: ${draft}`);
  console.log(`   预发布: ${prerelease}`);

  console.log(`\n📝 Release 内容：\n${body}\n`);

  const command = [
    "gh",
    "release",
    "create",
    tagName,
    "--title",
    releaseName,
    "--body",
    body,
    draft ? "--draft" : "",
    prerelease ? "--prerelease" : "",
    "--repo",
    `${owner}/${repo}`,
  ]
    .filter(Boolean)
    .join(" ");

  console.log(`\n执行命令: ${command}\n`);

  try {
    execSync(command, { encoding: "utf-8", stdio: "inherit" });
    console.log(`✅ 已创建 GitHub Release: ${tagName}`);
  } catch (error) {
    console.log(`❌ 创建失败: ${error.message}`);
    console.log(`\n提示: 确保已安装 gh CLI 并登录`);
    console.log(`   安装: brew install gh`);
    console.log(`   登录: gh auth login`);
  }
}

function main() {
  const version = getPackageVersion();
  const tagName = `v${version}`;
  const releaseName = `v${version}`;
  const changelog = getChangelogForVersion(version);

  if (!changelog) {
    console.log(`❌ 未找到版本 ${version} 的 CHANGELOG 内容`);
    console.log(`   请确保 CHANGELOG.md 包含 "## [${version}]" 章节`);
    return;
  }

  createGitHubRelease(tagName, releaseName, changelog);
}

main();
