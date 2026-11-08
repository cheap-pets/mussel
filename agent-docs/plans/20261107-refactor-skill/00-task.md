# 任务：将结构重构方法论提炼为通用 skill

## 目标

基于 `agent-docs/plans/table-ex-structure-refactor-summary.md` 提炼一个**通用复杂功能代码
结构重构 skill**，供跨项目复用。

## 硬性要求（用户指定）

1. 内容重点是通用方式方法；**禁止出现本项目专属名词**（组件名、函数名、文件路径、目录名等）。
2. 流程：primary 编写 → peer 修订。

## 格式规范（skill-creator）

- 规范来源：C:\Users\scrol\.zcode\cli\plugins\cache\zcode-plugins-official\skill-creator\0.1.0\skills\skill-creator\SKILL.md（编写者必读）
- 落盘位置（编写/修订在任务目录 draft/ 进行，终稿由调度者安装）：
  `C:\Users\scrol\.agents\skills\structure-refactor\`（skill-creator 默认用户级位置）
- frontmatter：name=structure-refactor；description 含触发场景与动作（适度主动触发）
- SKILL.md ≤500 行；细节拆 references/ 按需读；祈使句、给理由、示例优先

## 验收标准

1. 无本项目专属名词（grep 源文档中的组件/文件/函数名验证零残留）。
2. 方法链完整可执行：信号识别 → 问题归类 → 手段决策 → 批次实施 → 验证矩阵 → 基线程序。
3. 触发 description 覆盖"重构/结构优化/拆分/依赖梳理/检索效率"等说法。

## 预算

- 预估 d=2（编写+修订），上限 3。
