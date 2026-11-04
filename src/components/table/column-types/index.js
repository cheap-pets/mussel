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
import { ImageColumn } from './image'

import './style.scss'

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
  img: ImageColumn,
  image: ImageColumn
}

export function resolveColumnType (type) {
  return (isString(type) ? ColumnTypes[type] : type) || ColumnTypes.text
}
