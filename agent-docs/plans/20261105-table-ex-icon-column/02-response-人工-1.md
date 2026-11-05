# 人工意见回应（第 1 轮）

对象：02-design.md 修订 3 → 修订 4。输入：03-human-1.md（K-1～K-4）、decisions.md「确认门裁决」。

## 评审回应（第 1 轮）

| 问题编号/位置 | 结论 | 修改说明或理由证据 |
| --- | --- | --- |
| K-1a 03-human-1.md:3（editButton 选方向 A） | 接受 | 未解问题 1 定案方向 A：删除方向 B 论述，「未解问题」节清空并标注已裁决；「editButton 改造」「风险与回滚」改已裁决态（无兼容层、回滚须同步回退协议/事件名/符号改名）；新增「破坏性变更与迁移指引」节（svg 串 → `installIcons` 注册名、`onClick` → `@edit-button-click`、图片 URL 无替代、键名改 `editButton`，含迁移示例）供发布说明直接引用 |
| K-1b 03-human-1.md:3（editorButton 改名 editButton） | 接受 | 全局改名：协议键 `column.editButton`、事件 `edit-button-click`、符号 `isEditButtonHit`/`tryEditButtonClick`/`paintEditButton`/`editButtonRectOf`、常量 `EDIT_BUTTON_AREA`/`EDIT_BUTTON_ICON_SIZE`（以 git grep 全部 43 处命中逐一核对：src 4 文件 + demo 3 文件）；破坏性变更面与方向 A 合并表述（v4.2.0 引入的既有协议键，`1c8f326`）；实施清单片 3 扩为改名条目（constants.js/editor.js/self-checks 引用同步）。旧名仅保留于三处必要位置：修订历史日志、「现状依据」基线描述（一次性标注改名映射）、改名动作与迁移映射表——目标态章节零旧名 |
| K-2 03-human-1.md:4（icon color 上提 column.color） | 接受（确认无需改动） | 修订 3 已落实 `column.color`；本轮全文 grep 复核：现行协议仅 `iconOption.size`（02-design.md:84），`iconOption.color` 仅存于修订历史与冲突点表历史记录列，非残留 |
| K-3 03-human-1.md:5（可以开始实施） | 接受（确认） | 设计不再挂起；按「实施清单」片 1→2→3 串行进入实施（decisions.md 确认门已放行 (fast 实施 + fast 验证) × n） |
| K-4 03-human-1.md:6（码点解析应在图标 install 时） | 接受 | 推翻 D1 落实：`install`（src/icons/index.js:12-81，公开别名 `installIcons`，src/index.js:6,66）注册 cls 项时同步离屏解析，五点定案入「码点解析」节——a) 注册表项扩展 `{ cls, glyph, fontFamily, glyphStatus }`（glyph 不参与 hash，icons/index.js:29）；b) 两跳重试（`fonts.ready` + rAF 兜底）归属 icons 模块，仍失败 → failed + dev warn，解析元素常驻容器触发字体懒加载；c) SSR 防御 `typeof document === 'undefined'` 跳过（install 在 src/index.js:55 位于 isBrowser 块外，服务端会被调用）；d) cell-painters 的 glyphCache/resolveIconGlyph 状态机删除，`drawIconGlyph` 直读注册表项，pending → `whenGlyphReady` 桥接重绘；e) 同名重注册且同 cls 已 ready → 继承 glyph 字段（幂等）。实施清单更新：icons/index.js 入片 1 步骤 1，cell-painters 条目缩减，「冲突点与处理」D1 行改已裁决态 |

补充说明：修订 2 历史事实节中「`resolveIconGlyph` 私有需共享导出」一条与 K-4 矛盾，已加过时标注（该函数随 K-4 取消，解析挪至 icons 模块）。
