import { t } from '@/langs'

// bool 列：无 mappings/options 时缺省渲染 locale 文案（Table.BOOL_TRUE/FALSE，
// 安装期定档无响应式，compile 期取词闭包持有）；带映射走统一 mappable 通道
// （table/mappings.js，String 精确键匹配，不再按真值取 trueText/falseText）
export const BoolColumn = {
  align: 'center',
  compile () {
    const trueText = t('Table.BOOL_TRUE')
    const falseText = t('Table.BOOL_FALSE')

    return ({ value }) => ({ text: value == null ? null : (value ? trueText : falseText) })
  }
}
