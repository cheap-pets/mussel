import { isString } from 'es-toolkit'

import { TextColumn } from './text'
import { RecordNumberColumn } from './record-number'
import { CheckColumn } from './check'
import { BoolColumn } from './bool'
import { EnumColumn } from './enum'
import { DateColumn, DateTimeColumn } from './date'
import { NumberColumn, CurrencyColumn } from './number'
import { LinkColumn } from './link'
import { TagColumn } from './tag'
import { ImageColumn } from './image'

import './style.scss'

export const ColumnTypes = {
  text: TextColumn,
  rec_no: RecordNumberColumn,
  check: CheckColumn,
  bool: BoolColumn,
  enum: EnumColumn,
  date: DateColumn,
  datetime: DateTimeColumn,
  number: NumberColumn,
  currency: CurrencyColumn,
  link: LinkColumn,
  tag: TagColumn,
  img: ImageColumn,
  image: ImageColumn
}

export function resolveColumnType (type) {
  return (isString(type) ? ColumnTypes[type] : type) || ColumnTypes.text
}
