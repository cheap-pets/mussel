# 实施记录：G1-b（cell-painters.js）

模式：并发波 1 / 步骤 G1-b。白名单：`src/components/table-ex/cell-painters.js`（仅此文件）。
设计依据：02-design.md 问题 1（槽位锚终版）、问题 5（requestIconImage）、问题 7（linkHoverColorOf/悬停下划线/按钮反转/itemHits disabled）及「接口 / 数据结构」节。

## 改动文件

| 文件 | 对应设计步骤 | 说明 |
|---|---|---|
| src/components/table-ex/cell-painters.js | G1-b（问题 1/5/7） | 见下 |

改动摘要（296+/97−）：

- **问题 1（槽位锚 + rightInset）**
  - `drawCell` 新增 `rightInset = 0`、`hoverItem` 参数（painter 注入契约，缺省按设计接口节）；构造 `box = { ...rect, y: rect.y + ROW_TOP_INSET, height: rect.height - ROW_TOP_INSET }`（宽度不减，与估高 contentWidthOf 同式）与 `centerY = box.y + padding + lineHeight/2`，向下贯穿全部子绘制。
  - 垂直锚统一为槽位式：单行省略（原 `rect.y + rect.height/2`）、树箭头（drawTreeAffordance）、横排 items、progress、button、多行三路径首行（wrap / 数组 / link 竖排）全部改用 `centerY`；后续行 `+= lineHeight`（原有）。
  - 删除 `multilineBlockTop`（块整体居中口径作废），未引入 clip。
  - `textAnchorX` / `itemsStartX` 增 `rightInset`：center 分支 `rect.x + (rect.width − rightInset) / 2`（items 再减 offset）；left/right 锚不动。
  - 命中矩形：`drawItems` / `drawButton` 同时持有绘制矩形（box 派生）与整格 `cellRect`，`reportHitRect` 与 button 的 `onItemRect` y/height 传整格（itemHits rect 保持整格语义）；`drawLinkItems` 逐行命中矩形随 lineY 自动跟随新锚（未改整格）。
  - `ROW_TOP_INSET` 自 `./constants` 导入（G1-a 并行落地前曾以本地同值常量过渡，G1-a 落地后按设计改动清单切换为 import，最终态与设计一致）；`FALLBACK_LINE_HEIGHT` 本地副本按设计保持不动。
- **问题 5**：新增导出 `requestIconImage(icon, color, onLoad)`——含 `<svg` 的串经 `/currentColor/gi` 替换着色后转 `data:image/svg+xml;charset=utf-8` data URL，委托既有 `requestImage`（缓存条目返回，同参复用同一条目，着色串入缓存键）；非 SVG 串按 src 直通。
- **问题 7**
  - 新增导出 `linkHoverColorOf(item, theme)`：disabled → textColorMuted；`colors[name].hover ?? colors[name].color`；未知名/无 class → primaryColor。
  - link 悬停下划线：`drawLinkEntry`（竖排）与 `drawItemText`（横排）共用 `linkUnderlineY(anchorY, fontSize)`（`anchorY + round(fontSize×0.35) + 2`），命中时 `fillRect(x, underlineY, 实绘宽, 1)`、fillStyle 即 hover 色；悬停判定经共用 `isLinkEntryHovered`（hoverItem kind/index 命中且非 disabled），两条路径覆盖。
  - `drawButtonPill` 悬停反转（命中且非 disabled）：底/边框 = `colored?.color ?? theme.primaryColor`、文字 = `theme.bgNormal`；disabled 保持常态。
  - itemHits 条目携带 `disabled` 布尔（`isTruthyAttr` 口径）：`reportHitRect`（tag/link 横排）、`drawLinkItems.report`（竖排逐条，dots 条目 false）、`drawButton`（读 `button.disabled`）。
  - 模块头注释同步（槽位锚公式、问题 5/7 通道）。

## 偏离

无。（过程说明：ROW_TOP_INSET 因 G1-a 并行未先落地，曾以本地同值常量落地以满足本组直调判据；G1-a 落地后已切换为设计要求的 `import { ROW_TOP_INSET } from './constants'`，最终态与设计改动清单一致，非偏离。另为满足 eslint complexity ≤10 / max-len 120（基线 0/0）抽取三个纯助手 `isLinkEntryHovered` / `cellLineHeightOf` / 局部 `underlineWidth`，无行为差异；drawButton 增第二矩形参数系按接口节「itemHits 条目 rect 仍为整格矩形」契约落实。）

## 自检

- `NODE_PATH=/usr/local/lib/node_modules npx eslint src/components/table-ex/cell-painters.js` → **0 error / 0 warning**（本地 node_modules 不含 eslint-config-standard，ESLint 配置经全局 NODE_PATH 解析；初跑 8 warning 已全部修复：6 处长行折行、drawLinkItems 复杂度 13→9）。
- 直调观察 harness（esbuild bundle + stub ctx，已清理临时文件），**52 项断言全部通过**，覆盖 G1-b 完成判据：
  - 单行 h=36：y=18（= 改前 `rect.y+h/2` 逐值，零回归）；rightInset 1 → center x=79.5、left x=8、right x=152（left/right 不受影响）。
  - wrap 多行：h=60 两行 [18,36]、h=80 三行 [18,36,54]；数组路径 h=88 三行 [18,36,54]；link 竖排 h=88 四行 **[18,36,54,72]**——首行恒 18，不随行高变。
  - 树箭头 h=36 与 h=60 收起三角 y 点 [13,23,18] 相同（centerY=18，槽位锚与行高无关）；progress 轨道 y=14.5、tag/button pill 顶 y=8.5（h=36 与 h=60 一致）。
  - 横排 items center：rightInset 0→1 pill x 52.5→52（左移 0.5px）。
  - link 悬停（竖排 + 横排两路径）：fillStyle = colors.danger.hover / 彩色同色；fillRect 下划线 y=25（18+5+2）、宽=实绘文本宽；disabled 条目不悬停（muted 常态色）；无 hover 无下划线。
  - button 悬停反转三色（底/边框=colored.color、文字=bgNormal）；disabled pill 不反转；常态底色不受影响。
  - itemHits disabled：竖排 [false,false,true,false]、横排 tag/link、button；横排/button 命中矩形 y/height 保持整格（[0,36]）。
  - linkHoverColorOf 五分支（语义 hover / 彩色同色 / 无 hover 字段回退 color / 未知名 primary / disabled muted）。
  - requestIconImage：data URL 前缀、currentColor 两处（stroke/fill）全替换、同参同条目、异色分键、crossOrigin=anonymous、非 SVG src 直通入缓存。
- 未跑全量 eslint / demo 页面 / 构建（并发模式：G1-a 删 EDITOR_GAP 后 self-checks 具名导入断裂，整包不可 boot，页面级验证不在本组）。

## 遗留

- self-checks/cell-painters.js 的 :661/:684/:720/:851 断言暂红（预期中间态，改写归 G2-3）；:667 单行锚 18 仍绿。
- painter.js 尚未注入 rightInset（S4）→ `drawCell` 用缺省 0，居中列水平锚临时为改前值（80）；S4 落地后变 79.5。垂直锚不受影响。
- requestIconImage 的 SVG data URL 在目标浏览器的 onload 行为为本路线唯一未验点（设计 R5），归浏览器验证阶段处置。
- eslint 需 `NODE_PATH=/usr/local/lib/node_modules` 前缀运行（环境备注，非代码问题）。
