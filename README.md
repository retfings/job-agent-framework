# Code Agent CLI 教程

一个教学项目，教你如何用 TypeScript 构建类似 Claude Code 的 Code Agent CLI 工具。

## 📚 目录

- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [核心概念](#核心概念)
- [详细教程](#详细教程)
- [API 参考](#api-参考)

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 设置环境变量

#### 使用阿里云 DashScope API

```bash
export ANTHROPIC_AUTH_TOKEN="sk-xxx"
export ANTHROPIC_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
export ANTHROPIC_MODEL="qwen3.5-plus"
```

#### 或使用 Anthropic 原生 API

```bash
export ANTHROPIC_API_KEY="sk-ant-xxx"
```

#### 或使用 .env 文件

```bash
cp .env.example .env
# 编辑 .env 填入你的 API Key
```

### 3. 运行

```bash
# 查看演示
npm run dev demo

# 进入交互式聊天
npm run dev chat

# 执行单个任务
npm run dev run "创建一个 hello world 程序"
```

## 📁 项目结构

```
src/
├── agent/              # Agent 核心模块
│   ├── types.ts        # Agent 类型定义
│   ├── code-agent.ts   # Agent 实现
│   └── index.ts        # 导出
├── tools/              # 工具系统
│   ├── base.ts         # 工具基类
│   ├── read.ts         # 读文件工具
│   ├── write.ts        # 写文件工具
│   ├── bash.ts         # 执行命令工具
│   ├── search.ts       # 搜索工具
│   ├── registry.ts     # 工具注册表
│   └── types.ts        # 工具类型
├── llm/                # LLM Provider
│   ├── types.ts        # LLM 类型
│   ├── anthropic.ts    # Anthropic 实现
│   └── provider.ts     # Provider 导出
├── cli/                # CLI 层
│   ├── commands.ts     # 命令定义
│   ├── interactive.ts  # 交互组件
│   ├── output.ts       # 输出格式化
│   └── modes/          # 运行模式
└── index.ts            # 入口文件
```

## 🧠 核心概念

### Agent（代理）

Agent 是整个系统的"大脑"，负责：
- 接收用户输入
- 调用 LLM 进行思考
- 执行工具调用
- 循环直到任务完成

### Tools（工具）

工具是系统的"手"，执行具体操作：
- `read_file`: 读取文件
- `write_file`: 写入文件
- `bash`: 执行命令
- `search_files`: 搜索文件

### LLM Provider

LLM Provider 是系统的"思考引擎"：
- 封装与 Anthropic API 的交互
- 支持工具调用（Tool Calling）
- 处理流式响应

## 📖 详细教程

### 教程 1: 理解工具系统

每个工具都继承自 `BaseTool` 类：

```typescript
import { BaseTool } from './tools/base.js';

class MyTool extends BaseTool {
  name = 'my_tool';
  description = '我的工具描述';
  inputSchema = {
    type: 'object',
    properties: {
      param1: { type: 'string', description: '参数 1' }
    },
    required: ['param1']
  };

  async execute(params, context) {
    // 实现工具逻辑
    return { success: true, output: '结果' };
  }
}
```

### 教程 2: 使用 Agent

```typescript
import { createAgent } from './agent/index.js';
import { ToolRegistry } from './tools/registry.js';

// 创建工具注册表
const registry = new ToolRegistry();
registry.register(new ReadFileTool());
registry.register(new BashTool());

// 创建 Agent
const agent = createAgent({
  apiKey: process.env.ANTHROPIC_API_KEY,
  workingDirectory: process.cwd()
});

// 发送消息
const response = await agent.sendMessage('帮我创建一个 TypeScript 项目');
```

### 教程 3: 添加新工具

1. 创建工具类
2. 实现 `execute` 方法
3. 注册到工具注册表

```typescript
// 注册工具
registry.register(new MyTool());
```

## 🔧 API 参考

### Agent

| 方法 | 描述 |
|------|------|
| `sendMessage(message: string)` | 发送消息并获取响应 |
| `getState()` | 获取当前状态 |
| `reset()` | 重置状态 |
| `on(event, handler)` | 注册事件处理器 |

### Tool

| 属性 | 描述 |
|------|------|
| `name` | 工具名称 |
| `description` | 工具描述 |
| `inputSchema` | 输入参数 Schema |
| `execute(params, context)` | 执行工具 |

## 📝 许可证

MIT
