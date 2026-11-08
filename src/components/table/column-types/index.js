import { isString } from '@/utils/type'

import { TextColumn } from './text'
import { EnumColumn } from './enum'
import { RecordNumberColumn } from './record-number'
import { CheckColumn } from './check'
import { BoolColumn } from './bool'
import { DateColumn, DateTimeColumn } from './date'
import { NumberColumn, CurrencyColumn } from './number'
import { LinkColumn } from './link'
import { ListColumn } from './list'
import { TagColumn } from './tag'
import { ButtonColumn } from './button'
import { ImageColumn } from './image'
import { IconColumn } from './icon'

import './style.scss'

// 列类型协议：compile(column, dom) 双通道——dom=true 产经典 table 的 DOM 壳产物
// （base/table.vue 消费），dom=false 产 table-ex 画布纯数据对象（ex/cell-paint
// 消费）；类型级 width/align 为列未配置时的缺省回退；无 compile 的类型走直通
// render（type.render 或类型对象自身即 render 函数，如 rec_no/img）

const ColumnTypes = {
  text: TextColumn,
  enum: EnumColumn,
  rec_no: RecordNumberColumn,
  check: CheckColumn,
  bool: BoolColumn,
  date: DateColumn,
  datetime: DateTimeColumn,
  number: NumberColumn,
  currency: CurrencyColumn,
  link: LinkColumn,
  list: ListColumn,
  tag: TagColumn,
  button: ButtonColumn,
  img: ImageColumn,
  image: ImageColumn,
  icon: IconColumn
}

// type 可为注册名 string 或直传类型定义（自定义对象/函数）；未注册名回退 text
export function resolveColumnType (type) {
  return (isString(type) ? ColumnTypes[type] : type) || ColumnTypes.text
}
