# canvas-table 垂直锚解耦：实施记录（2026-10-28）

按 design.md 实施。审阅阶段发现方案 §5 两处遗漏，已在本次一并补齐：

1. **self-checks/painter.js 整文件未列入同步清单**（方案只列了 cell-painters/editor）。
   该文件受影响断言：槽位锚精确断言 `rowText(…, 54/90)` ×7 处 → 54.5/90.5；
   itemHits 命中矩形 `'208,45'`→`'208,45.5'`、`'44,20'`→`'44.5,20'`；编辑按钮区
   `'388,42,24,24'`→`'388,42.5,24,24'` 及传参 `lineHeight`→`rowHeight`；树箭头
   ±1px 容差断言不破（54.5/90.5 在容差内），仅注释口径同步。
2. **theme 夹具实无 rowHeight 字段**（§5 写「确认含」与事实不符）：self-checks
   painter.js / cell-painters.js 的 THEME 均补 `rowHeight: 36`，使锚断言走快照
   读取路径而非恒走回退分支。

## 改动清单（相对 design.md §4 的差异以 ▲ 标注）

| # | 文件 | 改动 |
|---|---|---|
| 1 | src/components/canvas-table/constants.js | 新增 `ROW_HEIGHT_FALLBACK = 36`；ROW_TOP_INSET 注释改新公式 |
| 2 | src/components/canvas-table/cell-painters.js | drawCell 锚式 `box.y + (rowHeight − ROW_TOP_INSET)/2`；局部 lineHeight 删除；文件头锚描述同步 |
| 3 | src/components/canvas-table/painter.js | paintTreeArrowAccent / paintEditorButton 同式替换；import 换 ROW_HEIGHT_FALLBACK |
| 4 | src/components/canvas-table/editor.js | editorButtonRectOf 选项 `lineHeight`→`rowHeight`，JSDoc 同步 |
| 5 | src/components/canvas-table/canvas-table.vue | isEditorButtonHit 传 `snapshot.rowHeight` |
| ▲ | src/components/canvas-table/constants.js | 删除死导出 `CELL_LINE_HEIGHT_FALLBACK`（改动后全仓库无消费方） |
| 6 | self-checks/cell-painters.js | THEME 补 rowHeight；fillText y 断言 18→18.5 系 7 处；button 命中 `'8,20'`→`'8.5,20'`；下划线 25→25.5 ×2；:713 零回归注记按新公式重述；槽位锚组名与残差注释改「行线中点」口径 |
| 7 | self-checks/editor.js | 默认参 y 6→6.5；tall 6→6.5；custom 换 `{ padding:12, rowHeight:44 }` 重算 [204,50.5,24,24]；offset 206→206.5 |
| ▲ | self-checks/painter.js | （方案遗漏）THEME 补 rowHeight；rowText 54→54.5 ×5 + length 断言 + M1 90→90.5；itemHits 45→45.5、44→44.5；按钮区 42→42.5；import 删 CELL_LINE_HEIGHT_FALLBACK；脏区/树箭头注释口径同步 |

## 验证（design.md §6）

1. ✅ demo 页自检面板 **163/163 通过**（http://localhost:3000/data/canvas-table/，
   console 仅存 img 夹具预期加载失败 error，与本改动无关）。
2. ✅ 默认 36px 行高：首行文字墨迹中心实测 54.25 CSS px，锚 = 行线中点 54.5，
   残差 −0.25px = 方案 §8 已记录的字体固有方差（改前该残差为 −0.75px，其中
   0.5px 为几何偏差）。
3. ✅ `--row-height: 48px`（inline 注入组件根，走主题观察 → 重绘联动）：行线实测
   84/132（行高 48 生效），行 0 锚 60.5 = 36 + (48+1)/2 精确行线中点，墨迹中心
   60.25（同 −0.25 字体方差）。
4. ✅ eslint 8 个改动文件 0 error / 0 warning。

## 备注

- 多行块余量与 R=48 场景的像素级断言由 self-checks 覆盖（数组/link 竖排 +
  超高行 tall 用例），浏览器级只验证锚联动，未重复截图测量。
- demo 页实际 URL 前缀为 `/data/<name>/`（demo/src/data/ 结构所致），与
  AGENTS.md「访问 http://localhost:3000/<name>/」表述不符，已沉淀知识库。
