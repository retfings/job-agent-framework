/**
 * 演示模式 - 展示工具调用过程
 *
 * 这个模式用于教学，展示 Agent 如何工作
 */

import chalk from 'chalk';

/**
 * 运行演示
 */
export async function runDemo(): Promise<void> {
  console.log(chalk.cyan('\n🎓 Code Agent CLI 演示\n'));
  console.log(chalk.gray('这是一个教学项目，展示如何构建类似 Claude Code 的工具\n'));

  console.log(chalk.bold('\n📁 项目结构:'));
  console.log(chalk.gray(`
code-agent-cli/
├── src/
│   ├── agent/           # Agent 核心模块
│   │   ├── types.ts     # 类型定义
│   │   └── code-agent.ts # Agent 实现
│   ├── tools/           # 工具系统
│   │   ├── base.ts      # 工具基类
│   │   ├── read.ts      # 读文件工具
│   │   ├── write.ts     # 写文件工具
│   │   ├── bash.ts      # 执行命令工具
│   │   └── registry.ts  # 工具注册表
│   ├── llm/             # LLM  Provider
│   │   ├── types.ts     # 类型定义
│   │   └── anthropic.ts # Anthropic 实现
│   ├── cli/             # CLI 层
│   │   ├── commands.ts  # 命令定义
│   │   └── modes/       # 运行模式
│   └── index.ts         # 入口文件
`));

  console.log(chalk.bold('\n🔄 Agent 工作流程:'));
  console.log(chalk.gray(`
1. 接收用户输入
   ↓
2. 调用 LLM (Anthropic Claude)
   ↓
3. LLM 决定是否使用工具
   ↓
4. 执行工具调用
   ↓
5. 将结果返回给 LLM
   ↓
6. 重复直到任务完成
   ↓
7. 返回最终响应
`));

  console.log(chalk.bold('\n🛠️  可用工具:'));
  console.log(chalk.gray(`
| 工具名        | 用途                           |
|--------------|--------------------------------|
| read_file    | 读取文件内容                    |
| write_file   | 创建/修改文件                   |
| bash         | 执行 shell 命令                 |
| search_files | 搜索匹配模式的文件              |
`));

  console.log(chalk.bold('\n📝 使用示例:'));
  console.log(chalk.gray(`
# 1. 设置 API Key
export ANTHROPIC_API_KEY=your-api-key

# 2. 进入交互式聊天
npm run dev chat

# 3. 执行单个任务
npm run dev run "创建一个 hello.ts 文件"

# 4. 运行演示
npm run dev demo
`));

  console.log(chalk.bold('\n🔑 核心概念:'));
  console.log(chalk.gray(`
• Agent: 系统的"大脑"，负责决策和协调
• Tools: 系统的"手"，执行具体操作
• LLM Provider: 系统的"思考引擎"，提供智能
• CLI: 用户界面，处理输入输出
`));

  console.log(chalk.green('\n✨ 现在你可以开始使用 code-agent 了！\n'));
  console.log(chalk.gray('提示：确保设置了 ANTHROPIC_API_KEY 环境变量\n'));
}
