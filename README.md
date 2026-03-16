# YOLO

**AI 驱动的代码助手，直接进入聊天模式。**

YOLO 是一个开源的 **Vibe Coding** 工具，让你像与同事聊天一样与 AI 协作完成编程任务。

> 💡 什么是 Vibe Coding？你负责"感觉"（vibe）—— 知道什么是对的，什么是错的 —— AI 负责具体的实现细节。

---

## 📦 项目结构

```
yolo/
├── src/
│   ├── agent/          # Agent 层 - 系统的大脑
│   │   ├── code-agent.ts
│   │   └── types.ts
│   ├── llm/            # LLM Provider 层
│   │   ├── anthropic.ts
│   │   └── types.ts
│   ├── tools/          # 工具层 - 系统的双手
│   │   ├── read.ts
│   │   ├── write.ts
│   │   ├── bash.ts
│   │   └── search.ts
│   └── cli/            # CLI 用户界面层
│       ├── commands.ts
│       └── modes/
├── docs/
│   ├── ARCHITECTURE.md # 架构文档
│   └── TUTORIAL.md     # 使用教程
└── package.json
```

---

## 🚀 快速开始

### 安装

```bash
npm i -g @retfings/yolo
```

### 使用

```bash
# 直接进入聊天模式
yolo

# 查看帮助
yolo --help

# 执行单个任务
yolo run "创建一个 hello world 程序"

# 运行演示
yolo demo
```

---

## 📖 环境变量设置

### 使用阿里云 DashScope API（推荐国内用户）

```bash
export ANTHROPIC_AUTH_TOKEN="sk-xxx"
export ANTHROPIC_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
export ANTHROPIC_MODEL="qwen3.5-plus"
```

### 或使用 Anthropic 原生 API

```bash
export ANTHROPIC_API_KEY="sk-ant-xxx"
```

---

## 🏗️ 架构总览

```
┌─────────────────────────────────────────────────────────────┐
│                      CLI 用户界面层                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   chat 模式  │  │   run 模式   │  │  demo 模式   │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                        Agent 层                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    CodeAgent                        │    │
│  │  - 管理对话历史  - 控制执行循环  - 协调工具调用      │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                        工具层                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  read    │ │  write   │ │   bash   │ │  search  │       │
│  │  file    │ │  file    │ │  tool    │ │  files   │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       LLM Provider 层                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │               AnthropicProvider                     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Anthropic API / DashScope                │
│              (Claude / Qwen 等大模型)                        │
└─────────────────────────────────────────────────────────────┘
```

### 核心模块

| 模块 | 职责 | 关键文件 |
|-----|------|---------|
| **CLI 层** | 用户界面，支持多种交互模式 | `src/cli/commands.ts` |
| **Agent 层** | 决策中枢，管理对话和执行循环 | `src/agent/code-agent.ts` |
| **工具层** | 执行能力，提供文件/命令操作 | `src/tools/*.ts` |
| **LLM 层** | 智能引擎，理解指令并决策 | `src/llm/anthropic.ts` |

---

## 🛠️ 核心功能

### 1. 聊天模式

像聊天一样与 AI 协作，支持多轮对话：

```bash
yolo
```

### 2. 单次任务

执行单个任务后退出：

```bash
yolo run "创建一个 TypeScript 项目"
```

### 3. 工具系统

YOLO 提供以下内置工具：

| 工具 | 功能 |
|-----|------|
| `read_file` | 读取文件内容 |
| `write_file` | 创建或修改文件 |
| `bash` | 执行 shell 命令 |
| `search_files` | 搜索文件 |

### 4. 事件系统

Agent 通过事件系统让外部可以观察执行过程：

```typescript
agent.on('thinking', (e) => console.log('思考中...'));
agent.on('tool_call', (e) => console.log('调用工具:', e.data.toolCall.name));
agent.on('complete', (e) => console.log('完成:', e.data.finalResponse));
```

---

## 📚 文档

- **[架构文档](./docs/ARCHITECTURE.md)** - 详细的架构说明、模块划分、扩展指南
- **[教程](./docs/TUTORIAL.md)** - 从零开始理解 Vibe Coding，包含实战示例

---

## 🔧 扩展指南

### 添加新工具

```typescript
// src/tools/my-tool.ts
import { BaseTool } from './base.js';

export class MyTool extends BaseTool {
  name = 'my_tool';
  description = '我的工具描述';
  inputSchema = {
    type: 'object',
    properties: {
      param: { type: 'string', description: '参数' }
    },
    required: ['param']
  };

  async execute(params, context) {
    return { success: true, output: '结果' };
  }
}
```

然后在 `src/tools/registry.ts` 的 `createDefaultRegistry()` 中注册。

### 自定义系统提示词

```typescript
const agent = createAgent({
  apiKey: process.env.ANTHROPIC_AUTH_TOKEN!,
  systemPrompt: `你是一个专业的 Python 开发者助手...`
});
```

---

## 📝 开发

```bash
# 开发模式
npm run dev

# 构建
npm run build

# 启动
npm run start

# 测试
npm run test
```

---

## 📄 许可证

MIT
