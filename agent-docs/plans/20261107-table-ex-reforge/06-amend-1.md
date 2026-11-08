VERDICT: AMENDED

# 设计核验修订记录（第 1 轮，design-amender 全新独立实例）

核验基准：HEAD `ee16eb4`、src/ 干净（与设计基准一致）；方法按 code-reforge 步骤 4，全部结论基于当前工作区命令核对，未采信文件转述。核对命令与结果全文见 02-design.md「设计核验记录」节。

## 检查项结论

1. 覆盖：5 条验收标准均有归属批次与手段（测试计划表），R1/终验两问验收可执行 — 通过。
2. 事实一致：6 个 O 的路径/符号/行号逐项 grep 命中，无漂移；N1 论据"估算域符号唯一消费方"与代码不符（self-checks/row-geometry.js:18-24 亦 import computeRowHeights/ensureRowMeasured），已直接修正 — 修正后通过。
3. 约定一致：index.js 生态豁免、deps 改名词汇、self-checks 只改 import 行、探针口径引用知识库，均与 lang-js.md / decisions.md / 项目约定一致 — 通过。
4. 影响面：O1 拆分 13 导出 + 9 私有符号全部核对，三框私有依赖自洽；O2 消费方恰 3 处；O6 消费方 table-ex.vue:77,337 + self-checks（不改）；无遗漏 — 通过（O6 补 self-checks ctx 字样残留说明）。
5. 可实施：8 步实施序列有序、依赖无环、每步有独立完成判据 — 通过。
6. 风险与回滚：全批双向门、回滚命令明确；B1/B2/B3 R4 豁免论证复核成立（painter.js 无顶层副作用、cellRectAt 静态标识符）— 通过。
7. 范围：无超出验收标准的改动；修订未引入新 O、未扩大范围 — 通过。
8. 切片：R3 容量合规（B1=5/B3=4 文件 T1 ≤30；B4 T2 9 文件 1 改动点；B5/B6 各 1 文件 1 改动点）；次序 B1(S1)→B2(S6)→B3(S2/S3)→R1→B4(S7)→B5/B6(S4) 符合 means.md；无 S5 批，R1 即 S7 开工前唯一复测，位置正确 — 通过。

## 改动台账（直接改入 02-design.md）

| # | 位置 | 改前 → 改后 | 原因与证据 | 实质 |
|---|---|---|---|---|
| 1 | O2 附带交付 | 豁免表达"硬编码 vs 标记待实施定" → 定稿：脚本内置 `PUBLIC_ENTRIES = new Set(['index.js'])` 硬编码豁免名单（附生态豁免注释），不改 index.js；明确不采用文件头标记方案 | 任务指定须定稿；标记方案需改 index.js，与 API 冻结口径（`git diff index.js` 恒为空）自相矛盾；index.js 实测为 2 行 `export { default… } from './table-ex.vue'` 公共入口（lang-js.md S1 生态豁免） | 是 |
| 2 | 批次计划 B5/B6 组合 | "T1 组合 + 探针基线 + 等价性校验点核对" → 补"行数与浅模块核对"（提取后单文件 ≤400 软线、新局部函数非透传） | verification.md 充分组合：T3 = T2 组合 + 等价性校验点核对，T2 组合含行数与浅模块核对，原组合缺项（测试计划覆盖范围） | 是 |
| 3 | 不做清单 N1 | "估算域符号唯一消费方是 controller.js:13-20" → "src 生产代码唯一消费方"，补记 self-checks/row-geometry.js:18-24 亦 import 估算域符号（拆分将新增 self-checks 同步点，强化不拆）；触发条件明确"src 出现第二消费方（self-checks 不算）" | 事实有误：`grep -n import self-checks/row-geometry.js` L18-24 含 computeRowHeights/ensureRowMeasured；不改变 N1 结论与批次 | 否 |
| 4 | 批次计划 B1/B2/B3 组合 API 冻结 | 病句"仅允许 B3 之外为空" → "于 B1–B6 全批恒为空（六个批次均不触及这两文件）" | 原句暗示 B3 允许 diff 非空，B3 实不触及 index.js/table-ex.vue，会误导实施者；措辞修正 | 否 |
| 5 | O6 消费方清单 | 补注：self-checks/row-geometry-controller.js:4 注释"假 ctx"等 self-checks 内 ctx 字样不在 B2 清零范围（自检只读冻结）；B2 残留扫描命令限 controller.js 本体，口径不冲突 | 防实施者误扩范围或验证者误判残留扫描失败；self-checks 只读冻结系设计既有约定 | 否 |
| 6 | 设计核验记录节 / 未解问题节 | 预留占位 → 填写核验命令与结果；两项未解问题处置写回（demo 服务实测 /data/table-ex/ → 200、/table-ex/ → 404 勿用；豁免定稿指向 O2） | code-reforge 步骤 4 出口要求；未解问题须逐项处置并同步正文（任务指定） | 否（预留落位） |

## 未解决异议（累计）

（空）
