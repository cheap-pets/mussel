# 交叉回应 1（designer / pipeline-primary，r=1）

对 06-amend-1.md 改动台账 14 项实质改动逐条回应；非实质 6 项（#15~#20）经抽查已正确落地（decisions 引用编号与 decisions.md 10 条逐一比对无误），按契约无需回应。所有接受项改动已由审改员改入 02-design.md，本轮复核源码属实并保留。

## 交叉回应（第 1 轮）

| 编号/位置 | 结论 | 修改说明或理由证据 |
|---|---|---|
| #1 resolveCellContent 统一数组门控 | 接受 | 保留于方案概述 P2 / 改动清单 cell-painters ② / 测试 A9；复核 `resolveCellContent`（cell-painters.js:217-232）：`_plainText` 短路（:226）在取 value 之后，门控置于其前可覆盖直渲路径；非字符串 type 豁免有据——`resolveColumnType` 直接透传非字符串 type（column-types/index.js:33） |
| #2 非 link 项回退 theme.textColor | 接受 | 保留于概述 P2 / 清单 ④ / 接口 canvas 产物；现状 `linkTextColorOf` 无 color 恒回退 primaryColor（cell-painters.js:707）核对属实 |
| #3 listOption.link + 兼容壳 link:true | 接受 | 保留于接口 listOption 定义与壳委托对象；否则 link 列条目全落 span 无 click（与 decisions 第 4 条冲突），改动必要 |
| #4 listItems 透传 (record, value) | 接受 | 保留于接口签名与壳委托；`valueToLinks(record, value)` 依赖 field 值（link.js:9-18）核对属实 |
| #5 payload column = _raw ?? column | 接受 | 保留于概述 P4 / 接口 payload；canvas 侧 `emitCellItemClick` 现状即 `col._raw ?? col`（table-ex.vue:1174）核对属实 |
| #6 非 link 项不消费 color | 接受 | 保留于条目解析规则 / DOM·canvas 产物 / 测试 A4；decisions 第 3 条仅裁决 link 项颜色 |
| #7 全条目点击 + hover 门控 | 接受 | 保留于概述 P2 / 清单 ⑤ / 产物 events·onItemClick / 步骤 4 判据；`isLinkEntryHovered` 横竖排共用（cell-painters.js:892-896，消费点 :866/:1098）一处追加即双路径生效；`drawLinkItems` report 现状即全条目（:1093，`drawn > 0` 判定） |
| #8 self-checks 三文件纳入 | 接受 | 保留于改动清单与步骤 6；grep 复核其余自检（editor/interactions/layout/text-wrap/theme/tree/painter）无 link 产物结构断言、无数组拆行断言、无 cell-item-click 断言（editor 数组开值为编辑链路、painter 的 `type:'link'` 仅作 hit 夹具且断言像素非空——:834 单值改走 list 后仍非空），三份覆盖判断成立 |
| #9 multiline strings/nums 改 list | 接受 | 保留于清单 demo/table-ex ②；demo `multilineColumns` 夹具核对属实（main-view.vue:599-615，`strings` maxItems:3 在 :605）；tooltip 溢出用例语义变化由「列注释同步」+ 清单 self-checks cell-painters :1833-1858 更新覆盖 |
| #10 dev 警告走 utils/warn | 接受 | 保留于遵循约定 / 条目解析 / 测试终验；`warn({ component, message })` 默认 `once: true`（src/utils/warn.js:6-19）、`isDev = __env__ === 'development'`（src/env.js:3）核对属实 |
| #11 删 resolveTooltipText 数组分支 | 接受 | 保留于概述 P2 / 清单 ⑥；该分支存在（cell-painters.js:1469-1481）核对属实，绘制路径删除后保留即与 A9 矛盾 |
| #12 A3/A6/A7/A9 夹具补充 | 接受 | 保留于测试计划与 demo 清单；data/table `linkColumns`（:160-172）确无 danger/color 夹具、table-ex `linkReferenceColumns`（:832-834）存在，核对属实 |
| #13 步骤 4 判据改 A6 正向断言 | 接受 | 保留于实施步骤 4 |
| #14 ListColumn 缺省仅接受数组 | 接受 | 保留于遵循约定值归一条 / 条目解析值形态 / demo 标量夹具 / A4 断言；A4「仅接受数组值」要求，单值包装收敛在壳内 valueToLinks |

## 未解决异议（累计）

无。06-amend-1.md 未解决异议为空，无待回应项。

## 接受后补充修正（本轮核对新发现，非台账项，已改入 02-design.md）

1. 同名键注记：`column.link` 在 canvas 专属 button 列已有「链接形态按钮」语义（cell-painters.js:1513、demo data/table-ex main-view.vue:681 夹具），text 列 `link` 选项同名不同义——已补入「遵循约定与复用」，避免实施/验证混淆。
2. 片1 步骤 1 完成判据依赖 demo 夹具但文件集合不含 demo 文件——判据补「可临时列验证或与步骤 3 合并复核」缓冲语（与步骤 4 判据同式）。
