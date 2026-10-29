# table-ex 垂直锚修正：centerY 与 lineHeight 解耦

状态：已实施（2026-10-28，见 01-impl.md；self-checks 163/163、demo 实测锚 = 行线中点）
公式决议：`centerY = box.y + (ROW_HEIGHT − ROW_TOP_INSET) / 2`

## 1. 现状

全文统一垂直锚（cell-painters.js:319）：

```js
const box = { ...rect, y: rect.y + ROW_TOP_INSET, height: rect.height - ROW_TOP_INSET }
const centerY = box.y + padding + lineHeight / 2   // 格顶 + 1 + 8 + 9 = 18
```

同式消费点：drawTextValue / drawArrayLines / drawLinkItems / drawItems / progress / button
（cell-painters.js）、树箭头 hover 重绘（painter.js:791）、编辑按钮 editorButtonRectOf
（editor.js:165，命中判定 table-ex.vue:739）。现行自检判据显式授权 ≤0.5px 偏差
（self-checks/cell-painters.js:778-780「终版判据授权 ≤0.5px」）。

## 2. 修改原因

### 2.1 恒定 0.5px 偏上（几何误差）

现行锚恒为 `1 + p + L/2 = 18`（默认值），而行线中点为 `(H+1)/2 = 18.5`（H=36）。
行线画在本格顶部 [0,1)、下行线画在下一格 [H,H+1)，两线间空白 [1,H) 的中点才是视觉
居中基准。偏差 (H−2p−L−1)/2 在默认配置下 = 0.5px，2x 屏呈 1 设备像素，实测截图可辨
（2026-10-28 会话实测）。自检授权的 ≤0.5px 即源于此，本方案将其归零。

### 2.2 lineHeight 语义耦合（稳健性缺陷）

锚是「垂直位置」，却依赖「行距」变量。lineHeight 同时进三条管线：行高公式
（row-geometry.js:135）、锚点（本式）、多行行距与 link 命中矩形高（cell-painters.js:810）。
当 lineHeight 设值错误且行高未随之重算时（等高模式 / `--row-height` 主导 / DOM 侧钉死
行高），全部内容垂直平移 ΔL/2——这是唯一能让绘制位置被配置错误破坏的通道。

### 2.3 隐含假设脆弱

公式仅在 `H = 2p + L + 1`（单行内容高 + 顶线）时精确。`--row-height` 一旦覆盖
（36 ≠ 34+1）假设即破；且「首行行框槽位」在行高由主题主导的行中无几何意义。

## 3. 新公式

```js
centerY = box.y + (ROW_HEIGHT - ROW_TOP_INSET) / 2
        // box.y = rect.y + ROW_TOP_INSET
        // 等价 rect.y + (ROW_HEIGHT + 1) / 2
```

- `ROW_HEIGHT` = 主题快照 `rowHeight`（theme.js:126 readPx '--row-height'），
  缺省回退 36（constants.js 新增镜像，模式同 CELL_LINE_HEIGHT_FALLBACK——editor.js
  不可 import theme.js 的模块隔离约束）。

性质（默认值 R=36 / p=8 / L=18 代入）：

| 场景 | 锚位置 | 说明 |
|---|---|---|
| 标准行（H = R） | rect.y + (R+1)/2 = 行线中点 | **精确居中**，与 lineHeight/padding 解耦 |
| 变高行（H > R） | 固定于格顶附近 | 贴顶槽位语义保留；单行格与多行格首行跨列同高（20261027 A1 判据不变） |
| 多行块余量 | 底部余量 = 2p + L/2 − (R+1)/2 = 6.5px | 与行数 n 无关，任何 n 不溢出 |

已知边界（记录，不做防御）：
- 不溢出条件 `R ≤ 4p + L − 1`（默认 51px）；R=48 夹具余量 0.5px 可用。
- `R < 2p + L`（行高设置低于内容下限，退化配置）时锚偏高 (2p+L+1−R)/2。

与旧值差异：R=36 下所有锚 +0.5px（18 → 18.5）；多行仅首行 y0 +0.5，行距不变；
R=48 时锚 24.5（旧 18，+6.5——旧值在该配置下本就偏离中点 6.5px，新值精确）。

## 4. 改动清单

