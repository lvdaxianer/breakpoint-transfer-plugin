/**
 * 手动生成 CHANGELOG.md 脚本
 * 功能：
 * 1. 读取 git commit 记录
 * 2. 生成 Keep a Changelog 格式的更新日志
 * 3. 输出到控制台或更新 CHANGELOG.md
 * @author lihh
 * @date 2024-02-11
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "..");
const CHANGELOG_PATH = join(PROJECT_ROOT, "CHANGELOG.md");

function getPackageVersion() {
  const packageJsonPath = join(PROJECT_ROOT, "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
  return packageJson.version;
}

function getLastTag() {
  try {
    const tags = execSync("git tag --sort=-creatordate", { encoding: "utf-8" })
      .trim()
      .split("\n")
      .filter(Boolean);
    return tags[0] || null;
  } catch {
    return null;
  }
}

function getCommitsSinceTag(tag) {
  if (!tag) {
    return execSync('git log --pretty=format:"%h|%s|%an"', {
      encoding: "utf-8",
    })
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [hash, subject, author] = line.split("|");
        return { hash, subject, author, type: categorizeCommit(subject) };
      });
  }
  return execSync(`git log ${tag}..HEAD --pretty=format:"%h|%s|%an"`, {
    encoding: "utf-8",
  })
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [hash, subject, author] = line.split("|");
      return { hash, subject, author, type: categorizeCommit(subject) };
    });
}

function categorizeCommit(subject) {
  const lowerSubject = subject.toLowerCase();
  if (lowerSubject.startsWith("feat") || lowerSubject.includes("feature")) {
    return "Added";
  }
  if (lowerSubject.startsWith("fix") || lowerSubject.includes("bug")) {
    return "Fixed";
  }
  if (
    lowerSubject.startsWith("docs") ||
    lowerSubject.includes("documentation")
  ) {
    return "Changed";
  }
  if (
    lowerSubject.startsWith("refactor") ||
    lowerSubject.includes("refactor")
  ) {
    return "Changed";
  }
  if (lowerSubject.startsWith("perf") || lowerSubject.includes("performance")) {
    return "Changed";
  }
  if (
    lowerSubject.startsWith("chore") ||
    lowerSubject.includes("maintenance")
  ) {
    return "Changed";
  }
  if (
    lowerSubject.startsWith("BREAKING CHANGE") ||
    lowerSubject.includes("breaking")
  ) {
    return "Changed";
  }
  return "Changed";
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function generateChangelogEntry(commits, version) {
  const date = formatDate(new Date());
  const grouped = {
    Added: [],
    Changed: [],
    Deprecated: [],
    Removed: [],
    Fixed: [],
    Security: [],
  };

  for (const commit of commits) {
    const prefixRegex = /^(feat|fix|docs|style|refactor|perf|chore)(\(.+\))?:/;
    let cleanMessage = commit.subject.replace(prefixRegex, "").trim();
    cleanMessage = cleanMessage.charAt(0).toUpperCase() + cleanMessage.slice(1);

    const entry = `- ${cleanMessage}`;
    if (grouped[commit.type]) {
      grouped[commit.type].push(entry);
    } else {
      grouped.Changed.push(entry);
    }
  }

  let entry = `## [${version}] - ${date}\n\n`;
  for (const [category, items] of Object.entries(grouped)) {
    if (items.length > 0) {
      entry += `### ${category}\n\n`;
      entry += items.join("\n") + "\n\n";
    }
  }
  return entry;
}

function readExistingChangelog() {
  if (!existsSync(CHANGELOG_PATH)) {
    return `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

`;
  }
  return readFileSync(CHANGELOG_PATH, "utf-8");
}

function updateChangelog() {
  const version = getPackageVersion();
  const lastTag = getLastTag();
  const commits = getCommitsSinceTag(lastTag);

  if (commits.length === 0) {
    console.log("没有新的提交，跳过更新日志生成。");
    return;
  }

  const newEntry = generateChangelogEntry(commits, version);
  const existingContent = readExistingChangelog();
  const newContent = existingContent + newEntry;

  writeFileSync(CHANGELOG_PATH, newContent, "utf-8");
  console.log(`✅ CHANGELOG.md 已更新，版本: ${version}`);
  console.log(`📝 新增 ${commits.length} 条提交记录。`);
}

updateChangelog();
