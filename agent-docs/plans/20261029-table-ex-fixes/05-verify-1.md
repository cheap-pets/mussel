# 验证报告（第 1 轮）

VERDICT: PASS

## 上轮问题核对（第 2 轮起）

不适用（第 1 轮验证）。

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|---|---|---|
| `npm run build` | 通过（exit 0） | 4 次 vite build 全部 `✓ built`（dev 282 modules / prod 282 / ex-dev 300 / ex-prod 300，mussel.js 410.33 kB、mussel.ex.js 649.25 kB） |
| `npx stylelint "src/**/*.scss"` | 通过（exit 0） | 零输出（无 scss 改动，符合设计基线） |
| `curl http://localhost:3000/data/table-ex/` | 200 | 验证环境在跑（实施偏离 1 重启的实例，直接复用） |

## 验收标准核对

| 标准 | 手段 | 证据 | 结果 |
|---|---|---|---|
| 1. tag/button/progress 文本垂直居中（\|偏移\| ≤ 1px） | 浏览器（playwright evaluate，canvas getImageData ink 行区间 vs centerY） | items 场景 6 组测量（dpr 1.5，luminance<170 ink 阈值，pill 边框按几何带排除）。参照 = 组件锚公式 `Math.round(rect.y+1+(36−1)/2+0.01)`（cell-painters.js:258）＝ 行 0/1 的 55/124.5→55/125：tag「新品/V4」row0 +0.15（vs 取整锚 55：−0.35）、row1 +0.12（−0.38）；progress「30%/75%」+0.81/+0.79（+0.31/+0.29）；button「编辑/详情」+0.15/+0.12（−0.35/−0.38）。两种参照口径下全部 \|offset\| ≤ 1px | PASS |
| 2. 夹具切「多行文本」格线随精算行高重绘 | 浏览器（evaluate + getImageData 全宽带扫描） | 切场景（无滚动）后 `getLayoutInfo()`：rowGeometryMode=variable、contentHeight=**444**（精算 = 36+196+70+142；估高应为 354）。全宽格线实测 css **232.58 / 302.56**（设备行中心口径），与精算累加 232/302 吻合；估高旧位 284、354 邻域（±5px）扫描 0 墨迹像素。触发条件分析已记入 04-impl.md「复现数据汇总」且代码路径属实（table-ex.vue relayoutAndRedraw 尾部三连 remeasureVisibleRows + recomputeViewWindows + redraw） | PASS |
| 3. isLeaf:false 无子级 → 三角 + tree-expand + 回填 + 展开 | 浏览器（像素 + 事件日志 + 数据断言） | ① 箭头槽（cell.x+6~26css × center±8）ink：懒根 A/B **114/120 px** 实心三角，普通叶 C 仅 18 px（文本边缘噪声，xDev 29 贴窗右缘）；② 新浏览器会话真实 `page.mouse.click` 槽心 → 日志 `tree-expand {"key":200001,"record":"#200001","level":0}` + `update:tree-expanded-keys [200001]`；③ 回填后 records **3→6**、contentHeight **144→252**、`.mu-table-ex__scroll` scrollTop=**0**（不闪顶）；④ 再次真实点击 → `tree-collapse {"key":200001,...}`、keys=[]、contentHeight 回 144、数据保留（stage 6 不重复加载）；⑤ 自检套件重跑 **187/187** | PASS |
| 4. build + stylelint | 命令 | 见「命令结果」：4×vite ✓、stylelint exit 0 | PASS |
| 1-回归. 多行文本/link 下划线、普通树 toggle | 浏览器 | link hover（合成 pointermove，cursor=pointer 证实 hover 生效）：下划线 = **1 设备行连续暗带**（run 119 全带宽，yDev 39），与字形末行（yDev 37）隔 1 空行——位于字形下方、不脱节、不穿字；普通树场景真实点击 → `tree-expand {"key":1,...}`、keys [1]、contentHeight 72036→72216（既有行为无回归） | PASS |

### 派发指定偏离项重点复核

- **偏离 2（#4b 响应式依赖，use-tree-rows.js childrenIndex `void props.recordsVersion`）**：行为证实——回填 setTimeout 后仅凭 `recordsVersion++` 子级行即出现（3→6、ch 252），无滚动、无二次 toggle。补救与裁定 #4b 目标一致且必要（普通数组就地 push 不触发 computed）。
- **偏离 3（#6 度量口径，cell-painters.js `centeredTextAnchor`）**：代码证实——度量在 `textBaseline='alphabetic'` 状态下取（probe 与 offset 两处均恢复原 baseline）、缓存键并入 `ctx.__muTextAnchorCapable` 实例能力位（stub 回退隔离）；行为证实——6 组 ink 偏移 ≤1px（若误用 middle 态口径会偏 −4px 量级），含 stub ctx 的自检（painter y=55 原值）187/187 通过。
- 偏离 4（回填行数 3→6）：实测 3→6，与设计 §5 伪代码（每父 3 子）一致；测试计划「3 增至 9」为算术误写，实施已记录，裁定合理。
- 偏离 1（:3000 重启）：服务存活且全程可用（HTTP 200），本次验证直接受益，无需再启停。

## 范围核对

- 基线：`mussel-table` @ `1c8f326`，与 00-task.md 一致。
- `git status --short`：10 个修改文件 = 设计「改动清单」逐一对应（src 6：cell-painters/tree/interactions/painter/use-tree-rows/table-ex.vue；demo 4：main-view.vue + self-checks×3），无清单外改动。HEAD 未移动（无 commit）。
- 未跟踪：`agent-docs/plans/20261029-table-ex-fixes/`（任务目录，排除）。
- 验证产物：`dist/`（构建输出，.gitignore 覆盖）、`.playwright-mcp/`（自带 `*` / `!.gitignore`，合规）。均不入 status。
- 无法区分 / 设计外改动：无。并行白名单：不适用（串行实施）。

## 测试质量问题

无。新增自检为值级断言而非「不抛错」：tree.js 断言 expandable 五态语义（未映射关闭/`===false` 触发/`===true`·缺字段不触发/有子级不变/展开懒节点行集不变/新旧形态回退/树关恒 false）；interactions.js 断言 expandable 形态槽内可 toggle 与旧形态回退；cell-painters.js 既有像素断言按 `TEXT_ANCHOR_OFF` 口径适配而非删除。

## 需人工检查

无。设计未标人工项；文本居中已由像素断言覆盖（ink 中心 ≤1px），无需另行目视。

## 环境阻塞

1. **首个 playwright 会话 CDP 真实输入不投递**（`page.mouse.click` 对 canvas 无事件、DOM 按钮真实点击 30s 超时；与 04-impl.md 记录的会话级怪癖一致）。处置：`browser_close` 后新开会话，真实 `page.mouse.click` 正常——验收 3-②/④ 最终以设计字面手段（真实鼠标点击）验证通过。期间曾用页面内合成 `MouseEvent('click')`（同 clientX/Y 命中测试、同组件监听器链路）取得一致结果作为过渡证据。影响：无（已消除）。
2. **后台页定时器节流**：会话内 `document.hidden=true`，300ms setTimeout 实测 731ms——首次等待 750ms 未见到回填，延长等待后确认回填发生（非组件缺陷，属 02-design.md 已知坑「后台页 rAF/RO 停发」同类）。影响：无。

## 失败项

无。