| # | 文件:位置 | 改动 |
|---|---|---|
| 1 | constants.js | 新增 `ROW_HEIGHT_FALLBACK = 36`（镜像 row-geometry.js:18） |
| 2 | cell-painters.js:310,319 | drawCell 读 `theme.rowHeight`（回退 ROW_HEIGHT_FALLBACK）替换锚式；局部 `lineHeight` 仅剩 :319 消费，随之删除 |
| 3 | painter.js:788-791 | paintTreeArrowAccent 同式替换（theme 快照已可得） |
| 4 | painter.js:890-892 | paintEditorButton 传参 `lineHeight` → `rowHeight` |
| 5 | editor.js:165-168 | editorButtonRectOf 选项 `lineHeight` → `rowHeight`，默认值换 ROW_HEIGHT_FALLBACK |
| 6 | table-ex.vue:739 | isEditorButtonHit 传 `snapshot.rowHeight` |
| 7 | self-checks 同步 | 见 §5 |

无文档同步需求：`--cell-line-height` / `--row-height` 对外语义不变，锚公式为实现细节。
不涉及 mussel-ui skill / docs-site / quick-reference。

## 5. 自检断言同步（demo/src/data/table-ex/self-checks/）

- cell-painters.js：fillText y0 断言 18 → 18.5，顺次行 +0.5：
  :707 `[18.5, 36.5]`、:713、:730 `[18.5, 36.5, 54.5]`、:766、:785、:791、:806、:937
  `[18.5, 36.5, 54.5, 72.5]`；
  :691 button 命中矩形、:970/:999 下划线 y（= anchorY + round(fontSize×0.35) + 2 → 25.5）
  随锚 +0.5；:778-780 判据注释改「偏差已归零」。
- editor.js:584-607：默认参 centerY 18 → 18.5（area.y 6 → 6.5）；custom 参
  `{ padding: 12, lineHeight: 20 }` → `{ padding: 12, rowHeight: R }` 重算。
- theme 夹具确认含 `rowHeight`（cell-painters.js:75 邻域）。
- 像素断言注意：y=18.5 在 DPR 2 下落设备像素 37（整数，断言采样点 +1 设备px）；
  DPR 1 下为半像素（抗锯齿），如遇 assertPixel 失败改 assertHasDarkPixels 语义断言。

## 6. 验证方案

1. self-checks 全绿（同步后断言）。
2. demo 页截图测量：默认 36px 行高，canvas 文字 inkCenter 应 = (H+1)/2 = 18.5
   （对比法：/tmp/canvas-vs-input.html 同款量法；fontTools 实测中文墨迹中心与锚偏差
   ≤0.3px，「国」−0.30px 为已知字体固有方差，非本方案范围）。
3. `--row-height: 48px` 夹具 + 多行列：验证贴顶锚与多行块无底部溢出（余量 0.5px）。

## 7. 风险与回滚

- 单点公式替换，无持久化 / 对外接口 / DOM 侧行为变更；回滚 = 还原各消费点公式。
- 行为变化：默认配置下全部绘制内容垂直下移 0.5px（编辑态除外——编辑格 veil 跳过
  canvas 绘制，编辑器排版不经此锚）；自定义 `--row-height` 主题的垂直位置变化更大
  （向精确中点收敛），changelog 提示即可。
- 遗留决策记录：20261027 问题 1 Q2「统一槽位锚」的统一性保留（仍单公式、内容无关、
  overlay 逐值重合），仅槽位深度由 `padding + lineHeight/2` 改为 `(ROW_HEIGHT −
  ROW_TOP_INSET)/2`；「与改前 rect.y + h/2 逐值相等」的自检注记（cell-painters.js:713）
- 随本次失效，按新公式重述。

## 8. 证据附录（2026-10-28 会话）

- 36px 行高截图实测文字偏上 1 设备像素；几何推导：锚 18 vs 线间中点 18.5。
- `--row-height: 35px` 验证（inline style 直达组件根）：几何归零后仍余 ~1 设备px，
  归因字体墨迹方差（fontTools 实测 Hiragino Sans GB：「中」+0.01 / 「国」−0.30，
  SF 大写 −0.36）。
- canvas vs input 对比实验（35px、同字体同文字）：canvas 墨迹中心 18.0（行线中点），
  input 17.5（矩形几何中心）——两套「居中」基准天然差 0.5px；表格语境行线中点才是
  正确基准。
- 编辑态不受影响：veilEditingCell（painter.js:346）编辑中格跳过 canvas 内容绘制，
  编辑器排版不经本锚。
