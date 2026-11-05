# Decisions

## D1 iconfont 码点获取：渲染时构建虚拟节点解析，不扩 install 协议

- 备选：① install 时显式存 char（`{ cls, char }`）；② 渲染时离屏节点 `getComputedStyle(el, '::before').content` 解析 + 永久缓存。
- 裁决：②（用户拍板，install 不加 char）。
- 性能对比结论：两案均为「解析一次 → 永久缓存」，渲染时解析的成本仅为每图标名一次 getComputedStyle（微秒级、首帧一次），性能非决策关键。
- ②的真实代价：首帧早于样式表就绪时解析失败，需 pending 重试 + 就绪回调重绘；收益：用户无感、码点始终读真实 CSS 不漂移。
- 缓存键 = cls 串，无容量上限（glyph 结果不随数据/主题变化，与 imageCache 不同）。

## D2 svg 形态复用 requestIconImage 管线

- `cell-painters.js:105` 既有先例（svg 串替换 currentColor → data URL → requestImage 缓存 → drawImage，painter.js paintEditorButton 在用）。
- iconfont fillStyle 直接传色，无需按色分键（与 svg 的 color 参与缓存键不同）。

## D3 条目协议走 kind 平铺（v2 list/tag 路线）

- 新类型不做 is/class 回退形态（check/img 未改造路径不效仿）；`resolveItemKind` 的 `item.kind` 优先直通 `'icon'`，painter 主干零分发改动。
- dom 通道单独产 `{ is, attrs, events }` 形态（仿 list.js domItemOf）。

## 修订轮追加（2026-11-05）

- [用户修订要求] D4 icon 列收敛为单图标：仅支持 icons 注册表内图标，不支持 img，支持 color 设色 — 推翻原设计 value 数组多条目与对象直传形态。
- [用户修订要求] D5 button 列支持图标按钮 — 新增范围。
- [用户修订要求] D6 editButton 仅支持已注册图标，onClick 属性改为类似 links item click 的 emit 方式 — 新增范围。
- [用户修订要求] 性能与 API 便利程度为修订核心权衡维度 — 贯穿三轮修订。
- [调度] D1–D3 与 D4–D6 冲突处以后者为准；冲突点由修订轮在产物中列出。

## 确认门裁决（2026-11-05，人工放行）

- [确认门] 未解问题 1 裁决：方向 A，editButton 旧形态直接移除不留兼容层，发布说明附迁移指引 — 用户拍板。
- [确认门] editorButton 改名 editButton，事件名同步改（editor-button-click → edit-button-click），代码符号一致改名 — 用户新增，破坏性变更面扩大（协议键 + 事件名）。
- [确认门] icon 列 color 上提 column.color 认可 — 维持修订 2/3 定案。
- [确认门] 推翻 D1：iconfont 码点解析时机改为「图标 install 时」（install 流程内自动解析、结果存入注册表项，用户仍无需显式传 char），非表格渲染时 — 取代 D1；install 时样式/字体未就绪的重试与 SSR 防御由修订定案。
- [确认门] 放行实施：(fast 实施 + fast 验证) × n（n ≤ 2）。

## 二轮设计调整裁决（2026-11-05，用户）

- [用户调整] button pill 高度改为 --mu-control-height-small（取代 TAG_HEIGHT 20 恒定值）。
- [用户调整] button 不支持图标与文本并存；有文本时文本优先（图标忽略）——icon+caption 形态删除，仅存 icon-only / caption-only。
- [用户调整] 图标按钮（icon-only）宽高一致 = --mu-control-height-small，图标水平垂直居中。
- [用户调整] 本轮实施顺带修复上轮遗留缺陷（ellipsizeButton 裁剪检查顺序，05-verify-终-2.md 失败项 1）。
- [用户流水线] 二轮流水线：primary 调整设计 → peer 修订设计 → primary 修订设计 → (fast 实施 + fast 验证) × n（n ≤ 2），无确认门。
- [调度] 上轮终验 UNVERIFIED（tooltip 矩阵子断言被中断）随本轮实施一并补验；面板 warn once 非幂等属测试基建小问题，验证以 fresh 首跑为准。
