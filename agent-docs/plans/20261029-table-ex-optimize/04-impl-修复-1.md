# 实施记录 — 修复 1（I2 验证 PASS 后发现项）

单点修复，不计入实施循环。2026-10-30。

## 改动文件

| 文件 | 对应发现项 | 说明 |
|---|---|---|
| `src/components/table/ex/cell-painters.js` | 05-verify-1.md 发现项 1 | `measureItem`（:815）img 分支补 `!src` 空值守卫：`const src = item.attrs?.src; if (!src) return null`，与绘制端 `drawCellImage`（:1265 既有 `if (!src) return`）同款口径对齐。最小化改动，无其他重构 |

修复前：`requestImage(item.attrs?.src, ...)` 收到 `null` → `image.src = null` 被浏览器转为相对路径 `"null"` → 发起一次 `GET /data/table-ex-basic/null` 404（demo 基础页 `img: null` 夹具触发）。修复后测量端与绘制端一致：空 src 不建缓存条目、不发起请求，宽度按空格处理（`return null`，测量失败条目不占位——`layoutItemPositions` 既有语义）。

## 偏离

无。

## 自检

| 检查 | 结果 |
|---|---|
| `eslint src/components/table/ex/cell-painters.js` | 零输出（无 error/warning） |
| `npm run build` | 4 次 vite build 全部 ✓ |
| demo 自检（`:3000/data/table-ex/` 重跑自检） | **187/187 通过** |
| playwright 网络复核（基础页加载，`page.on('request'/'requestfailed')` 监听 + performance resource entries） | **无任何 `/null` 请求**（修复前每次页面加载一次 404） |
| 图片列渲染不回归（列型表横向滚动到底，画布 ink 扫描） | 行 0 svg data URI 图片正常渲染（图片列区段彩色 ink 1802 px）；行 1 `img: null` 空占位无请求 ✓ |

## 遗留

无（发现项 2 为测量协议备忘，属 verifier 后续轮次口径建议，无代码改动）。
