# 实施记录（修复第 1 轮，整体 k/R=1/1）

## 改动文件

| 路径 | 修复的问题编号 |
|---|---|
| `demo/src/data/table-ex/self-checks/editor.js` | 失败项 1（终验「demo 自检全绿」199/200） |

修复内容：`resolveEditorProps` 块夹具（:519-525）`type: 'text'` → `'enum'`，并同步一行注释。该夹具原以 `text + mappings` 构造 select 来源断言 options 注入；A6 改动后 text+mappings 解析为 input，`resolveEditorProps` 仅 `editorType === 'select'` 注入 options（`src/components/table/ex/editor.js:250-252`），故 options 为 undefined。夹具改用 enum（与同文件既有 enum 夹具式样一致，self-checks/editor.js:131/:430 `{ type: 'enum', editor: true, mappings: {...} }`）。断言意图「select 缺省注入 resolveSelectOptions 产物」与期望值均不变：`selectOptionsFromMappings` 排除 `default`（`src/components/table/mappings.js:27-32`），`{ a: 'A', default: '兜底' }` 产物 `[{ value: 'a', label: 'A' }]` 与原断言逐字一致。

## 偏离

无。修复方向与验证报告失败项 1 的定位方向一致（夹具未同步，非源码缺陷），未扩大改动面，未触碰已通过项。

## 自检

| 命令 / 手段 | 结果 |
|---|---|
| `npx eslint demo/src/data/table-ex/self-checks/editor.js` | 0 错误（首次运行报 spaced-comment 1 error——注释 `//（` 后无空格，改写注释格式后复跑通过） |
| `npm run build` | exit 0（三段构建，`dist/mussel.ex.js 673.02 kB` / `dist/mussel.ex.min.js 314.61 kB`，`✓ built in 566-572ms`） |
| demo 自检面板 `http://localhost:3000/data/table-ex/` | **200/200 通过**（修复前 199/200）；修复项所在条目「resolveEditorProps：number/currency 注入 type=number、props 透传、select options 注入」✓ |
| console error 核对 | 仅 1 条 `net::ERR_INVALID_URL data:image/png;base64,AAAA…`——既有夹具 badSrc（self-checks/cell-painters.js:742）「损坏 data URI 直通」预期副产物，验证报告环境阻塞第 2 项已确认非本任务引入，未新增 |

## 遗留

1. 环境阻塞 1 项（等级列横向滚动交互受阻，影响 A5 等级格 select 交互子项未亲验）：不属本轮修复范围（派发明示），维持原状。
2. 04-impl.md 遗留 1-3 不变：`table-ex-scene` 页状态列夹具未同步、enum 显示语义收敛提醒、文档三处同步（按 decisions 推迟至用户确认后）。
