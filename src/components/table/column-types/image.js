// 直通 render 形态（类型对象本身即 render，无 compile）：仅产 DOM 条目，
// canvas 侧 resolveItemKind 按 is:'img' 回退识别后走图片加载绘制链
export const ImageColumn = ({ value }) => ({
  items: [
    {
      is: 'img',
      text: null,
      attrs: {
        class: 'mu-table__cell-img',
        loading: 'lazy',
        src: value
      }
    }
  ]
})
