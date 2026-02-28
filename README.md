# SentinelMask

[English](./README.en.md)

SentinelMask 是一个浏览器扩展（Manifest V3），用于在网页大模型对话场景中，在发送前检测并脱敏敏感信息。

## 功能概览

- 统一发送网关 `preSendGuard`，覆盖键盘/按钮/submit/程序触发发送路径
- 内置敏感规则：姓名（弱规则）、手机号、银行卡、邮箱、常见 API Key
- 风险分级动作：`allow` / `confirm` / `block`
- 本地日志仅记录匿名元信息（不记录原文）
- Options 设置页支持规则开关与日志查看/清空

## 当前支持站点

- `chatgpt.com`
- `chat.openai.com`
- `claude.ai`
- `gemini.google.com`
- `chat.deepseek.com`

## 快速开始

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

- `artifacts/sentinelmask-v0.1.0.zip`

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
shared/      # 类型、错误码、跨端消息协议
tests/       # 单元测试与后续集成测试
scripts/     # build/dev/package 脚本
```

## 隐私与安全原则

- 默认本地处理，不上传用户输入原文
- 日志只保留命中类型、次数、时间、动作、来源等匿名字段
- 最小权限原则，不使用 `<all_urls>`
