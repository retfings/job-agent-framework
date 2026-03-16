# 构建 Code Agent CLI 架构指南

## 概述

本文档详细介绍 Code Agent CLI 的架构设计，帮助你理解每个组件的作用和如何扩展它们。

## 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        用户界面层                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   chat 模式  │  │   run 模式   │  │  demo 模式   │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                        Agent 层                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                 CodeAgent                           │    │
│  │  - 管理对话历史                                      │    │
│  │  - 控制执行循环                                      │    │
│  │  - 协调工具调用                                      │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                        工具层                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  read    │ │  write   │ │   bash   │ │  search  │       │
│  │  file    │ │  file    │ │  tool    │ │  files   │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              ToolRegistry                           │    │
│  │  - 工具注册                                         │    │
│  │  - 工具查找                                         │    │
│  │  - 工具执行                                         │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       LLM Provider 层                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │            AnthropicProvider                        │    │
│  │  - 消息格式转换                                      │    │
│  │  - API 调用                                         │    │
│  │  - 响应解析                                         │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Anthropic API                           │
│                   (Claude 模型)                              │
└─────────────────────────────────────────────────────────────┘
```

## 核心组件详解

### 1. Agent 层

**职责**: 系统的"大脑"，负责决策和协调

**关键文件**: `src/agent/code-agent.ts`

**核心方法**:
```typescript
class CodeAgent {
  // 主循环入口
  async sendMessage(message: string): Promise<string>

  // 处理 LLM 响应
  private async processResponse(response: LLMResponse)

  // 事件系统
  on(event: AgentEventType, handler: Handler)
}
```

**工作流程**:
1. 接收用户消息
2. 调用 LLM Provider
3. 检查是否需要使用工具
4. 执行工具调用
5. 将结果返回给 LLM
6. 重复直到任务完成

### 2. 工具层

**职责**: 执行具体操作

**关键文件**:
- `src/tools/base.ts` - 基类
- `src/tools/registry.ts` - 注册表
- `src/tools/*.ts` - 具体工具

**添加新工具的步骤**:

```typescript
// 1. 创建工具类
class NewTool extends BaseTool {
  name = 'new_tool';
  description = '新工具的描述';
  inputSchema = { /* JSON Schema */ };

  async execute(params, context) {
    // 实现逻辑
    return { success: true, output: '结果' };
  }
}

// 2. 注册工具
registry.register(new NewTool());
```

### 3. LLM Provider 层

**职责**: 封装与大模型的交互

**关键文件**: `src/llm/anthropic.ts`

**支持的模型**:
- claude-sonnet-4-20250514 (默认)
- claude-opus-4-20250514
- 其他 Anthropic 支持的模型

### 4. CLI 层

**职责**: 用户界面

**关键文件**:
- `src/cli/commands.ts` - 命令定义
- `src/cli/modes/*.ts` - 运行模式

## 数据流

### 消息处理流程

```
用户输入
   ↓
CLI 层接收
   ↓
Agent.sendMessage()
   ↓
LLM Provider.sendMessage()
   ↓
Anthropic API
   ↓
解析响应 (文本/工具调用)
   ↓
如果有工具调用:
   - ToolRegistry.executeTool()
   - 执行工具
   - 返回结果
   - 继续循环
如果只有文本:
   - 返回响应给用户
```

## 扩展指南

### 添加新的 LLM Provider

1. 实现 `LLMProvider` 接口
2. 实现 `sendMessage` 和 `streamSendMessage` 方法
3. 在 Agent 中使用新的 Provider

### 添加工具

参考上面的"添加新工具的步骤"

### 添加新的运行模式

1. 在 `src/cli/modes/` 创建新文件
2. 实现模式逻辑
3. 在 `commands.ts` 中添加新命令

## 最佳实践

1. **工具设计**: 保持工具的单一职责
2. **错误处理**: 总是返回有意义的错误信息
3. **安全性**: 对危险操作（如 bash）添加确认机制
4. **可观测性**: 使用事件系统记录执行过程

## 常见问题

### Q: 如何调试 Agent?

A: 监听所有事件:
```typescript
agent.on('*', (event) => {
  console.log(event);
});
```

### Q: 如何限制工具权限?

A: 在工具执行前添加权限检查:
```typescript
async execute(params, context) {
  if (!context.permissions.includes('write')) {
    return { success: false, error: '无权限' };
  }
}
```

### Q: 如何添加记忆功能?

A: 扩展 AgentState，添加长期存储:
```typescript
interface AgentState {
  messages: LLMMessage[];
  memory: Map<string, string>; // 添加记忆
}
```
