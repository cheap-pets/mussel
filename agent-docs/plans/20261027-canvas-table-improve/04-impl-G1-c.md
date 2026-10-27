# 实施记录：G1-c（theme.js / interactions.js / canvas-table.scss）

模式：并发（波 1 / 步骤 G1-c）。基线 `mussel-table`（本组开始时工作区已有 G1-a 组对 constants.js / editor.js 的在途改动，未触碰）。

## 改动摘要

- **theme.js**（问题 7）：`readColors` 每色新增 `hover` 字段——12 彩色 `hover = color`（同色，无 -4 谱系，link.scss 先例）；5 语义色取 `--mu-{name}-color-4`，按设计用 `getComputedStyle(probe).getPropertyValue(...).trim()` 原始串读取（readFont 同款路径，非 readVar——变量被自定义主题裁剪时 readVar 求值回退为探针继承色无法区分「未定义」），未定义（`''`）回退同色。`colorsEqual` 补 `hover` 逐色比较；`readColors`/`colorsEqual`/`snapshotsEqual` 三处 docblock 同步（三形态、39 次 getComputedStyle 计数）。快照固定 20 字段数不变（colors 内部扩展）。
- **interactions.js**（问题 7，签名维持现状仅返回形状扩展）：`findHitItem` 返回对象透传 `disabled: entry.disabled === true`（缺字段得 false）；`resolveItemClick` JSDoc 更新 itemHits 条目形状（`{ kind, index, rect, disabled }`）与 `@returns`（含 `disabled: Boolean`）。无 tree 抑制（问题 8 组件零改动，未添加任何 tree 相关参数或分支）。
- **canvas-table.scss**（问题 2/3/6）：`.mu-canvas-table__header-shadow` `top: 0` → `calc(var(--head-row-height, 36px) + 1px)`（附注释说明 +1px 使 hairline 覆盖 `[headHeight, headHeight+2)` 不落 header）；`.mu-canvas-table__editor` 删除 `background: var(--mu-bg-normal)`，块注释改记「矩形 = 整格；内容遮蔽由画布侧 veil 承担」；`> .mu-input` padding 补偿基数 5→1px（`calc(var(--cell-padding, 8px) - 1px)`）、新增 `border-radius: 0`（方角贴格格缘，.mu-input 基础圆角 4px 会偏离格线并透行底色），注释同步（1 = 输入框边框）；textarea 四边 padding 同步 5→1px，注释按终稿问题 3 节表述更新（「首行文字顶」口径：画布统一槽位锚下任意列首行行框顶 = 格顶 + 上格线 1 + padding，与 textarea 首行顶恒相差上格线 1px）；borderless 块注释内「格左 + 5」随之同步为「格左 + 1（仅边框）」。

## 改动文件

| 文件 | 对应设计步骤 | 说明 |
|---|---|---|
| src/components/canvas-table/theme.js | G1-c（问题 7） | readColors 增 hover（语义 -4 原始串读取 / 彩色同色）+ colorsEqual 补 hover + 注释同步 |
| src/components/canvas-table/interactions.js | G1-c（问题 7） | findHitItem/resolveItemClick 透传 disabled，签名不变 |
| src/components/canvas-table/canvas-table.scss | G1-c（问题 2/3/6） | 阴影 top 下沿锚、__editor 删 background、padding 补偿 5→1px、border-radius: 0、注释同步 |

## 偏离

无。

（说明两点边界内处理，非偏离：① borderless 块注释中「格左 + 5」随补偿基数变更同步为「格左 + 1」，属追加约束「注释同步」范围，文件在白名单内；② eslint 对 .scss 无处理能力（本仓库亦无 stylelint 配置），scss 以 sass 编译校验代替，见自检。）

## 自检（G1-c 完成判据逐条）

| 判据 | 命令 / 方式 | 结果 |
|---|---|---|
| readColors 新字段 + colorsEqual | `node` 直调 `snapshotsEqual`（内部委托 colorsEqual）：同快照 true；仅 hover 差异 false；缺 hover 字段 false | PASS |
| disabled 透传纯函数 | esbuild 打包后 node 直调 `resolveItemClick`：disabled 条目返回 `disabled: true`；无 disabled 字段条目返回 `disabled: false`；未命中 null；签名不变 | PASS |
| 阴影/编辑样式 CSS 落地 | `node_modules/.bin/sass` 以 `$colors` 桩 + `@use "sass:map"` 编译 root.scss + canvas-table.scss → exit 0；产物含 `top: calc(var(--head-row-height, 36px) + 1px)`、`border-radius: 0`、两处 `padding: … calc(var(--cell-padding, 8px) - 1px)`，`.mu-canvas-table__editor` 无 background 声明 | PASS |
| eslint（仅本组 JS 文件） | `NODE_PATH=/usr/local/lib/node_modules npx eslint src/components/canvas-table/theme.js src/components/canvas-table/interactions.js` → 0 error / 0 warning，exit 0 | PASS |

## 遗留

- 项目 `node_modules/` 缺 eslint 相关包（仅 133 个顶层条目），本机 eslint 8.57.0 + 配置包在 `/usr/local/lib/node_modules`，需 `NODE_PATH` 前缀才能解析 `extends: standard`；上一轮（20261027-canvas-table-fixes）同命令可用的环境与本机现状不同。集成验证（V 步）跑 A10 全量 lint 时须留意该环境差异。
- 页面级验证未执行（G1-c 完成判据明确不跑页面；G1-a 删 EDITOR_GAP 后 self-checks 具名导入断裂，整包 boot 本就不可用，属设计内已知中间态）。
- 主题快照新增 hover 后，self-checks/theme.js 的 colors 形态断言与夹具 `THEME_COLORS` 需 G2-6/G2-3 改写，当前该组断言预期为红（设计内中间态）。
- `--mu-{name}-color-4` 原始串为具体色值（`src/colors.js` 产物，如 `primary4: #419de2`），非相对色 token，canvas fillStyle 可直接消费——设计「raw || color」落法成立，已核实。
