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
