# table 列类型体系 v2：类型协议、enum/color、compile 双通道

## 结论

### 列类型与数组策略

- text 列：`link: Boolean` 渲染链色文本（color 转 `.text-{color}`，双端 hover 下划线 + pointer 光标，canvas 20261106 起同口径）；不接受数组值（compile 门控落占位链）；无 danger 支持（红色用 `color: 'danger'`）；multiline/lineClamp 保留。
- list 列（新增）：仅数组值；条目 = `string | number | { label?, color?, disabled?, ...任意属性 }`；label 为标准键（caption 兼容并开发期警告）；`link` 是 column 级选项、整列全 text 或全 link（条目级 link 键无效，作为任意属性原样透传）；每项单行超长省略；条目点击 emit `cell-item-click`，payload `{ record, column, item }`（item 含 id 等扩展键原样传出；DOM 无 recordIndex，canvas 含）。
- link 列：兼容壳，内部构造 list 语义列对象委托 ListColumn.compile（`col.type` 保持 `'link'`，canvas 侧 type 字符串分发无感）；`danger: true → color 'danger'`、disabled 保留、条目 color 键激活；DOM 布局竖排每项一行（canvas 本就竖排）。
- 数组策略：table-ex（canvas）除 list 外一律不拆行（text/number/bool/date/enum 数组值落占位恒 1 行）；DOM 侧 text 数组同样落占位。

### enum 列

- `type: 'enum'` 已注册（无废弃警告），align 缺省 center；显示映射独占 `mappings/options`（`EnumColumn.compile` 内 createDisplayMapper，双端同源）：mappings 优先、仅 options 时转换为显示映射、default 键回退；text 等其他类型不读映射；编辑态由 ex/editing/editor.js COLUMN_TYPE_EDITORS 映射为 select。

### color 参数

- text/bool/number/currency/date/datetime 支持 `color`（色名 | `(record, value) => 色名`）；DOM 通道落 `text-{c}`，canvas 通道产物 color 属性直出。
- tag 列 color 直取：DOM 恒落 `text-{c} + bg-{c}-translucent`（缺省 gray），画布 item.color 查 theme 快照 colors（gray 走 gray/hoverBg）；mu-tag--{color} 色类体系已废弃（tag.scss 仅剩 mu-tag--pill/flat 形态类）。

### compile(column, dom) 双通道协议

- `dom=true` 产 is/class/style/events（渲染 DOM 元素），否则产 color 等数据属性（canvas 绘制消费）。
- link/tag canvas 条目平铺 `{ kind, text, onItemClick }`（识别 kind 优先，onItemClick 自持 cell-item-click 派发、payload 与 DOM 版同构）；check/img 未改造，仍走 is/attrs/events。
- 消费端 `table/base/table-row.vue` 须 `v-on="item.events ?? {}"` 兜底——text/image 等产物无 events，强绑 `v-on` 会报 `v-on with no argument expects an object value`；生产端不必强加 events。

## 来源

src/components/table/column-types/（text/list/link/enum/tag/number/date/check/image/index.js）、src/components/table/base/table-row.vue、src/components/table/ex/（cell-paint/、editing/、interaction/），code@b3528d7 起历次演进（20261104-table-column-type、20261106-column-link-hover-button-value）。
