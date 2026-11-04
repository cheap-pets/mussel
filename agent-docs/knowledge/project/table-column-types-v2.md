# table 列类型体系 v2：list/link 兼容壳/text.link/数组策略

## 结论

- text 列：`link: Boolean` 渲染链色文本（color 转 `.text-{color}`，hover 下划线仅 DOM 面）；不接受数组值（compile 门控落占位链）；无 danger 支持（红色用 `color: 'danger'`）；multiline/lineClamp 保留。
- list 列（新增）：仅数组值；条目 = `string | number | { label?, color?, disabled?, ...任意属性 }`；label 为标准键（caption 兼容并开发期警告）；`link` 是 column 级选项、整列全 text 或全 link（条目级 link 键无效，作为任意属性原样透传）；每项单行超长省略；条目点击 emit `cell-item-click`，payload `{ record, column, item }`（item 含 id 等扩展键原样传出；DOM 无 recordIndex，canvas 含）。
- link 列：兼容壳，注册表层委托 ListColumn（`col.type` 保持 `'link'`，消费方无感）；`danger: true → color 'danger'`、disabled 保留、条目 color 键激活；DOM 布局由横排 inline 改竖排每项一行（canvas 本就竖排）。
- 数组策略：table-ex（canvas）除 list 外一律不拆行（text/number/bool/date/enum 数组值落占位恒 1 行）；DOM 侧 text 数组同样落占位。

## 来源

src/components/table/column-types/{text,list,link,index}.js、src/components/table/ex/{cell-painters,row-geometry,editor,interactions}.js，code@b3528d7。
