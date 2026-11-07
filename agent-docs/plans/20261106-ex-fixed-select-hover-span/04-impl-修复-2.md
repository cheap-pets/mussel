# 实施记录（修复轮 2：人工修订 2 / 验收标准 5 — column 列带合并格线残影）

前置输入：00-task.md（追加验收 5）、decisions.md（人工修订 2 裁定）、02-design.md、04-impl.md（colBandRegionsOf/hoverRegions 脏区扩展原始设计）、04-impl-修复-1.md（withClip 改动，未回退）。

## 根因（先定位后改）

`src/components/table/ex/table-paint/paint-gridlines.js` `colLineSkipIntervals`（修复前 :66-89）登记跳线分界区间时上界取 `Math.min(region.colTo, cols.to)`，而列带重绘（`paintColBand` → `paintColGridlines`，painter.js:111-141/124-137）实际绘制的竖线**含末列右缘线 `b = cols.to`**（c = cols.to - 1 的右缘）。区域与列带部分相交（`cols.to < region.colTo`）且 `b = cols.to` 落在区域内部（`b < colTo`）时，该内部线的 y 跳段丢失 → `paintColGridlines` 走 `!skips` 分支**整条全高补画** → 合并区域 B 内部格线显现。

触发链（与用户现象逐点吻合）：

1. hoverMode=column、hover B 上/下相邻行的边界列（`colBandRegionsOf` 对区域外普通格回退单列 `[col, col+1)`，use-pointer.js:95-116）→ 单区域 rAF 不合并整幅 → 走列带路径，画线 `b = cols.to` 恰为 B 内部线 → 跳段丢失 → 整条补画，B 内部格线残留；
2. hover 离开（pointerleave → 脏区仍是单列带）→ 再次整条补画 → **残留保持**；
3. 再次 hover 过 B（锚格 → `colBandRegionsOf` 区域扩展 `[colFrom, colTo)` 完整覆盖）→ 现状 from/to 计算在完整覆盖时恰好正确（`from = colFrom+1`、`to = min(colTo, colTo+…)` 不受上界缺陷影响）→ 跳段恢复 → **自愈**。

排除的旁路：`prepareSpansRegion` 对 `{cols}` 不扩展（painter.js:315-318）为既有正确设计（列带带高恒整高，region pass 按 rows 相交自然覆盖背景）；`paintSpanRegions` 相交判定（paint-body.js:188）口径正确，背景回画无残影——缺陷仅在网格线跳段登记。

## 改动文件

| 文件 | 对应问题 | 改动 |
|---|---|---|
| `src/components/table/ex/table-paint/paint-gridlines.js` | 人工修订 2（验收 5） | `colLineSkipIntervals` 跳段登记上界 `Math.min(region.colTo, cols.to)` → `Math.min(region.colTo, cols.to + 1)`（:66-84，1 行 + 注释）。画线范围上界 = `b = cols.to`，与区域内部线区间 `[colFrom+1, colTo)` 的交集上界应为 `min(colTo, cols.to + 1)`。完整覆盖（`cols.to ≥ colTo`）与区域不相交过滤（`colTo ≤ cols.from+1` / `colFrom ≥ cols.to`）两分支取值不变，零行为变化；仅部分相交时补回 `b = cols.to` 的跳段 |
| `demo/src/data/table-ex/self-checks/painter.js` | 人工修订 2（验收 5） | 新增 2 个独立检查项（追加 checks 末尾）：**断言 I**（修复前红）——共享 SPANS 夹具 colspan 区域 B（行 3 amount，[3,4)×[3,5)，内部竖线 x=419/y∈[144,180)，边界线 x=299/469）：基线整幅无内部线 → `invalidate({cols:[3,4]})`（hover 相邻行首列单列带）后内部线不显（高亮内混色口径）→ 移出后无残留、边界线照常；**断言 J**（回归绿）——`invalidate({cols:[3,5]})`（hover B 区域扩展列带）自愈保持 + 末列 `invalidate({cols:[4,5]})` hover 内部无线、B 右边界线照常不被误跳（含高亮内/外与移出三态） |

