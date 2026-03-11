# SentinelMask

[English](./README.en.md)

SentinelMask 是一个浏览器扩展（Manifest V3），用于在网页大模型对话场景中，在发送前检测并脱敏敏感信息。

## 功能概览

- 统一发送网关 `preSendGuard`，覆盖键盘/按钮/submit/程序触发发送路径
- 内置敏感规则：姓名（弱规则）、手机号、银行卡、邮箱、常见 API Key
- 风险分级动作：`allow` / `confirm` / `block`
- 本地日志仅记录匿名元信息（不记录原文）
- Options 设置页支持规则开关与日志查看/清空
- 提供可重复执行的 Playwright 扩展自动化测试

## 当前支持站点

- `chatgpt.com`
- `chat.openai.com`
- `claude.ai`
- `gemini.google.com`
- `chat.deepseek.com`

## 给最终用户的安装方式

如果你只是想安装插件，请前往 GitHub Releases，下载名为 `sentinelmask-vX.Y.Z.zip` 的成品包。
不要下载 GitHub 自动生成的 `Source code (zip)` 或 `Source code (tar.gz)`，它们只是源码压缩包，不能直接作为浏览器扩展安装。

### Chrome / Edge

1. 下载 `sentinelmask-vX.Y.Z.zip`
2. 解压压缩包
3. 打开 `chrome://extensions` 或 `edge://extensions`
4. 开启“开发者模式”
5. 点击“加载已解压的扩展程序”
6. 选择解压后的目录

### Firefox（临时加载）

1. 下载并解压 `sentinelmask-vX.Y.Z.zip`
2. 打开 `about:debugging#/runtime/this-firefox`
3. 点击“临时载入附加组件”
4. 选择解压目录中的 `manifest.json`

## 开发者快速开始

### 环境要求

- Node.js 20+
- npm 10+

### 安装依赖

```bash
npm ci
```

### 开发与构建

```bash
# 开发监听构建
npm run dev

# 生产构建（输出到 dist/）
npm run build

# 类型检查 + 代码规范 + 单测
npx tsc --noEmit
npm run lint
npm run test
```

### 一键打包插件

```bash
npm run package
```

输出文件示例：

- `artifacts/sentinelmask-v0.2.0.zip`

## 浏览器插件自动化测试

### 浏览器准备

默认脚本会优先使用 Playwright 管理的 Chromium，因为浏览器扩展侧载依赖的命令行参数已经不再被 Google Chrome / Microsoft Edge 稳定版支持：

```bash
npm run test:e2e
```

如果当前环境还没有安装 Playwright 的 Chromium，可以在可联网环境执行：

```bash
npx playwright install chromium
```

如果你确实需要手动指定浏览器，可通过环境变量传入一个支持扩展侧载的 Chromium 可执行文件路径：

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE="/path/to/chromium" npm run test:e2e
```

不建议将 Google Chrome 稳定版路径传给该变量，否则扩展可能无法真正加载，测试结果也会失真。

### 执行 E2E（端到端）测试

```bash
# 无头模式，适合 CI 或快速回归
npm run test:e2e

# 有界面模式，便于本地观察扩展行为
npm run test:e2e:headed
```

当前 E2E 用例会自动：

- 构建 `dist/` 扩展目录
- 启动带扩展的 Chromium 实例
- 在模拟的 DeepSeek Host 页面输入手机号
- 验证发送前是否进行了脱敏
- 打开扩展 Options 页验证日志是否记录成功

## 本地加载插件

### Chrome / Edge

1. 打开 `chrome://extensions` 或 `edge://extensions`
2. 开启“开发者模式”
3. 点击“加载已解压的扩展程序”
4. 选择项目的 `dist/` 目录

### Firefox（临时加载）

1. 打开 `about:debugging#/runtime/this-firefox`
2. 点击“临时载入附加组件”
3. 选择 `dist/manifest.json`

## 项目结构

```text
content/     # 站点适配、发送拦截、网关接入
background/  # Service Worker、设置存储、日志聚合
core/        # 规则引擎、脱敏、风险决策、输入抽象
options/     # 扩展设置页
tests/       # 单元测试与浏览器自动化测试
scripts/     # build/dev/package 脚本
shared/      # 类型、错误码、跨端消息协议
```

## 隐私与安全原则

- 默认本地处理，不上传用户输入原文
- 日志只保留命中类型、次数、时间、动作、来源等匿名字段
- 最小权限原则，不使用 `<all_urls>`