## 偏离

- 无。修复点独立于 02-design 缺陷 1/2 修复面（未触碰 paint-overlay.js / use-pointer.js）；断言 J 中 `blendColor(hoverBg, borderColorSoft)` 混色断言加容差 1（232×0.96=222.72 非整值，主画布 round 223 与 PROBE 探针 canvas floor 222 差 1/通道，两 canvas 合成取整路径不同——非缺陷信号；bgStripe 混色 250×0.96=240 为整值无此问题，断言 E 既有先例无容差正因如此）。

## 自检

### 红判据（修复前，浏览器像素级，playwright mcp）

自检面板 `http://localhost:3000/data/table-ex/`（onMounted 自动跑，真实在位 canvas + 真实 invalidate 链路）：**231/232**——基线 230 全绿 + 断言 J 绿（自愈路径回归）+ 断言 I 唯一红：

```
✗ column 列带合并格线残影：相邻行边界列 hover 后区域内部格线不显现（断言 I）
  hover 相邻行首列：B 内部竖线不显（高亮内混色） (419,150)
  期望 [240,240,240,255]（blend(hoverBg, bgStripe)），实际 rgba(222,226,231,255)
```

实际值 222,226,231 = blend(hoverBg, borderColorSoft)——残留线显现，人工意见缺陷在像素级复现。

### 绿判据（修复后）

- 自检面板：**232/232 全绿**（断言 I/J 通过，基线 230 含断言 A-H 无回归）。
- demo `spans` 场景真实鼠标（page.mouse.move 真实输入 + rAF 重绘，完整 use-pointer 链路；小计行 B = 行 7 × cols[5,8)，线色 [201,205,209]、B 行底色 [246,246,246]）：
  - hover 上方相邻行首列 (6,5)：B 内部线位置 (709,300) = 底色混高亮 [234,234,235] 非线色（无线）；区域外行 6 线段 (709,271) = [193,197,201] 照常画。
  - 移出表格：(709,300)/(799,300) = [246,246,246] 纯底色——**无残留**；行 6 线段恢复线色。
  - hover 末列 (6,7)：B 内部无线；B 右边界线 (929,300) = [193,197,201]（混高亮）照常画**不被误跳**；移出后恢复线色 [201,205,209]。

### 命令

- `npx eslint src/components/table/ex/table-paint/paint-gridlines.js demo/src/data/table-ex/self-checks/painter.js`：本轮新增代码 0 错误 0 警告；余 2 处 `spaced-comment`（painter.js:1256/1266）为基线 HEAD 既有（04-impl / 04-impl-修复-1 已记录同两处，非本轮 diff 触及），按范围克制不处理。
- `npm run build`：通过（330 modules；mussel.ex.min.js 332.60 kB / css 97.98 kB）。
- demo 服务本轮由本环境启动（派发称常驻实际未运行）：`npm run demo:build` 后台 watch（任务 exec_8ef1678c），改动经 watch 自动重建，验证即访问。

### 范围核对

`git diff src/components/table/ex/table-paint/paint-gridlines.js`：仅 colLineSkipIntervals 注释 + 上界 1 行。工作区其余改动（paint-overlay.js / use-pointer.js / self-checks/painter.js 前段 / agent-docs）均为首轮 04-impl 与修复-1 产物及知识沉淀，本轮未触碰。`.playwright-mcp` 目录已存在且含忽略规则，本轮快照不进入版本控制。

## 遗留

1. 验收 5 已闭环（红→绿 + 真实交互）；decisions.md「fast 检验须同批覆盖验收 4+5+既往 UNVERIFIED 4 项」属下一轮 verifier 派发范围。
2. demo watch 构建后台任务持续运行中，如需释放按端口 3000 定位进程结束。
